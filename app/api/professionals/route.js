import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function sanitizeForFirestore(obj) {
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null || value === "" || Number.isNaN(value)) continue;
        if (typeof value === "object" && !Array.isArray(value)) {
            clean[key] = sanitizeForFirestore(value);
        } else {
            clean[key] = value;
        }
    }
    return clean;
}

export async function POST(req) {
    try {
        const { profession, region } = await req.json();

        if (!profession || !region) {
            return NextResponse.json({ error: "Profession and region are required." }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        console.log("Gemini key loaded:", process.env.GEMINI_API_KEY ? "✅ Yes" : "❌ No");

        const prompt = `
Generate a list (JSON only) of 10–20 top professionals in the field of ${profession} from ${region}.
Each professional should be an object with the following keys:
{
  "fullName": "string",
  "gender": "string",
  "ageAndDOB": "string",
  "specificExpertise": "string",
  "institutionAffiliation": "string",
  "location": "string",
  "bio": "A short professional biography describing their expertise, experience, and notable work (2–3 sentences)"
}
Return valid JSON only — no markdown, no explanations.
`;

        let resultText = "";
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const response = await model.generateContent(prompt);
                resultText = response.response.text().replace(/```json|```/g, "").trim();
                if (resultText) break;
            } catch (err) {
                console.error(`Attempt ${attempt + 1} failed:`, err);
                if (attempt === 2) throw err;
                await new Promise((r) => setTimeout(r, 3000));
            }
        }

        if (!resultText) throw new Error("No response text from Gemini.");

        let parsed;
        try {
            parsed = JSON.parse(resultText);
        } catch (e) {
            console.error("❌ JSON parse failed, trying cleanup:", e);
            const fixed = resultText
                .replace(/^[^{\[]+/, "")
                .replace(/[^}\]]+$/, "")
                .replace(/\n/g, " ")
                .trim();
            parsed = JSON.parse(fixed);
        }

        let professionals = [];
        if (Array.isArray(parsed)) {
            professionals = parsed;
        } else if (parsed?.data) {
            professionals = parsed.data;
        } else if (parsed?.professionals) {
            professionals = parsed.professionals;
        } else {
            professionals = Object.values(parsed).flatMap((v) =>
                Array.isArray(v) ? v : [v]
            );
        }

        if (!professionals.length) {
            return NextResponse.json(
                { error: "No valid professionals found from Gemini output." },
                { status: 500 }
            );
        }

        let savedCount = 0;
        let savedIds = [];

        for (const person of professionals) {
            const safeData = sanitizeForFirestore({
                fullName: person.fullName || person.name || "Unnamed Professional",
                gender: person.gender || "Not specified",
                ageAndDOB: person.ageAndDOB || "Not specified",
                specificExpertise: person.specificExpertise || "Not specified",
                institutionAffiliation: person.institutionAffiliation || person.affiliation || "Unknown",
                location: person.location || "Unknown",
                bio: person.bio || `A seasoned professional in ${profession} from ${region}.`,
                profession,
                category: profession,
                region,
                approvalStatus: "pending", // ✅ standardized
                createdAt: new Date().toISOString(),
            });


            const docRef = await addDoc(collection(db, "Prof_LIST_A"), safeData);
            savedIds.push(docRef.id);
            savedCount++;
        }

        console.log(`✅ Saved ${savedCount} professionals to Firestore`);
        console.log("🔥 Saved professionals IDs:", savedIds);

        return NextResponse.json(
            {
                message: `Saved ${savedCount} professionals successfully.`,
                count: savedCount,
                savedIds,
                success: true,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("❌ API Error:", error);
        return NextResponse.json(
            { error: error.message || "Server error", success: false },
            { status: 500 }
        );
    }
}
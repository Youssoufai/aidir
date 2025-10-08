import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function GET(req, { params }) {
    const { id } = params;

    try {
        // Fetch existing professional from Firestore
        const ref = doc(db, "Prof_LIST_A", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return NextResponse.json({ error: true, message: "Profile not found" }, { status: 404 });

        let profile = snap.data();

        // Only call Gemini if profile is incomplete
        const needsUpdate = !profile.fullName || !profile.profession || !profile.businessLocation;
        if (needsUpdate) {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            const prompt = `You are a professional data API.
Provide all publicly available information about the person below.
Return ONLY JSON, no explanations.

Person Data:
${JSON.stringify(profile)}

Return a JSON object including:
fullName, profession/title, businessLocation, country, citizenships, email, phone, education, experience, skills, achievements, awards, affiliations, socialLinks, ratings, reviews`;

            const result = await model.generateContent(prompt);
            let text = result.response.text().replace(/```json|```/g, "").trim();
            let geminiData;
            try {
                geminiData = JSON.parse(text);
            } catch {
                geminiData = {};
            }

            // Merge with existing profile
            profile = { ...profile, ...geminiData };

            // Update Firestore
            await updateDoc(ref, profile);
        }

        return NextResponse.json({ error: false, profile });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: true, message: "Something went wrong" }, { status: 500 });
    }
}

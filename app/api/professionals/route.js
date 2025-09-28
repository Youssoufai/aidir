// app/api/professionals/route.js
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json(
        { error: true, message: "Prompt is required", professionals: [] },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // --- retry logic ---
    let result;
    let attempt = 0;
    while (attempt < 3) {
      try {
        result = await model.generateContent(
          `You are a data API.
Return ONLY a valid JSON object.
Do not include explanations or code fences.

Using the following criteria:

${prompt}

Return the data in this structure:

{
  "countries": [
    {
      "country": "Country Name",
      "professionals": [
        {
          "fullName": "First Last Other",
          "specificExpertise": "text",
          "affiliation": "text",
          "businessLocation": "City, Country",
          "citizenships": ["Country1","Country2"]
        }
      ]
    }
  ]
}`
        );
        break;
      } catch (err) {
        if (err.status === 503) {
          attempt++;
          console.warn(`Gemini overloaded, retrying ${attempt}/3 ...`);
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          if (attempt === 3) throw err;
        } else {
          throw err;
        }
      }
    }

    let text = result.response.text();
    text = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("Gemini returned non-JSON:", text);
      return NextResponse.json(
        { error: true, message: "Gemini returned invalid JSON", professionals: [] },
        { status: 500 }
      );
    }

    // 🔹 Flatten professionals array for frontend
    const professionals = (parsed.countries || []).flatMap((c) => c.professionals || []);

    // 🔹 Save to Firestore
    const docRef = await addDoc(collection(db, "Prof_LIST_A"), {
      prompt,
      professionals,
      status: "Profile Not Generated",
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ error: false, id: docRef.id, professionals });
  } catch (err) {
    console.error("Gemini Error:", err);
    const status = err?.status || 500;
    const message =
      status === 503
        ? "Gemini model is overloaded. Please try again later."
        : "Something went wrong.";
    return NextResponse.json({ error: true, message, professionals: [] }, { status });
  }
}

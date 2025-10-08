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
        result = await model.generateContent(`
You are a professional data API. Return ONLY valid JSON. No explanations, no code fences. 

Generate a list of professionals using the following prompt:

${prompt}

For each professional, return all available information. Use this structure:

{
  "countries": [
    {
      "country": "Country Name",
      "professionals": [
        {
          "fullName": "First Last",            // Required
          "title": "Job title or specific expertise",
          "affiliation": "Organization or company",
          "businessLocation": "City, Country",
          "citizenships": ["Country1", "Country2"],
          "email": "Email if available",
          "phone": "Phone if available",
          "education": "Degrees, certifications, schools",
          "experience": "Years of experience or roles",
          "achievements": ["Achievement1","Achievement2"],
          "skills": ["Skill1","Skill2"],
          "ratings": 0-5,
          "reviews": Number of reviews,
          "availability": "Available Now or timeframe",
          "image": "URL of profile image"
        }
      ]
    }
  ]
}

If any field is unknown, use "Unknown" for strings, 0 for numbers, empty array for lists. Ensure the JSON parses correctly.
        `);
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

    // Clean and parse Gemini output
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

    // Flatten and normalize professionals
    const professionals = (parsed.countries || []).flatMap((c) =>
      (c.professionals || []).map((p) => ({
        id: "", // will set after saving
        country: c.country || "Unknown",
        fullName: p.fullName || "Unknown",
        title: p.title || "Unknown",
        affiliation: p.affiliation || "Unknown",
        businessLocation: p.businessLocation || "Unknown",
        citizenships: p.citizenships || [],
        email: p.email || "Unknown",
        phone: p.phone || "Unknown",
        education: p.education || "Unknown",
        experience: p.experience || "Unknown",
        achievements: p.achievements || [],
        skills: p.skills || [],
        ratings: p.ratings || 0,
        reviews: p.reviews || 0,
        availability: p.availability || "Available Now",
        image: p.image || "",
      }))
    );

    // Save each professional as a separate document
    const savedProfessionals = [];
    for (const pro of professionals) {
      const docRef = await addDoc(collection(db, "Prof_LIST_A"), {
        ...pro,
        status: "Profile Not Generated",
        createdAt: serverTimestamp(),
      });
      savedProfessionals.push({ ...pro, id: docRef.id });
    }

    return NextResponse.json({ error: false, professionals: savedProfessionals });
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

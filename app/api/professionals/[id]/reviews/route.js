import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { NextResponse } from "next/server";

// ✅ Fetch all reviews for a specific professional
export async function GET(req, { params }) {
    try {
        const { id } = await params; // ✅ await params
        const q = query(collection(db, "Prof_LIST_A_reviews"), where("profileId", "==", id));
        const snapshot = await getDocs(q);

        const reviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(reviews, { status: 200 });
    } catch (error) {
        console.error("🔥 Error fetching reviews:", error);
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}

// ✅ Add a new review
export async function POST(req, { params }) {
    try {
        const { id } = await params; // ✅ await params
        const { text, createdAt } = await req.json();

        const docRef = await addDoc(collection(db, "Prof_LIST_A_reviews"), {
            profileId: id,
            text,
            createdAt,
        });

        return NextResponse.json(
            { success: true, review: { id: docRef.id, text, createdAt } },
            { status: 201 }
        );
    } catch (error) {
        console.error("🔥 Error adding review:", error);
        return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
    }
}

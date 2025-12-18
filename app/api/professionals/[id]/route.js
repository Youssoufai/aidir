import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(req, context) {
    const { params } = context;
    const { id } = await params; // ✅ Await params for App Router

    try {
        const docRef = doc(db, "Prof_LIST_A", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return NextResponse.json({ error: "Professional not found" }, { status: 404 });
        }

        return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
    } catch (err) {
        console.error("Fetch Professional Error:", err);
        return NextResponse.json({ error: "Failed to fetch professional" }, { status: 500 });
    }
}

export async function POST(req, context) {
    const { params } = context;
    const { id } = await params;

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    try {
        const docRef = doc(db, "Prof_LIST_A", id);
        await updateDoc(docRef, { status: "approved" });
        return NextResponse.json({ success: "Professional approved!" });
    } catch (err) {
        console.error("Approve Error:", err);
        return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
    }
}

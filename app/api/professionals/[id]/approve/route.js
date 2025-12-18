import { NextResponse } from "next/server";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req, { params }) {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const docRef = doc(db, "Prof_LIST_A", id);

    try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return NextResponse.json({ error: "Professional not found" }, { status: 404 });
        }

        await updateDoc(docRef, { approvalStatus: "approved" });

        return NextResponse.json({ success: "Professional approved!" });
    } catch (err) {
        console.error("Approve Error:", err);
        return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
    }
}

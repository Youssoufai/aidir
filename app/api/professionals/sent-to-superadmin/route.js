// app/api/professionals/sent-to-superadmin/route.js
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

// GET: Fetch all profiles sent to superAdmin
export async function GET() {
    try {
        const colRef = collection(db, "Prof_LIST_A");
        const q = query(colRef, where("status", "==", "sent_to_superadmin"));
        const snapshot = await getDocs(q);

        const professionals = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(professionals, { status: 200 });
    } catch (err) {
        console.error("FETCH SUPERADMIN PROFESSIONALS ERROR:", err);
        return NextResponse.json({ error: "Failed to fetch professionals" }, { status: 500 });
    }
}

// POST: Send a profile to superAdmin
export async function POST(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: "Professional ID is required" }, { status: 400 });
        }

        const ref = doc(db, "Prof_LIST_A", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        const data = snap.data();

        if (data.status === "sent_to_superadmin") {
            return NextResponse.json({ error: "Profile already sent to SuperAdmin" }, { status: 400 });
        }

        await updateDoc(ref, { status: "sent_to_superadmin" });

        return NextResponse.json({ success: true, message: "Profile sent to SuperAdmin" }, { status: 200 });
    } catch (err) {
        console.error("SEND TO SUPERADMIN ERROR:", err);
        return NextResponse.json({ error: "Failed to send to SuperAdmin" }, { status: 500 });
    }
}

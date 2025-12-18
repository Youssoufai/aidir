// app/api/professionals/[id]/publish/route.js
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";

export async function POST(req, { params }) {
    const { id } = params;

    try {
        // 1️⃣ Get the professional from Prof_LIST_A
        const profRef = doc(db, "Prof_LIST_A", id);
        const profSnap = await getDoc(profRef);
        if (!profSnap.exists()) {
            return new Response(JSON.stringify({ message: "Professional not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }
        const profData = profSnap.data();

        // 2️⃣ Copy to Prof_LIST_B
        const newProfRef = doc(collection(db, "Prof_LIST_B"), id); // keep same ID
        await setDoc(newProfRef, { ...profData, publishedAt: new Date().toISOString() });

        // 3️⃣ Update status in Prof_LIST_A (optional)
        await setDoc(profRef, { status: "published" }, { merge: true });

        return new Response(JSON.stringify({ message: "Professional published successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ message: "Publish failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

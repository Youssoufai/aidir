// app/api/professionals/[id]/delete/route.js
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

export async function DELETE(req, { params }) {
    const { id } = params;

    try {
        const profRef = doc(db, "Prof_LIST_A", id);
        await deleteDoc(profRef);

        return new Response(JSON.stringify({ message: "Professional deleted successfully" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ message: "Delete failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

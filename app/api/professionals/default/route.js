import { NextResponse } from "next/server";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
    try {
        // ✅ PUBLIC DATA ONLY
        const q = query(
            collection(db, "Prof_LIST_B"),
            orderBy("publishedAt", "desc")
        );

        const snapshot = await getDocs(q);

        const professionals = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(professionals, { status: 200 });
    } catch (err) {
        console.error("Fetch Published Professionals Error:", err);
        return NextResponse.json(
            { error: "Failed to fetch published professionals" },
            { status: 500 }
        );
    }
}

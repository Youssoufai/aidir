// scripts/fixProfessionalStatus.js (run once in Firebase console or as a script)
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function fixExistingProfessionals() {
    const snapshot = await getDocs(collection(db, "Prof_LIST_A"));

    const updates = [];
    snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.status) {
            updates.push(
                updateDoc(doc(db, "Prof_LIST_A", docSnap.id), {
                    status: "pending"
                })
            );
        }
    });

    await Promise.all(updates);
    console.log(`Updated ${updates.length} professionals with pending status`);
}

// Call this once
fixExistingProfessionals();
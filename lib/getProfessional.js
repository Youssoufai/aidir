// lib/getProfessional.js
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function getProfessionalById(id) {
    const snapshot = await getDoc(doc(db, "Prof_LIST_A", id));

    if (!snapshot.exists()) {
        throw new Error("Profile not found");
    }

    // Return document data at top-level
    return { id: snapshot.id, ...snapshot.data() };
}

// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getFirestore,
    collection,
    getDocs,
    writeBatch,
    doc,
    deleteField
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initializing app in Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Export Firestore database
export const db = getFirestore(app);

async function resetStatus() {
    try {
        const colRef = collection(db, "Prof_LIST_A");
        const snapshot = await getDocs(colRef);

        const batch = writeBatch(db);
        snapshot.forEach((docSnap) => {
            batch.update(doc(db, "Prof_LIST_A", docSnap.id), { status: deleteField() });
        });

        await batch.commit();
        console.log(`✅ Reset status field for ${snapshot.size} professionals.`);
    } catch (err) {
        console.error("❌ Error resetting status:", err);
    }
}

// 🔹 Only run this manually when needed
// resetStatus();

// ✅ Export Auth instance
export const auth = getAuth(app);

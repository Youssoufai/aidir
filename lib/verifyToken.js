// /lib/verifyToken.js
import { auth, db } from "@/lib/firebase";
import { getDoc, doc } from "firebase/firestore";
import { verifyIdToken } from "firebase-admin/auth"; // For backend token verification

// 🔹 Ensure Firebase Admin is initialized (Only runs once)
import admin from "firebase-admin";
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

export async function verifyToken(req) {
    try {
        // 🔹 Get token from headers or cookies
        const token = req.headers.get("Authorization")?.split("Bearer ")[1]
            || req.cookies.get("token")?.value;

        if (!token) return null;

        // 🔹 Decode Firebase Auth Token
        const decoded = await admin.auth().verifyIdToken(token);
        const uid = decoded.uid;

        // 🔹 Fetch role from Firestore (/users/{uid})
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            console.error("User data not found in Firestore");
            return null;
        }

        const userData = userSnap.data();

        return {
            uid,
            email: decoded.email || userData.email,
            role: userData.role || "user",
        };
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

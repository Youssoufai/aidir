// app/api/professionals/[id]/route.js
import { db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    updateDoc,
    collection,
    addDoc,
    query,
    orderBy,
    limit as fbLimit,
    startAfter,
    getDocs,
    where,
    serverTimestamp,
} from "firebase/firestore";

/**
 * Helper to respond with JSON and status for Next.js App Router
 */
function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

/**
 * GET profile
 */
export async function GET(req, { params }) {
    try {
        const { id } = params;

        // If the path contains "/reviews" we forward to reviews handler
        const url = new URL(req.url);
        if (url.pathname.endsWith("/reviews") || url.pathname.includes("/reviews?")) {
            return handleGetReviews(req, id);
        }

        const docRef = doc(db, "Prof_LIST_A", id);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
            return jsonResponse({ error: true, message: "Profile not found" }, 404);
        }

        return jsonResponse({ error: false, profile: { id: snap.id, ...snap.data() } }, 200);
    } catch (err) {
        console.error("Error fetching profile:", err);
        return jsonResponse({ error: true, message: "Server error fetching profile" }, 500);
    }
}

/**
 * PUT profile (update)
 */
export async function PUT(req, { params }) {
    try {
        const { id } = params;
        const body = await req.json();

        const updatable = {};
        // only allow these fields to be updated by frontend
        const allowed = ["fullName", "title", "businessLocation", "bio", "skills", "affiliation", "availability"];
        for (const k of allowed) {
            if (body[k] !== undefined) updatable[k] = body[k];
        }

        // normalize skills to array if string provided
        if (typeof updatable.skills === "string") {
            updatable.skills = updatable.skills.split(",").map((s) => s.trim()).filter(Boolean);
        }

        updatable.updatedAt = serverTimestamp();

        const docRef = doc(db, "Prof_LIST_A", id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
            return jsonResponse({ error: true, message: "Profile not found" }, 404);
        }

        await updateDoc(docRef, updatable);

        const updatedSnap = await getDoc(docRef);
        return jsonResponse({ error: false, profile: { id: updatedSnap.id, ...updatedSnap.data() } }, 200);
    } catch (err) {
        console.error("Error updating profile:", err);
        return jsonResponse({ error: true, message: "Server error updating profile" }, 500);
    }
}

/**
 * POST reviews: route = /api/professionals/:id/reviews
 */
export async function POST(req, { params }) {
    try {
        const { id } = params;
        const url = new URL(req.url);

        // if request is to /reviews, create a review
        if (url.pathname.endsWith("/reviews")) {
            return handlePostReview(req, id);
        }

        // If POST to profile base isn't for reviews, reject (we only support reviews via POST here)
        return jsonResponse({ error: true, message: "Unsupported POST on this route" }, 400);
    } catch (err) {
        console.error("Error in POST handler:", err);
        return jsonResponse({ error: true, message: "Server error" }, 500);
    }
}

/**
 * Handle GET reviews with pagination (page, limit)
 */
async function handleGetReviews(req, profileId) {
    try {
        const url = new URL(req.url);
        const page = Number(url.searchParams.get("page") || "1");
        const limit = Number(url.searchParams.get("limit") || "5");
        const offset = (page - 1) * limit;

        const reviewsRef = collection(db, "Prof_LIST_A_reviews");
        // We'll store reviews with a field profileId for simple cross-collection queries
        const q = query(reviewsRef, where("profileId", "==", profileId), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // client expects paginated slice and total
        const paged = all.slice(offset, offset + limit);

        return jsonResponse({ error: false, reviews: paged, total: all.length }, 200);
    } catch (err) {
        console.error("Error fetching reviews:", err);
        return jsonResponse({ error: true, message: "Error fetching reviews" }, 500);
    }
}

/**
 * Handle POST review: save into Prof_LIST_A_reviews collection and update aggregate values on profile
 */
async function handlePostReview(req, profileId) {
    try {
        const body = await req.json();
        // expected: { rating: number(1-5), comment?: string, userName?: string (optional) }
        const rating = Number(body.rating || 0);
        const comment = body.comment || "";
        const userName = body.userName || "Anonymous";

        if (!rating || rating < 1 || rating > 5) {
            return jsonResponse({ error: true, message: "Rating must be 1-5" }, 400);
        }

        // Save review in a reviews collection; attach profileId so we can query
        const reviewDoc = {
            profileId,
            rating,
            comment,
            userName,
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "Prof_LIST_A_reviews"), reviewDoc);

        // Recompute aggregate (simple approach: fetch all reviews and compute avg)
        const reviewsSnap = await getDocs(query(collection(db, "Prof_LIST_A_reviews"), where("profileId", "==", profileId)));
        const reviews = reviewsSnap.docs.map((d) => d.data());
        const total = reviews.length;
        const avg = total > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;

        // update profile doc with aggregated values
        const profileRef = doc(db, "Prof_LIST_A", profileId);
        await updateDoc(profileRef, {
            avgRating: avg,
            reviewsCount: total,
            updatedAt: serverTimestamp(),
        });

        return jsonResponse({ error: false, message: "Review saved", total, avg }, 201);
    } catch (err) {
        console.error("Error saving review:", err);
        return jsonResponse({ error: true, message: "Error saving review" }, 500);
    }
}

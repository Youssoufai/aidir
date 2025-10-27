// app/profile/[id]/page.client.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Mail,
    Phone,
    MapPin,
    Award,
    Briefcase,
    GraduationCap,
    Star,
    ArrowLeft,
    Edit,
    Save,
    X,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ProfileDetails() {
    const { id } = useParams();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // auth user
    const [user, setUser] = useState(null);

    // edit state
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});

    // reviews pagination
    const [reviews, setReviews] = useState([]);
    const [revPage, setRevPage] = useState(1);
    const [revPageSize, setRevPageSize] = useState(5);
    const [reviewsTotal, setReviewsTotal] = useState(0);
    const [reviewLoading, setReviewLoading] = useState(false);

    // review form
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!id) return;
        fetchProfile();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        fetchReviews();
    }, [id, revPage, revPageSize]);

    async function fetchProfile() {
        setLoading(true);
        try {
            const res = await fetch(`/api/professionals/${id}`);
            const data = await res.json();
            if (res.ok && !data.error && data.profile) {
                setProfile(data.profile);
                setForm({
                    fullName: data.profile.fullName || "",
                    title: data.profile.title || data.profile.profession || "",
                    businessLocation: data.profile.businessLocation || data.profile.location || "",
                    bio: data.profile.bio || data.profile.description || "",
                    skills: (data.profile.skills || []).join(", "),
                });
            } else {
                setProfile(null);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }

    async function fetchReviews() {
        setReviewLoading(true);
        try {
            const res = await fetch(`/api/professionals/${id}/reviews?page=${revPage}&limit=${revPageSize}`);
            const data = await res.json();
            if (res.ok && !data.error) {
                setReviews(data.reviews || []);
                setReviewsTotal(data.total || 0);
            } else {
                setReviews([]);
                setReviewsTotal(0);
            }
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setReviews([]);
            setReviewsTotal(0);
        } finally {
            setReviewLoading(false);
        }
    }

    async function handleSaveProfile() {
        // Basic validation
        setLoading(true);
        try {
            const payload = {
                fullName: form.fullName,
                title: form.title,
                businessLocation: form.businessLocation,
                bio: form.bio,
                skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
            };

            const res = await fetch(`/api/professionals/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok && !data.error) {
                alert("Profile updated");
                setEditing(false);
                fetchProfile();
            } else {
                console.error("Update error:", data);
                alert(data.message || "Failed to update profile");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update profile");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmitReview(e) {
        e.preventDefault();
        if (!user) {
            alert("You must be signed in to post a review.");
            return;
        }
        if (rating < 1 || rating > 5) {
            alert("Rating must be 1-5.");
            return;
        }

        setSubmittingReview(true);
        try {
            const payload = { rating, comment };
            const res = await fetch(`/api/professionals/${id}/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok && !data.error) {
                setRating(5);
                setComment("");
                // refresh reviews & profile (avg rating)
                setRevPage(1);
                await fetchReviews();
                await fetchProfile();
                alert("Review submitted.");
            } else {
                console.error("Review error:", data);
                alert(data.message || "Failed to submit review");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    }

    if (loading)
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-600">
                Loading professional details...
            </div>
        );

    if (!profile) {
        return (
            <main className="min-h-screen bg-gray-50 py-10">
                <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8 relative">
                    <button onClick={() => router.back()} className="absolute top-4 left-4 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back</span>
                    </button>

                    <div className="text-center mt-4 mb-6">
                        <h1 className="text-2xl font-semibold text-gray-800">Unnamed Professional</h1>
                        <p className="text-gray-600 mt-1">Not specified</p>
                        <p className="flex items-center justify-center text-sm text-gray-500 mt-1">
                            <MapPin className="w-4 h-4 mr-1" /> Unknown
                        </p>
                    </div>

                    <p className="text-center text-gray-500">This professional profile could not be found.</p>
                </div>
            </main>
        );
    }

    // compute avg rating if present (some records store rating fields differently)
    const avgRating = profile.avgRating || profile.ratings || null;

    return (
        <main className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8 relative">
                {/* Back button */}
                <button onClick={() => router.back()} className="absolute top-4 left-4 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back</span>
                </button>

                {/* Header */}
                <div className="text-center mt-4 mb-6">
                    <div className="flex justify-center items-center gap-3">
                        <h1 className="text-2xl font-semibold text-gray-800">{profile.fullName || "Unnamed Professional"}</h1>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{avgRating ? `${Number(avgRating).toFixed(1)} ★` : "No ratings"}</span>
                            <span className="text-gray-400">·</span>
                            <span className="text-xs text-gray-500">{profile.reviewsCount || reviewsTotal || 0} reviews</span>
                        </div>
                    </div>
                    <p className="text-gray-600 mt-1">{profile.title || profile.profession || "Not specified"}</p>
                    <p className="flex items-center justify-center text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {profile.businessLocation || profile.location || "Unknown"}
                    </p>
                </div>

                {/* Edit button if user available */}
                <div className="flex justify-end mb-4">
                    {user && (
                        <div>
                            {!editing ? (
                                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-1 rounded border hover:bg-gray-50">
                                    <Edit className="w-4 h-4" /> Edit
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={handleSaveProfile} className="flex items-center gap-2 px-3 py-1 rounded bg-indigo-600 text-white">
                                        <Save className="w-4 h-4" /> Save
                                    </button>
                                    <button onClick={() => { setEditing(false); setForm({ ...form }); }} className="flex items-center gap-2 px-3 py-1 rounded border">
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Info / Edit Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {!editing ? (
                        <>
                            <InfoCard icon={<Mail className="w-4 h-4" />} label="Email" value={profile.email} />
                            <InfoCard icon={<Phone className="w-4 h-4" />} label="Phone" value={profile.phone} />
                            <InfoCard icon={<GraduationCap className="w-4 h-4" />} label="Education" value={profile.education} />
                            <InfoCard icon={<Briefcase className="w-4 h-4" />} label="Experience" value={profile.experience} />
                            <InfoCard icon={<Award className="w-4 h-4" />} label="Achievements" value={(profile.achievements || []).join(", ") || "None"} />
                            <InfoCard icon={<Star className="w-4 h-4 text-yellow-500" />} label="Rating" value={avgRating ? `${Number(avgRating).toFixed(1)} ★` : "No ratings"} />
                        </>
                    ) : (
                        <>
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-sm text-gray-600">Full name</label>
                                <input className="w-full border rounded px-3 py-2" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
                                <label className="text-sm text-gray-600">Title</label>
                                <input className="w-full border rounded px-3 py-2" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                                <label className="text-sm text-gray-600">Location</label>
                                <input className="w-full border rounded px-3 py-2" value={form.businessLocation} onChange={(e) => setForm((f) => ({ ...f, businessLocation: e.target.value }))} />
                                <label className="text-sm text-gray-600">Bio</label>
                                <textarea className="w-full border rounded px-3 py-2" rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
                                <label className="text-sm text-gray-600">Skills (comma separated)</label>
                                <input className="w-full border rounded px-3 py-2" value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} />
                            </div>
                        </>
                    )}
                </div>

                {/* Skills */}
                {profile.skills?.length > 0 && !editing && (
                    <div className="mt-8">
                        <h3 className="text-gray-700 font-semibold mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full">{skill}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Extra Details */}
                <div className="mt-8 text-sm text-gray-600 space-y-1">
                    <p><strong>Affiliation:</strong> {profile.institutionAffiliation || profile.affiliation || "Unknown"}</p>
                    <p><strong>Country:</strong> {profile.country || "Unknown"}</p>
                    <p><strong>Availability:</strong> {profile.availability || "Available Now"}</p>
                    <p><strong>Citizenships:</strong> {(profile.citizenships || []).join(", ") || "Not provided"}</p>
                    <p><strong>Created:</strong> {profile.createdAt ? new Date(profile.createdAt.seconds ? profile.createdAt.seconds * 1000 : profile.createdAt).toLocaleString() : "N/A"}</p>
                </div>

                {/* Reviews & Rating */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold">Reviews</h3>
                    <p className="text-sm text-gray-500">Read feedback from other users and add your own rating.</p>

                    {/* Submit review */}
                    <form onSubmit={handleSubmitReview} className="mt-4 bg-gray-50 p-4 rounded">
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-600">Your rating:</label>
                            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border rounded px-2 py-1">
                                <option value={5}>5 - Excellent</option>
                                <option value={4}>4 - Very good</option>
                                <option value={3}>3 - Good</option>
                                <option value={2}>2 - Fair</option>
                                <option value={1}>1 - Poor</option>
                            </select>
                        </div>
                        <div className="mt-3">
                            <textarea className="w-full border rounded px-3 py-2" rows={3} placeholder="Write a short review (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <button type="submit" disabled={submittingReview} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">
                                {submittingReview ? "Submitting..." : "Submit review"}
                            </button>
                            <div className="text-sm text-gray-500">You must be signed in to post.</div>
                        </div>
                    </form>

                    {/* Reviews list */}
                    <div className="mt-4">
                        {reviewLoading ? (
                            <p className="text-sm text-gray-500">Loading reviews...</p>
                        ) : reviews.length === 0 ? (
                            <p className="text-sm text-gray-500">No reviews yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {reviews.map((r) => (
                                    <div key={r.id} className="p-3 bg-white border rounded">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                                                    {r.userInitial || (r.userName ? r.userName.charAt(0).toUpperCase() : "U")}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-800">{r.userName || "Anonymous"}</div>
                                                    <div className="text-xs text-gray-500">{new Date(r.createdAt?.seconds ? r.createdAt.seconds * 1000 : r.createdAt).toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-700">{r.rating} ★</div>
                                        </div>
                                        {r.comment && <p className="mt-2 text-sm text-gray-600">{r.comment}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reviews pagination */}
                    {reviewsTotal > 0 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600">Showing page {revPage} — total reviews {reviewsTotal}</div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setRevPage((p) => Math.max(1, p - 1))} disabled={revPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">
                                    Prev
                                </button>
                                <button onClick={() => setRevPage((p) => p + 1)} disabled={revPage * revPageSize >= reviewsTotal} className="px-3 py-1 border rounded disabled:opacity-50">
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function InfoCard({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="text-indigo-600 mt-1">{icon}</div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="font-medium text-gray-800">{value || "Unknown"}</p>
            </div>
        </div>
    );
}

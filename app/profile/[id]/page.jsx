"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage({ params }) {
    const { id } = use(params);
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [draft, setDraft] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [approving, setApproving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [profileRes, reviewsRes] = await Promise.all([
                    fetch(`/api/professionals/${id}`, { cache: "no-store" }),
                    fetch(`/api/professionals/${id}/reviews`, { cache: "no-store" }),
                ]);

                if (!profileRes.ok) throw new Error("Profile not found");

                const profileData = await profileRes.json();
                const reviewData = await reviewsRes.json();

                setProfile(profileData);
                setDraft(profileData);
                setReviews(Array.isArray(reviewData) ? reviewData : []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchData();
    }, [id]);

    // 🔒 SIMPLE ROLE CHECK
    const canManage =
        profile?.viewerRole === "admin" ||
        profile?.viewerRole === "superadmin";

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch(`/api/professionals/${id}/edit`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(draft),
            });
            if (!res.ok) throw new Error("Failed to save profile");
            setProfile(draft);
            setIsEditing(false);
        } finally {
            setSaving(false);
        }
    }

    async function handleApprove() {
        setApproving(true);
        try {
            const res = await fetch(`/api/professionals/${id}/approve`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Approval failed");
            setProfile(prev => ({ ...prev, approvalStatus: "approved" }));
        } finally {
            setApproving(false);
        }
    }

    async function handleSendToSuperAdmin() {
        setSending(true);
        try {
            const res = await fetch(`/api/professionals/sent-to-superadmin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error("Failed");
            setProfile(prev => ({ ...prev, approvalStatus: "sent_to_superadmin" }));
        } finally {
            setSending(false);
        }
    }

    async function handlePublish() {
        setPublishing(true);
        try {
            const res = await fetch(`/api/professionals/${id}/publish`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Publish failed");
        } finally {
            setPublishing(false);
        }
    }

    if (loading) return <p className="text-center mt-10">Loading profile...</p>;
    if (error) return <p className="text-center mt-10 text-red-500">❌ {error}</p>;

    const Field = ({ label, name }) => (
        <div>
            <strong>{label}:</strong>
            {isEditing ? (
                <input
                    className="w-full border rounded p-2 mt-1"
                    value={draft?.[name] || ""}
                    onChange={(e) => setDraft({ ...draft, [name]: e.target.value })}
                />
            ) : (
                <p>{profile?.[name]}</p>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <button
                onClick={() => router.back()}
                className="mb-4 px-4 py-2 bg-gray-200 rounded"
            >
                ← Back
            </button>

            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow">
                <h1 className="text-3xl font-bold">{profile.fullName}</h1>
                <p className="text-blue-600 font-medium">{profile.profession}</p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Bio" name="bio" />
                    <Field label="Category" name="category" />
                    <Field label="Institution" name="institutionAffiliation" />
                    <Field label="Location" name="location" />
                    <Field label="Expertise" name="specificExpertise" />
                    <Field label="Region" name="region" />
                </div>

                {/* 🔒 BUTTONS ONLY FOR ADMIN / SUPERADMIN */}
                {canManage && (
                    <div className="mt-8 flex flex-wrap gap-3">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-gray-200 rounded"
                            >
                                Edit
                            </button>
                        )}

                        {isEditing && (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setDraft(profile);
                                        setIsEditing(false);
                                    }}
                                    className="px-4 py-2 bg-gray-300 rounded"
                                >
                                    Cancel
                                </button>
                            </>
                        )}

                        {profile.approvalStatus !== "approved" && (
                            <button
                                onClick={handleApprove}
                                className="px-4 py-2 bg-green-600 text-white rounded"
                            >
                                Approve
                            </button>
                        )}

                        {profile.approvalStatus === "approved" && (
                            <button
                                onClick={handleSendToSuperAdmin}
                                className="px-4 py-2 bg-indigo-600 text-white rounded"
                            >
                                Send to SuperAdmin
                            </button>
                        )}

                        {profile.approvalStatus === "sent_to_superadmin" && (
                            <button
                                onClick={handlePublish}
                                className="px-4 py-2 bg-purple-600 text-white rounded"
                            >
                                Publish
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

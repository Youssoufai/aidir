"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ProfileDetails() {
    const { id } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch(`/api/professionals/${id}`);
                const data = await res.json();
                if (res.ok && !data.error) {
                    setProfile(data.profile);
                } else {
                    setError(data.message || "Error fetching profile");
                }
            } catch (err) {
                console.error(err);
                setError("Error fetching profile");
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchProfile();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow space-y-3">
            <h1 className="text-2xl font-semibold mb-4">{profile.fullName || "Unnamed Professional"}</h1>
            <p><strong>Profession:</strong> {profile.profession || profile.title || "Not specified"}</p>
            <p><strong>Country:</strong> {profile.country || "Not specified"}</p>
            <p><strong>Business Location:</strong> {profile.businessLocation || "Not specified"}</p>
            <p><strong>Email:</strong> {profile.email || "Not provided"}</p>
            <p><strong>Phone:</strong> {profile.phone || "Not provided"}</p>
            <p><strong>Education:</strong> {profile.education || "Not specified"}</p>
            <p><strong>Experience:</strong> {profile.experience || "Not specified"}</p>
            <p><strong>Skills:</strong> {profile.skills?.join(", ") || "Not specified"}</p>
            <p><strong>Achievements:</strong> {profile.achievements?.join(", ") || "None"}</p>
            <p><strong>Affiliations:</strong> {profile.affiliations?.join(", ") || "None"}</p>
            <p><strong>Social Links:</strong> {profile.socialLinks?.join(", ") || "None"}</p>
            <p><strong>Approved:</strong> {profile.approved ? "✅ Yes" : "❌ No"}</p>

            <div className="mt-4 text-gray-500 text-sm">
                <p>Profile ID: {profile.id}</p>
                <p>Created: {profile.createdAt ? new Date(profile.createdAt.seconds * 1000).toLocaleString() : "N/A"}</p>
            </div>
        </div>
    );
}

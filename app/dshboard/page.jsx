"use client";

import { useEffect, useState } from "react";

export default function SuperAdminDashboard() {
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch professionals sent to SuperAdmin
    const fetchProfessionals = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/professionals/sent-to-superadmin", {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Failed to fetch professionals");
            const data = await res.json();
            setProfessionals(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfessionals();
    }, []);

    // Final publish by SuperAdmin
    const handlePublish = async (id) => {
        try {
            const res = await fetch(`/api/professionals/${id}/publish`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Publish failed");
            fetchProfessionals();
            alert("Professional published successfully");
        } catch (err) {
            alert(err.message);
        }
    };

    // Edit redirect (or modal)
    const handleEdit = (id) => {
        // You can either open a modal here or redirect to edit page
        window.location.href = `/superadmin/professionals/${id}/edit`;
    };

    // Delete professional
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`/api/professionals/${id}/delete`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            fetchProfessionals();
            alert("Professional deleted successfully");
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p className="text-center mt-10">Loading professionals…</p>;
    if (error) return <p className="text-center mt-10 text-red-500">❌ {error}</p>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">SuperAdmin Dashboard</h1>

            {professionals.length === 0 ? (
                <p className="text-gray-500 text-center">
                    No professionals have been sent by Admin yet.
                </p>
            ) : (
                professionals.map((pro) => (
                    <div
                        key={pro.id}
                        className="border p-5 rounded-xl mb-4 shadow-sm bg-white"
                    >
                        <h2 className="text-lg font-semibold">{pro.fullName}</h2>

                        <p className="text-sm text-gray-600">
                            <strong>Profession:</strong> {pro.profession}
                        </p>

                        <p className="text-sm text-gray-600">
                            <strong>Status:</strong>{" "}
                            <span className="capitalize">{pro.status}</span>
                        </p>

                        <div className="mt-4 flex gap-3 flex-wrap">
                            <button
                                onClick={() => handlePublish(pro.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Publish
                            </button>

                            <button
                                onClick={() => handleEdit(pro.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Edit
                            </button>

                            <button
                                onClick={() => handleDelete(pro.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

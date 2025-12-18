"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DefaultPage() {
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    async function fetchApproved() {
        try {
            const res = await fetch("/api/professionals/default", { cache: "no-store" });
            if (!res.ok) throw new Error("Failed to fetch approved professionals");

            const data = await res.json();
            setProfessionals(data); // already filtered server-side
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchApproved();
        const interval = setInterval(fetchApproved, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <p className="text-center mt-10">Loading approved professionals...</p>;
    if (error) return <p className="text-center mt-10 text-red-500">❌ {error}</p>;

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <h1 className="text-3xl font-bold mb-6">Approved Professionals</h1>
            {professionals.length === 0 ? (
                <p className="text-gray-500 text-center">No approved professionals yet.</p>
            ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {professionals.map((p) => (
                        <li
                            key={p.id}
                            onClick={() => router.push(`/profile/${p.id}`)}
                            className="bg-white p-6 rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition"
                        >
                            <h2 className="font-semibold text-xl mb-2">{p.fullName}</h2>
                            <p className="text-gray-600">{p.profession}</p>
                            <p className="text-gray-400 text-sm mt-1">{p.location}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

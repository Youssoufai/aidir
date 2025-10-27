// app/dashboard/page.client.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, MapPin, ChevronDown } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit as fbLimit,
    startAfter,
} from "firebase/firestore";
import Link from "next/link";

export default function Dashboard() {
    const [location, setLocation] = useState("All Locations");
    const [category, setCategory] = useState("All Categories");
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();

    // pagination (client-side)
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);

    const categories = [
        "artificial intelligence, robotics, autonomous vehicles, or quantum computing",
        "astronomy or astro-physics",
        "quantum technology, quantum physics, quantum mechanics, or nanotechnology",
        "climate technology, energy technology, or environmental technology",
        "bio-technology, genetics, neuro-science, medicine, healthcare",
        "cybersecurity",
        "fintech, blockchain, or crypto-currency",
    ];

    const regions = [
        "All Locations",
        "Africa",
        "North and South America",
        "Europe",
        "Asia",
        "South East Asia and Australia",
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    async function handleLogout() {
        await signOut(auth);
        router.push("/");
    }

    // Firestore fetch with simple filters. This returns ALL matching docs — we paginate client-side.
    async function queryProfessionalsFromFirestore() {
        try {
            let q;
            const collectionRef = collection(db, "Prof_LIST_A");

            if (location !== "All Locations" && category !== "All Categories") {
                q = query(
                    collectionRef,
                    where("region", "==", location),
                    where("category", "==", category),
                    orderBy("createdAt", "desc")
                );
            } else if (location !== "All Locations") {
                q = query(collectionRef, where("region", "==", location), orderBy("createdAt", "desc"));
            } else if (category !== "All Categories") {
                q = query(collectionRef, where("category", "==", category), orderBy("createdAt", "desc"));
            } else {
                // default: pull recent
                q = query(collectionRef, orderBy("createdAt", "desc"));
            }

            const snapshot = await getDocs(q);
            const list = snapshot.docs.map((doc, index) => ({
                id: doc.id || `fallback-${index}`,
                ...doc.data(),
            }));

            return list;
        } catch (err) {
            console.error("Error querying Firestore:", err);
            return [];
        }
    }

    // The merged action:
    // 1) Try to fetch from Firestore
    // 2) If none found, POST to /api/professionals to generate (keeping your generator route)
    // 3) Re-fetch and set list
    async function handleFetchOrGenerate() {
        if (category === "All Categories" || location === "All Locations") {
            alert("Please select both a category and a location.");
            return;
        }

        setLoading(true);
        try {
            // 1) try Firestore
            const existing = await queryProfessionalsFromFirestore();

            if (existing && existing.length > 0) {
                setProfessionals(existing);
                setPage(1);
                // UX: if data already exists, don't call generator
                setLoading(false);
                return;
            }

            // 2) call generator endpoint
            const res = await fetch("/api/professionals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profession: category, region: location }),
            });

            const data = await res.json();
            if (!res.ok) {
                console.error("Generator error:", data);
                alert("Error generating professionals. Check server logs.");
            }

            // 3) re-fetch from Firestore (allow some delay for writes to appear)
            // small delay to let Firestore writes propagate
            await new Promise((r) => setTimeout(r, 1200));
            const afterGen = await queryProfessionalsFromFirestore();

            setProfessionals(afterGen || []);
            setPage(1);
        } catch (err) {
            console.error(err);
            alert("An error occurred while fetching or generating professionals.");
        } finally {
            setLoading(false);
        }
    }

    // Expose a manual "Refresh" that always re-queries Firestore
    async function handleRefresh() {
        setLoading(true);
        try {
            const list = await queryProfessionalsFromFirestore();
            setProfessionals(list);
            setPage(1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // derived paginated items (client-side)
    const totalPages = Math.max(1, Math.ceil(professionals.length / pageSize));
    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return professionals.slice(start, start + pageSize);
    }, [professionals, page, pageSize]);

    return (
        <main className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 bg-white shadow relative">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <Users className="text-white w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-800">ProTalent</h1>
                </div>
                <div className="flex items-center gap-4 relative">
                    {user ? (
                        <div className="relative">
                            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">{user.displayName || user.email}</span>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100" onClick={() => router.push("/profile")}>
                                        Profile
                                    </button>
                                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100" onClick={handleLogout}>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <span className="font-medium text-gray-500">Guest</span>
                    )}
                </div>
            </header>

            {/* Filters */}
            <section className="bg-white shadow-sm rounded-xl p-6 max-w-5xl mx-auto mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block mb-1 font-medium text-gray-600">Region</label>
                        <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                            {regions.map((r) => (
                                <option key={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1 font-medium text-gray-600">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                            <option>All Categories</option>
                            {categories.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end gap-3">
                        <button
                            onClick={handleFetchOrGenerate}
                            disabled={loading}
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? "Working..." : "Fetch / Generate"}
                        </button>

                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* page size control */}
                <div className="mt-4 flex items-center gap-3">
                    <label className="text-sm text-gray-600">Page size:</label>
                    <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="border rounded px-2 py-1">
                        <option value={6}>6</option>
                        <option value={9}>9</option>
                        <option value={12}>12</option>
                    </select>
                </div>
            </section>

            {/* Professionals List */}
            <section className="max-w-6xl mx-auto mt-6 p-6">
                {loading && <p className="text-center text-gray-500">Loading...</p>}
                {!loading && professionals.length === 0 && (
                    <p className="text-center text-gray-500">No professionals found. Use "Fetch / Generate".</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginated.map((pro, index) => (
                        <Link
                            key={pro.id || `pro-${index}`}
                            href={`/profile/${encodeURIComponent(pro.id || index)}`}
                            className="bg-white shadow rounded-xl p-5 flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
                        >
                            <h3 className="font-semibold text-gray-800 text-lg">{pro.fullName || "Unnamed Professional"}</h3>
                            <p className="text-sm text-gray-600 mb-1">{pro.title || pro.profession || "No title"}</p>
                            <div className="flex items-center text-gray-500 text-sm gap-1 mb-2">
                                <MapPin className="w-4 h-4" /> {pro.businessLocation || pro.location || "Remote"}
                            </div>
                            {pro.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {pro.skills.map((s, i) => (
                                        <span key={`${pro.id}-skill-${i}`} className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <p className="text-sm text-gray-600 flex-1 mb-3">
                                {`${pro.fullName || "This professional"} is a ${pro.title || "specialist"} at ${pro.institutionAffiliation || pro.affiliation || "an organization"}.`}
                            </p>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">{pro.availability || "Available"}</span>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Pagination controls */}
                {professionals.length > 0 && (
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing page {page} of {totalPages} — total items {professionals.length}
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">
                                Prev
                            </button>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

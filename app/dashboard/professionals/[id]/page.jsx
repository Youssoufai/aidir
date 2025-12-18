"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, MapPin, ChevronDown } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
    collection,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
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

    // 🔹 Fetch user and role from Firestore
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                const snap = await getDoc(doc(db, "users", u.uid));
                if (snap.exists()) {
                    setUser({ ...u, role: snap.data().role });
                } else {
                    setUser(u);
                }
            } else {
                setUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    async function handleLogout() {
        await signOut(auth);
        router.push("/");
    }

    async function queryProfessionalsFromFirestore() {
        try {
            const collectionRef = collection(db, "Prof_LIST_A");
            let q;

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
                q = query(collectionRef, where("category", "==", category), orderBy("createdAt", "asc"));
            } else {
                q = query(collectionRef, orderBy("createdAt", "desc"));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc, idx) => ({ id: doc.id, ...doc.data() }));
        } catch (err) {
            console.error("Error querying Firestore:", err);
            return [];
        }
    }

    // 🔹 Approval function
    async function approveProfessional(proId) {
        if (!user?.role) return alert("You don't have access");

        const res = await fetch(`/api/professionals/${proId}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: user.role }),
        });

        const data = await res.json();
        alert(data.message);
        handleRefresh();
    }

    // 🔹 Delete function (only Super Admin)
    async function deleteProfessional(proId) {
        if (user?.role !== "super_admin") return alert("Only Super Admin can delete");

        if (!confirm("Are you sure you want to delete this professional?")) return;

        const res = await fetch(`/api/professionals/${proId}/delete`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();
        alert(data.message);
        handleRefresh();
    }

    async function handleFetchOrGenerate() {
        if (category === "All Categories" || location === "All Locations") {
            alert("Please select both a category and a location.");
            return;
        }

        setLoading(true);
        try {
            const existing = await queryProfessionalsFromFirestore();

            if (existing && existing.length > 0) {
                setProfessionals(existing);
                setPage(1);
                setLoading(false);
                return;
            }

            const res = await fetch("/api/professionals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profession: category, region: location }),
            });

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
                <div className="relative">
                    {user ? (
                        <>
                            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">{user?.email}</span>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100" onClick={() => router.push("/profile")}>
                                        Profile
                                    </button>
                                    <button
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100"
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="font-medium text-gray-500">Guest</span>
                    )}
                </div>
            </header>

            {/* Filters */}
            <section className="bg-white shadow-sm rounded-xl p-6 max-w-5xl mx-auto mt-4">
                {/* unchanged filter UI */}
                ...
            </section>

            {/* Professionals List */}
            <section className="max-w-6xl mx-auto mt-6 p-6">
                {loading && <p className="text-center text-gray-500">Loading...</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginated.map((pro) => (
                        <Link
                            key={pro.id}
                            href={`/profile/${pro.id}`}
                            className="bg-white shadow rounded-xl p-5 flex flex-col"
                        >
                            <h3 className="font-semibold text-gray-800 text-lg">{pro.fullName}</h3>
                            <p className="text-sm text-gray-600 mb-1">{pro.title}</p>
                            <div className="flex items-center text-gray-500 text-sm gap-1 mb-2">
                                <MapPin className="w-4 h-4" /> {pro.location || "Remote"}
                            </div>

                            {/* Role-based Actions */}
                            <div className="flex justify-between items-center mt-auto">
                                <span className={`px-3 py-1 text-xs rounded-full 
                                    ${pro.approvalStatus === "approved" ? "bg-green-200 text-green-700" : "bg-yellow-200 text-yellow-700"}`}>
                                    {pro.approvalStatus || "pending"}
                                </span>

                                {user?.role && (
                                    <div className="flex gap-2">
                                        {/* Admin */}
                                        {user.role === "admin" && pro.approvalStatus === "pending" && (
                                            <button
                                                onClick={(e) => { e.preventDefault(); approveProfessional(pro.id); }}
                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                                            >Approve</button>
                                        )}

                                        {/* Director */}
                                        {user.role === "director_admin" && pro.approvalStatus === "admin-approved" && (
                                            <button
                                                onClick={(e) => { e.preventDefault(); approveProfessional(pro.id); }}
                                                className="px-2 py-1 text-xs bg-indigo-600 text-white rounded"
                                            >Approve Level 2</button>
                                        )}

                                        {/* Super Admin */}
                                        {user.role === "super_admin" && (
                                            <>
                                                {pro.approvalStatus !== "approved" && (
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); approveProfessional(pro.id); }}
                                                        className="px-2 py-1 text-xs bg-green-600 text-white rounded"
                                                    >Final Approve</button>
                                                )}

                                                <button
                                                    onClick={(e) => { e.preventDefault(); deleteProfessional(pro.id); }}
                                                    className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                                                >Delete</button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    );
}

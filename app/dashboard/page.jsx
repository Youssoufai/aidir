"use client";

import { useState, useEffect } from "react";
import { Users, MapPin, Star, ChevronDown } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function Home() {
    const [location, setLocation] = useState("All Locations");
    const [category, setCategory] = useState("All Categories");
    const [prompt, setPrompt] = useState("");
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();

    // Categories & Regions
    const categories = [
        "artificial intelligence, robotics, autonomous vehicles, or quantum computing",
        "astronomy or astro-physics",
        "quantum technology, quantum physics, quantum mechanics, or nanotechnology",
        "climate technology, energy technology, or environmental technology",
        "bio-technology, genetics, neuro-science, medicine, healthcare",
        "cybersecurity",
        "fintech, blockchain, or crypto-currency",
    ];
    const regions = ["All Locations", "Africa", "North and South America", "Europe", "Asia", "South East Asia and Australia"];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setUser);
        return () => unsubscribe();
    }, []);

    async function handleLogout() {
        await signOut(auth);
        router.push("/");
    }

    function generateBio(pro) {
        const adjectives = ["renowned", "accomplished", "innovative", "expert", "visionary"];
        const achievements = [
            "leading projects in",
            "pioneering research on",
            "consulting top companies on",
            "developing solutions for",
            "mentoring teams in",
        ];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const achievement = achievements[Math.floor(Math.random() * achievements.length)];
        const skills = pro.skills?.join(", ") || "their field";
        return `${pro.fullName} is a ${adj} ${pro.title}. They have been ${achievement} ${skills}.`;
    }

    async function fetchPrompt() {
        if (category === "All Categories" || location === "All Locations") {
            alert("Please select both a category and a location.");
            return;
        }
        setLoading(true);
        setPrompt("");
        try {
            const q = query(collection(db, "prompts"), where("category", "==", category), where("region", "==", location));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setPrompt(snap.docs[0].data().prompt || "");
            } else {
                alert("No prompt found for this category/location combination.");
            }
        } catch (err) {
            console.error(err);
            alert("Error fetching prompt. Check console.");
        } finally {
            setLoading(false);
        }
    }

    async function generateProfessionals() {
        if (!prompt) return alert("No prompt available. Please fetch a prompt first.");
        setLoading(true);
        setProfessionals([]);

        try {
            const res = await fetch("/api/professionals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const data = await res.json();

            if (res.ok && Array.isArray(data.professionals)) {
                setProfessionals(data.professionals.map((pro) => ({ ...pro, bio: generateBio(pro) })));
            } else {
                alert("No professionals returned. Check console.");
                console.error(data);
            }
        } catch (err) {
            console.error(err);
            alert("Error generating professionals.");
        } finally {
            setLoading(false);
        }
    }

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
                                <img src={user.photoURL || "https://i.pravatar.cc/40"} alt="User" className="w-8 h-8 rounded-full" />
                                <span className="font-medium text-gray-700">{user.displayName || user.email}</span>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100" onClick={() => router.push("/profile")}>Profile</button>
                                    <button className="w-full px-4 py-2 text-left hover:bg-gray-100" onClick={handleLogout}>Logout</button>
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
                        <label className="block mb-1 font-medium text-gray-600">Location</label>
                        <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                            {regions.map((r) => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium text-gray-600">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                            <option>All Categories</option>
                            {categories.map((c) => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end gap-3">
                        <button onClick={fetchPrompt} disabled={category === "All Categories" || location === "All Locations" || loading} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {loading ? "Loading..." : "Fetch Prompt"}
                        </button>
                        <button onClick={generateProfessionals} disabled={!prompt || loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                            {loading ? "Generating..." : "Generate"}
                        </button>
                    </div>
                </div>
            </section>

            {/* Professionals */}
            <section className="max-w-6xl mx-auto mt-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {professionals.map((pro) => (
                        <div key={pro.id} className="bg-white shadow rounded-xl p-5 flex flex-col">
                            <div className="flex items-center gap-3 mb-3">
                                <img src={pro.image || "https://i.pravatar.cc/100"} alt={pro.fullName} className="w-14 h-14 rounded-full object-cover" />
                                <div>
                                    <h3 className="font-semibold text-gray-800">{pro.fullName}</h3>
                                    <p className="text-sm text-gray-600">{pro.title}</p>
                                    <div className="flex items-center text-gray-500 text-sm gap-1">
                                        <MapPin className="w-4 h-4" /> {pro.businessLocation || "Remote"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {pro.skills?.map((s, i) => <span key={i} className="px-2 py-1 text-xs bg-gray-100 rounded-full">{s}</span>)}
                            </div>
                            <p className="text-sm text-gray-600 flex-1 mb-3">{pro.bio}</p>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">{pro.availability}</span>
                            </div>
                            <button onClick={() => router.push(`/profile/${pro.id}`)} className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">View Profile</button>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}

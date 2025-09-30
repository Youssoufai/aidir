"use client";

import { useState, useEffect } from "react";
import { Users, MapPin, Star, ChevronDown } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Home() {
    // 🔹 Filters
    const [location, setLocation] = useState("All Locations");
    const [category, setCategory] = useState("All Categories");

    // 🔹 Data states
    const [prompt, setPrompt] = useState("");
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    async function handleLogout() {
        try {
            await signOut(auth);
            router.push("/"); // redirect to home
        } catch (err) {
            console.error("Error logging out:", err);
        }
    }

    // 🔹 Categories
    const categories = [
        "artificial intelligence, robotics, autonomous vehicles, or quantum computing",
        "astronomy or astro-physics",
        "quantum technology, quantum physics, quantum mechanics, or nanotechnology",
        "climate technology, energy technology, or environmental technology",
        "bio-technology, genetics, neuro-science, medicine, healthcare",
        "cybersecurity",
        "fintech, blockchain, or crypto-currency",
    ];

    // 🔹 Regions
    const regions = [
        "All Locations",
        "Africa",
        "North and South America",
        "Europe",
        "Asia",
        "South East Asia and Australia",
    ];

    // 🔹 Generate a unique bio for each professional
    const generateBio = (pro) => {
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

        return `${pro.fullName} is a ${adj} ${pro.title} based in ${pro.businessLocation || "Remote"
            }. They have been ${achievement} ${skills}, delivering measurable results and innovative solutions.`;
    };

    // 🔹 Fetch prompt from Firestore
    async function fetchPrompt() {
        if (category === "All Categories" || location === "All Locations") {
            alert("Please select both a category and a location.");
            return;
        }

        setLoading(true);
        setPrompt("");
        setProfessionals([]);

        try {
            const q = query(
                collection(db, "prompts"),
                where("category", "==", category),
                where("region", "==", location)
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                const docData = snap.docs[0].data();
                setPrompt(docData.prompt || "");
            } else {
                alert("No prompt found for this category/location combination.");
                setPrompt("");
            }
        } catch (err) {
            console.error("Error fetching prompt:", err);
            alert("Error fetching prompt. Check console for details.");
        } finally {
            setLoading(false);
        }
    }

    // 🔹 Generate professionals
    async function generateProfessionals() {
        if (!prompt) {
            alert("No prompt available. Please fetch a prompt first.");
            return;
        }

        setLoading(true);
        setProfessionals([]);

        try {
            const res = await fetch("/api/professionals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const data = await res.json();

            let pros = [];
            if (res.ok && Array.isArray(data.professionals) && data.professionals.length > 0) {
                pros = data.professionals.map((pro) => ({
                    ...pro,
                    bio: generateBio(pro),
                }));
            } else {
                const fallbackProfessionals = [
                    {
                        fullName: "Jane Doe",
                        title: "AI Specialist",
                        businessLocation: "Europe",
                        rating: 4.9,
                        reviews: 12,
                        skills: ["AI", "Robotics"],
                    },
                    {
                        fullName: "John Smith",
                        title: "Quantum Engineer",
                        businessLocation: "Asia",
                        rating: 4.8,
                        reviews: 20,
                        skills: ["Quantum Physics", "Nanotech"],
                    },
                ];
                pros = fallbackProfessionals.map((pro) => ({
                    ...pro,
                    bio: generateBio(pro),
                }));
            }

            setProfessionals(pros);
        } catch (err) {
            console.error("Error generating professionals:", err);
            alert("Error generating professionals. Using fallback data.");
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
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 focus:outline-none"
                            >
                                <img
                                    src={user.photoURL || "https://i.pravatar.cc/40"}
                                    alt="User"
                                    className="w-8 h-8 rounded-full"
                                />
                                <span className="font-medium text-gray-700">
                                    {user.displayName || user.email}
                                </span>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
                                    <button
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                                        onClick={() => router.push("/profile")}
                                    >
                                        Profile
                                    </button>
                                    <button
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                                        onClick={handleLogout}
                                    >
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

            {/* Hero */}
            <section className="text-center py-12 px-4">
                <h2 className="text-4xl font-bold text-gray-900 mb-3">Find Top Professionals</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Connect with talented professionals across industries. Search through thousands of
                    verified profiles to find the perfect match for your project or team.
                </p>
            </section>

            {/* Filters */}
            <section className="bg-white shadow-sm rounded-xl p-6 max-w-5xl mx-auto mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-gray-600 mb-1 font-medium">Location</label>
                        <select
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-gray-700"
                        >
                            {regions.map((r) => (
                                <option key={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1 font-medium">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-gray-700"
                        >
                            <option>All Categories</option>
                            {categories.map((c) => (
                                <option key={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end gap-3">
                        <button
                            onClick={fetchPrompt}
                            disabled={
                                category === "All Categories" || location === "All Locations" || loading
                            }
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "Fetch Prompt"}
                        </button>
                        <button
                            onClick={generateProfessionals}
                            disabled={!prompt || loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {loading ? "Generating..." : "Generate"}
                        </button>
                    </div>
                </div>
            </section>

            {/* Professionals */}
            <section className="max-w-6xl mx-auto mt-6 p-6">
                {prompt && (
                    <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Generated Search Query</h3>
                        <pre className="bg-gray-50 p-3 rounded text-sm text-gray-800 overflow-x-auto">
                            {prompt}
                        </pre>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {professionals.map((pro, idx) => (
                        <div key={idx} className="bg-white shadow rounded-xl p-5 flex flex-col">
                            <div className="flex items-center gap-3 mb-3">
                                <img
                                    src={pro.image || "https://i.pravatar.cc/100"}
                                    alt={pro.fullName}
                                    className="w-14 h-14 rounded-full object-cover"
                                />
                                <div>
                                    <h3 className="font-semibold text-gray-800">{pro.fullName}</h3>
                                    <p className="text-sm text-gray-600">{pro.title}</p>
                                    <div className="flex items-center text-gray-500 text-sm gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {pro.businessLocation || "Remote"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center text-yellow-500 text-sm mb-2">
                                <Star className="w-4 h-4 fill-yellow-400" />
                                <span className="ml-1 font-medium">{pro.rating || "4.8"}</span>
                                <span className="ml-1 text-gray-500">
                                    ({pro.reviews || 50} reviews)
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {pro.skills?.map((s, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 text-xs bg-gray-100 rounded-full text-gray-700"
                                    >
                                        {s}
                                    </span>
                                ))}
                            </div>

                            <p className="text-sm text-gray-600 flex-1 mb-3">{pro.bio}</p>

                            <div className="flex justify-between items-center mt-auto">
                                <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                    {pro.availability || "Available Now"}
                                </span>
                            </div>

                            <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">
                                View Profile
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}

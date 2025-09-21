"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";

export default function HomePage() {
    const [categories] = useState([
        "artificial intelligence, robotics, autonomous vehicles, or quantum computing",
        "astronomy or astro-physics",
        "quantum technology, quantum physics, quantum mechanics, or nanotechnology",
        "climate technology, energy technology, or environmental technology",
        "bio-technology, genetics, neuro-science, medicine, healthcare",
        "cybersecurity",
        "fintech, blockchain, or crypto-currency",
    ]);

    const [regions] = useState([
        "Africa",
        "North and South America",
        "Europe",
        "Asia",
        "South East Asia and Australia",
    ]);

    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("");
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [professionals, setProfessionals] = useState([]);

    // fetch prompt from Firestore
    async function fetchPrompt() {
        if (!selectedCategory || !selectedRegion) return;

        setLoading(true);
        try {
            const q = query(
                collection(db, "prompts"),
                where("category", "==", selectedCategory),
                where("region", "==", selectedRegion)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                const doc = snap.docs[0].data();
                setPrompt(doc.prompt);
            } else {
                setPrompt("");
                alert("No prompt found for this combo");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // call API to generate professionals
    async function generateProfessionals() {
        if (!prompt) return;

        setLoading(true);
        setProfessionals([]);
        try {
            const res = await fetch("/api/professionals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });
            const data = await res.json();
            if (!data.error) {
                setProfessionals(data.professionals.countries || []);
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">
                aiCoil – Find High Achieving Professionals
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Category
                    </label>
                    <select
                        className="w-full border rounded p-2"
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        value={selectedCategory}
                    >
                        <option value="">Select a Category</option>
                        {categories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">
                        Region
                    </label>
                    <select
                        className="w-full border rounded p-2"
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        value={selectedRegion}
                    >
                        <option value="">Select a Region</option>
                        {regions.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={fetchPrompt}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={!selectedCategory || !selectedRegion || loading}
                >
                    {loading ? "Loading..." : "Fetch Prompt"}
                </button>

                <button
                    onClick={generateProfessionals}
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={!prompt || loading}
                >
                    {loading ? "Generating..." : "Generate Professionals"}
                </button>
            </div>

            {prompt && (
                <div className="bg-gray-100 p-3 rounded mb-6">
                    <p className="text-sm text-gray-600">Prompt Loaded:</p>
                    <p className="text-xs whitespace-pre-wrap">{prompt}</p>
                </div>
            )}

            <div>
                {professionals.length > 0 &&
                    professionals.map((country) => (
                        <div key={country.country} className="mb-4">
                            <h2 className="text-lg font-semibold">{country.country}</h2>
                            <ul className="list-disc list-inside">
                                {country.professionals.map((p, idx) => (
                                    <li key={idx} className="ml-4">
                                        <strong>{p.fullName}</strong> –{" "}
                                        {p.specificExpertise} | {p.affiliation} |{" "}
                                        {p.businessLocation} | {p.citizenships.join(", ")}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
            </div>
        </div>
    );
}

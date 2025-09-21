// scripts/seedFirestore.js
import { db } from "../lib/firebaseAdmin.js";

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
    "Africa",
    "North and South America",
    "Europe",
    "Asia",
    "South East Asia and Australia",
];

// This is the template of your new prompt
const promptTemplate = `
Compile a list of high-achieving or exceptional professionals of Black ancestry
...
whose professional work or expertise involves [CATEGORY]
and such a person works in or resides in [REGION].
...
`; // (Paste your full prompt here, but leave [CATEGORY] and [REGION] placeholders.)

async function seed() {
    // Optionally clear old data here

    // Loop all combos
    for (const category of categories) {
        for (const region of regions) {
            const filledPrompt = promptTemplate
                .replace("[CATEGORY]", category)
                .replace("[REGION]", region);

            await db.collection("prompts").add({
                category,
                region,
                prompt: filledPrompt,
                createdAt: new Date(),// 
            });

            console.log(`Seeded prompt for ${category} in ${region}`);
        }
    }

    console.log("Seeding done ✅");
}

seed().catch(console.error);

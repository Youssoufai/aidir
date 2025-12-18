import { NextResponse } from "next/server";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function PUT(request, context) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { error: "Professional ID is required" },
                { status: 400 }
            );
        }

        const body = await request.json();

        const ref = doc(db, "professionals", id);

        // ✅ CREATE OR UPDATE (SAFE)
        await setDoc(
            ref,
            {
                fullName: body.fullName ?? "",
                profession: body.profession ?? "",
                bio: body.bio ?? "",
                category: body.category ?? "",
                institutionAffiliation: body.institutionAffiliation ?? "",
                location: body.location ?? "",
                gender: body.gender ?? "",
                specificExpertise: body.specificExpertise ?? "",
                region: body.region ?? "",
                ageAndDOB: body.ageAndDOB ?? "",
                approvalStatus: "reviewed",
                updatedAt: serverTimestamp(),
            },
            { merge: true } // 🔑 THIS IS THE KEY
        );

        return NextResponse.json({
            success: true,
            message: "Profile saved successfully",
        });
    } catch (error) {
        console.error("EDIT PROFILE ERROR:", error);

        return NextResponse.json(
            { error: "Failed to save profile" },
            { status: 500 }
        );
    }
}

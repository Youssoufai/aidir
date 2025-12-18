import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req) {
    const { role } = await req.json();

    const cookieStore = await cookies();
    cookieStore.set("role", role, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
}

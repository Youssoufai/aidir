// middleware.js
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = req.cookies.get("token")?.value;
    const role = req.cookies.get("role")?.value || "user"; // store role in cookie after login
    const url = req.nextUrl;

    // If not logged in, redirect to login
    if (!token && (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/default"))) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // If logged in as admin but trying to access default user page
    if (url.pathname.startsWith("/default") && role === "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // If logged in as user but trying to access admin dashboard
    if (url.pathname.startsWith("/dashboard") && role !== "admin") {
        return NextResponse.redirect(new URL("/default", req.url));
    }

    // Otherwise allow
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/default/:path*"],
};

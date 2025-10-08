// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
    const token = req.cookies.get("token")?.value;

    // If no token, send them to /default
    if (!token) {
        return NextResponse.redirect(new URL("/default", req.url));
    }

    // If user is logged in and an admin, send to dashboard
    const isAdmin = req.cookies.get("role")?.value === "admin";
    if (isAdmin && req.nextUrl.pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/dashboard/:path*"],
};

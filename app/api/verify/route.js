// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
    const token = req.cookies.get("token")?.value;
    const role = req.cookies.get("role")?.value;
    const url = req.nextUrl;

    // 🔹 Redirect unauthenticated users
    if (!token) {
        return NextResponse.redirect(new URL("/default", req.url));
    }

    // 🔹 Protect /dashboard → admin, directorAdmin, superAdmin
    if (url.pathname.startsWith("/dashboard")) {
        if (!["admin", "directorAdmin", "superAdmin"].includes(role)) {
            return NextResponse.redirect(new URL("/default", req.url));
        }
    }

    // 🔹 Protect /moderation → admin, directorAdmin, superAdmin
    if (url.pathname.startsWith("/moderation")) {
        if (!["admin", "directorAdmin", "superAdmin"].includes(role)) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    // 🔹 Super admin-only pages (delete privileges, management)
    if (url.pathname.startsWith("/superadmin")) {
        if (role !== "superAdmin") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    // 🔹 Protect critical /api routes (approval, delete)
    if (url.pathname.startsWith("/api/professionals")) {

        // DELETE only for superAdmin
        if (url.pathname.includes("/delete") && role !== "superAdmin") {
            return NextResponse.json({ error: "Only Super Admin can delete!" }, { status: 403 });
        }

        // approve → admin, directorAdmin, superAdmin
        if (url.pathname.includes("/approve")) {
            if (!["admin", "directorAdmin", "superAdmin"].includes(role)) {
                return NextResponse.json({ error: "Not authorized to approve!" }, { status: 403 });
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/dashboard/:path*",
        "/moderation/:path*",
        "/superadmin/:path*",
        "/api/professionals/:path*",
        "/default",
    ],
};

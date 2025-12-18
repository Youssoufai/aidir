// pages/api/setSession.js
import { serialize } from "cookie";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { token, role } = req.body;

    if (!token || !role) {
        return res.status(400).json({ error: "Token or role missing" });
    }

    // Set cookie for token
    res.setHeader("Set-Cookie", [
        serialize("token", token, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            sameSite: "lax",
        }),
        serialize("role", role, {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
            sameSite: "lax",
        }),
    ]);

    return res.status(200).json({ success: true });
}

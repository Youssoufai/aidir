"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    // ✅ Simple validations
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!role) {
      setError("Please select your role");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 🔹 Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 🔹 Update Firebase Auth profile
      await updateProfile(user, {
        displayName: fullName,
      });

      // 🔹 Save user record in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName,
        email,
        role,
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
      });

      // 🔹 Redirect after signup
      router.push("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 py-10">
      {/* Logo/Header */}
      <div className="flex items-center gap-2 mb-8">
        <div className="bg-indigo-600 p-3 rounded-lg shadow">
          <span className="text-white text-xl font-bold">PT</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">ProTalent</h1>
      </div>

      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Create Your Account
        </h2>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <InputField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            type="text"
            placeholder="John Doe"
          />

          <InputField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
          />

          <InputField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="********"
          />

          <InputField
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
            placeholder="********"
          />

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Select Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose a role --</option>
              <option value="admin">Admin</option>
              <option value="public">Public User</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-indigo-600 hover:underline">
            Log In
          </a>
        </p>
      </div>
    </div>
  );
}

// 🔹 Reusable input component
function InputField({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

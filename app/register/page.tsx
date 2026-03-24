"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { signInWithPopup, auth, googleProvider } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const nextAuthResult = await signIn("credentials", {
        idToken,
        redirect: false,
      });

      if (nextAuthResult?.error) {
        setError(nextAuthResult.error);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Google sign in failed");
      setLoading(false);
    }
  };

  const fields = [
    { id: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
    { id: "email", label: "Email", type: "email", placeholder: "you@example.com" },
    { id: "password", label: "Password", type: "password", placeholder: "••••••••", minLength: 6 },
    { id: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "••••••••", minLength: 6 },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 py-12">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[300px] -left-[300px] w-[600px] h-[600px] bg-amber-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-[300px] -right-[300px] w-[600px] h-[600px] bg-orange-500/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[420px] animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="text-lg font-extrabold tracking-tight gradient-text">
            WONDAR ETHIOPIA
          </Link>
          <p className="text-gray-600 text-[13px] mt-2 font-medium">
            Create your tourist account
          </p>
        </div>

        {/* Card */}
        <div className="glass-elevated rounded-2xl p-8 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/[0.08] border border-red-500/20 rounded-xl p-3.5 text-red-400 text-[13px] text-center font-medium">
                {error}
              </div>
            )}

            {fields.map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2"
                >
                  {field.label}
                </label>
                <input
                  id={field.id}
                  name={field.id}
                  type={field.type}
                  value={formData[field.id as keyof typeof formData]}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white text-[14px] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all duration-300"
                  placeholder={field.placeholder}
                  minLength={field.minLength}
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-black text-[14px] font-bold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-white/[0.06] flex-1" />
            <span className="text-gray-600 text-[11px] font-bold uppercase tracking-widest">
              or
            </span>
            <div className="h-px bg-white/[0.06] flex-1" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 bg-white text-gray-900 font-bold text-[14px] rounded-xl hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign up with Google
          </button>

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600 text-[13px]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
            <div className="h-px bg-white/[0.04]" />
            <p className="text-gray-600 text-[13px]">
              Are you a business owner?{" "}
              <Link
                href="/business"
                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
              >
                Apply here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

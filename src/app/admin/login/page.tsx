"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ceenai.in");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Check your admin credentials.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2B1A13] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#7B1123] p-8 text-center text-white relative">
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-[#F7E7CE]" />
          </div>
          <h1 className="font-serif font-bold text-2xl tracking-wide">Ceenai Management</h1>
          <p className="text-xs text-[#F7E7CE] mt-1">Authorized Administration Portal</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 text-xs text-[#7B1123] bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7A6F68] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ceenai.in"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Admin Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7A6F68] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer mt-2"
            >
              {isLoading ? "Verifying..." : "Access Admin Console"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#EFE8DE] text-center">
            <p className="text-[11px] text-[#7A6F68]">
              Default Credentials: <code className="text-[#7B1123]">admin@ceenai.in</code> / <code className="text-[#7B1123]">Admin@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


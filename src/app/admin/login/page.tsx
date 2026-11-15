"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

type AuthView = "login" | "forgot_request" | "forgot_verify";

export default function AdminLoginPage() {
  const router = useRouter();

  // Navigation view
  const [view, setView] = useState<AuthView>("login");

  // Form states - empty defaults (no prefilled credentials)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Forgot password states
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Handle Admin Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
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

  // 2. Handle Forgot Password - Request OTP
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Please enter your admin email address.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset code. Verify your admin email.");
      }

      setView("forgot_verify");
      setSuccess("A 6-digit verification code has been sent to your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Forgot Password - Verify OTP & Set New Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          password: newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password. Check your OTP.");
      }

      // Reset form and return to login view
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setPassword("");
      setView("login");
      setSuccess("Password updated successfully! Please sign in with your new password.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2B1A13] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with Ceenai Logo */}
        <div className="bg-[#7B1123] p-8 text-center text-white relative flex flex-col items-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <img
              src="/logo.png"
              alt="Ceenai Logo"
              className="h-9 w-auto object-contain drop-shadow-md"
            />
          </div>
          <h1 className="font-serif font-bold text-2xl tracking-wide">Ceenai Management</h1>
          <p className="text-xs text-[#F7E7CE]/90 mt-1 font-medium tracking-wide">
            Authorized Administration Portal
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Error Banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 text-xs text-[#7B1123] bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="mb-4 flex items-start gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* VIEW 1: Login Form */}
          {view === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7A6F68] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@ceenai.in"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123] transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#2B1A13]">
                    Admin Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView("forgot_request");
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-[11px] font-semibold text-[#7B1123] hover:text-[#5e0c1a] hover:underline cursor-pointer transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7A6F68] absolute left-3 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#7A6F68] hover:text-[#2B1A13] cursor-pointer transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
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
          )}

          {/* VIEW 2: Forgot Password - Request OTP */}
          {view === "forgot_request" && (
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <div className="text-left mb-2">
                <h2 className="text-sm font-bold text-[#2B1A13]">Reset Admin Password</h2>
                <p className="text-xs text-[#7A6F68] mt-0.5">
                  Enter your registered administrator email to receive a 6-digit verification code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7A6F68] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@ceenai.in"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer mt-2"
              >
                {isLoading ? "Sending Code..." : "Send Verification Code"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6F68] hover:text-[#2B1A13] cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: Forgot Password - Verify OTP & Set New Password */}
          {view === "forgot_verify" && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="text-left mb-2">
                <h2 className="text-sm font-bold text-[#2B1A13]">Enter Verification Code</h2>
                <p className="text-xs text-[#7A6F68] mt-0.5">
                  Enter the 6-digit code sent to <strong className="text-[#2B1A13]">{email}</strong> and choose a new password.
                </p>
              </div>

              {/* 6-Digit Code */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#7A6F68] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 text-xs tracking-widest font-mono font-bold bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123] transition-colors"
                  />
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7A6F68] absolute left-3 top-3" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-[#7A6F68] hover:text-[#2B1A13] cursor-pointer transition-colors"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7A6F68] absolute left-3 top-3" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-[#7A6F68] hover:text-[#2B1A13] cursor-pointer transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer mt-2"
              >
                {isLoading ? "Updating Password..." : "Update Password & Sign In"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A6F68] hover:text-[#2B1A13] cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

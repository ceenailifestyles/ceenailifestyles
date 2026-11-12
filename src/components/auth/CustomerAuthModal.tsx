"use client";

import React, { useState } from "react";
import { useStore } from "@/context/StoreContext";
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import Logo from "@/components/common/Logo";

export default function CustomerAuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, setUser } = useStore();

  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">(authModalTab);
  const [forgotStep, setForgotStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync tab with context trigger
  React.useEffect(() => {
    setActiveTab(authModalTab);
    setForgotStep("request");
    setOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }
      setUser(data.user);
      closeAuthModal();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed. Please try again.");
      }
      setUser(data.user);
      closeAuthModal();
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP.");
      }
      setForgotStep("verify");
      setSuccess(data.message || "A 6-digit OTP has been sent to your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          password: newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password.");
      }
      setOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPassword("");
      setForgotStep("request");
      setActiveTab("login");
      setSuccess("Password reset successful! Sign in with your new password.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-[350px] bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar with centered real logo */}
        <div className="relative bg-[#7B1123] px-6 py-4 text-white flex flex-col items-center justify-center text-center">
          <div className="pointer-events-none">
            <Logo variant="light" />
          </div>
          <p className="text-[11px] text-[#F7E7CE] mt-1">
            {activeTab === "forgot" && "Recover your account password."}
          </p>
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute top-3.5 right-3.5 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Pill Tab Switcher */}
        {activeTab !== "forgot" && (
          <div className="px-5 pt-4">
            <div className="grid grid-cols-2 p-1 bg-[#EFE8DE] rounded-xl border border-[#E5DDD0]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setError(null);
                  setShowPassword(false);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "login"
                    ? "bg-[#7B1123] text-white shadow-xs"
                    : "text-[#7A6F68] hover:text-[#2B1A13]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setError(null);
                  setShowPassword(false);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "register"
                    ? "bg-[#7B1123] text-white shadow-xs"
                    : "text-[#7A6F68] hover:text-[#2B1A13]"
                }`}
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        <div className="p-5">
          {error && (
            <div className="mb-4 flex items-center gap-2.5 px-3 py-2.5 bg-white border border-[#E8DFD5] border-l-3 border-l-[#7B1123] rounded-xl shadow-2xs animate-fade-in">
              <div className="w-6 h-6 rounded-full bg-[#7B1123]/10 text-[#7B1123] flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium text-[#2B1A13] leading-snug flex-1">
                {error}
              </span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-[#7A6F68] hover:text-[#2B1A13] p-0.5 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2.5 px-3 py-2.5 bg-white border border-[#E8DFD5] border-l-3 border-l-emerald-600 rounded-xl shadow-2xs animate-fade-in">
              <div className="w-6 h-6 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-medium text-[#2B1A13] leading-snug flex-1">
                {success}
              </span>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="text-[#7A6F68] hover:text-[#2B1A13] p-0.5 cursor-pointer"
                aria-label="Dismiss message"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#2B1A13] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7A6F68] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#2B1A13]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("forgot");
                      setError(null);
                    }}
                    className="text-[11px] text-[#7B1123] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7A6F68] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2 text-[#7A6F68] hover:text-[#2B1A13] p-0.5 cursor-pointer"
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

              <div className="pt-1 flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2.5 px-8 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center transition-all disabled:opacity-60 cursor-pointer"
                >
                  <span>{isLoading ? "Signing In..." : "Sign In"}</span>
                </button>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#2B1A13] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7A6F68] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2B1A13] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7A6F68] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2B1A13] mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#7A6F68] absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2B1A13] mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7A6F68] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2 text-[#7A6F68] hover:text-[#2B1A13] p-0.5 cursor-pointer"
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

              <div className="pt-1 flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2.5 px-8 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center transition-all disabled:opacity-60 cursor-pointer"
                >
                  <span>{isLoading ? "Creating..." : "Create Account"}</span>
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM (2-STEP OTP FLOW) */}
          {activeTab === "forgot" && forgotStep === "request" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-[#7A6F68]">
                Enter your registered email address and we will send you a 6-digit OTP to reset your password.
              </p>

              <div>
                <label className="block text-xs font-medium text-[#2B1A13] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7A6F68] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                  />
                </div>
              </div>

              <div className="pt-1 flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2.5 px-8 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center transition-all disabled:opacity-60 cursor-pointer"
                >
                  <span>{isLoading ? "Sending OTP..." : "Send OTP"}</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs text-[#7B1123] font-medium hover:underline cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {activeTab === "forgot" && forgotStep === "verify" && (
            <form onSubmit={handleResetPasswordWithOtp} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#2B1A13]">
                    6-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="text-[11px] text-[#7B1123] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-3 py-2 text-center tracking-[0.35em] font-bold text-sm placeholder:tracking-normal placeholder:font-normal placeholder:text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#2B1A13] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7A6F68] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2 text-[#7A6F68] hover:text-[#2B1A13] p-0.5 cursor-pointer"
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

              <div>
                <label className="block text-xs font-medium text-[#2B1A13] mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7A6F68] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] focus:ring-1 focus:ring-[#7B1123]"
                  />
                </div>
              </div>

              <div className="pt-1 flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="py-2.5 px-8 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center transition-all disabled:opacity-60 cursor-pointer"
                >
                  <span>{isLoading ? "Resetting..." : "Reset Password"}</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep("request");
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs text-[#7B1123] font-medium hover:underline cursor-pointer"
                >
                  ← Change Email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

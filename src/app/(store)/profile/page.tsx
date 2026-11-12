"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import { User, Package, Heart, LogOut, Mail, Phone, MapPin } from "lucide-react";

export default function ProfilePage() {
  const { user, logout, openAuthModal, wishlistCount } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <AnnouncementBar />
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        {!user ? (
          <div className="bg-white rounded-2xl border border-[#EFE8DE] p-10 text-center my-6 shadow-xs max-w-md mx-auto">
            <User className="w-12 h-12 text-[#7B1123] mx-auto opacity-40 mb-3" />
            <h3 className="font-serif font-bold text-lg text-[#2B1A13]">Sign in to your Account</h3>
            <p className="text-xs text-[#7A6F68] mt-1 mb-6">
              Access your personal profile, addresses, order history, and saved wishlist items.
            </p>
            <button
              onClick={() => openAuthModal("login")}
              className="px-6 py-2.5 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors"
            >
              Sign In to Ceenai
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#7B1123] text-white font-serif font-bold text-2xl flex items-center justify-center shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">{user.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#7A6F68] mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#7B1123]" />
                      {user.email}
                    </span>
                    {user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#7B1123]" />
                        {user.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/orders"
                className="bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs hover:border-[#7B1123] transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] text-[#7B1123] flex items-center justify-center group-hover:bg-[#7B1123] group-hover:text-white transition-colors">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2B1A13]">Order History</h3>
                  <p className="text-xs text-[#7A6F68] mt-0.5">Track your orders & deliveries</p>
                </div>
              </Link>

              <Link
                href="/wishlist"
                className="bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs hover:border-[#7B1123] transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] text-[#7B1123] flex items-center justify-center group-hover:bg-[#7B1123] group-hover:text-white transition-colors">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2B1A13]">My Wishlist ({wishlistCount})</h3>
                  <p className="text-xs text-[#7A6F68] mt-0.5">View saved styles and favorites</p>
                </div>
              </Link>
            </div>

            {/* Store Information */}
            <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2B1A13] pb-3 border-b border-[#EFE8DE] mb-4">
                Customer Support & Assistance
              </h3>
              <p className="text-xs text-[#7A6F68] leading-relaxed mb-4">
                Need help with your size, custom tailoring queries, or delivery updates? Our team is available 6 days a week from 10 AM to 8 PM.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-[#7B1123]">
                <a href="tel:9987087055" className="hover:underline">
                  Call: 9987087055
                </a>
                <span>•</span>
                <a href="mailto:support@ceenai.in" className="hover:underline">
                  Email: support@ceenai.in
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}


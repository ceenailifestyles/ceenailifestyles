"use client";

import React, { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="bg-[#2B1A13] text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-wide">
            Stay in Style with Ceenai
          </h3>
          <p className="text-xs text-[#F7E7CE]/80 mt-1">
            Subscribe for exclusive festive previews, new arrival alerts and special discounts.
          </p>
        </div>

        {subscribed ? (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-white/5 py-2 px-4 rounded-full border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Thank you for subscribing to Ceenai!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full md:w-auto flex items-center gap-2 max-w-md">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full md:w-72 px-4 py-2.5 text-xs bg-white text-[#2B1A13] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#C59A47] placeholder:text-[#7A6F68]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#C59A47] hover:bg-[#d8ab55] text-[#2B1A13] text-xs font-bold rounded-full flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <span>Subscribe</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


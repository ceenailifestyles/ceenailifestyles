"use client";

import React, { useState } from "react";
import { Check, AlertCircle, Upload, Truck, RefreshCw, ShieldCheck, Award } from "lucide-react";

export default function ContentClient({ initialContent }: { initialContent: Record<string, any> }) {
  const [activeTab, setActiveTab] = useState<"about" | "benefits">("about");

  // About CeeneAI form state
  const [aboutHeading, setAboutHeading] = useState(
    initialContent.about_ceenai?.heading || "About Ceenai"
  );
  const [aboutSubheading, setAboutSubheading] = useState(
    initialContent.about_ceenai?.subheading || "A Story That Begins With You."
  );
  const [aboutDescription, setAboutDescription] = useState(
    initialContent.about_ceenai?.description || ""
  );
  const [aboutStoreImage, setAboutStoreImage] = useState(
    initialContent.about_ceenai?.storeImage || ""
  );
  const [aboutPillars, setAboutPillars] = useState<any[]>(
    initialContent.about_ceenai?.pillars || [
      { title: "Style", desc: "Trendy & Timeless" },
      { title: "Comfort", desc: "Feels as Good as It Looks" },
      { title: "Value", desc: "Great Fashion at Sensible Prices" },
      { title: "Choice", desc: "A Growing Range for Every Occasion" },
    ]
  );

  // Shopping Benefits Bar (Exclude "Visit Our Store")
  const [benefits, setBenefits] = useState<any[]>(() => {
    const defaultBenefits = [
      { title: "Free Shipping", subtitle: "On Orders Above ₹999", icon: "Truck" },
      { title: "Easy Returns", subtitle: "Hassle-free Exchange", icon: "RefreshCw" },
      { title: "Secure Payments", subtitle: "100% Safe & Encrypted", icon: "ShieldCheck" },
      { title: "Trusted Quality", subtitle: "Style, Comfort & Value", icon: "Award" },
    ];

    const raw = initialContent.benefits || defaultBenefits;
    // Filter out "Visit Our Store" tab
    const filtered = raw.filter(
      (b: any) =>
        !b.title?.toLowerCase().includes("visit") &&
        !b.title?.toLowerCase().includes("store") &&
        b.icon !== "Store"
    );

    return filtered.length > 0 ? filtered : defaultBenefits;
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "ceeneai/about");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setAboutStoreImage(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    const payload = {
      key: "about_ceenai",
      value: {
        heading: aboutHeading,
        subheading: aboutSubheading,
        description: aboutDescription,
        storeImage: aboutStoreImage,
        ctaText: "Know Our Story →",
        ctaLink: "/about",
        pillars: aboutPillars,
      },
    };

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setSuccess("About CeeneAI content successfully updated in MySQL!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBenefits = async () => {
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "benefits", value: benefits }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSuccess("Shopping benefits successfully updated in MySQL!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Header Row with Switching Button on the Top-Right Corner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1A13]">Website Content CMS</h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Manage shopping benefits, brand story & pillars directly in MySQL.
          </p>
        </div>

        {/* Switching / Toggle Button - Top Right Corner */}
        <div className="inline-flex items-center p-1 bg-white border border-[#E8DFD5] rounded-xl shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { setActiveTab("about"); setSuccess(null); setError(null); }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "about"
                ? "bg-[#7B1123] text-white shadow-xs"
                : "text-[#7A6F68] hover:text-[#2B1A13]"
            }`}
          >
            About Story
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("benefits"); setSuccess(null); setError(null); }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === "benefits"
                ? "bg-[#7B1123] text-white shadow-xs"
                : "text-[#7A6F68] hover:text-[#2B1A13]"
            }`}
          >
            Shopping Benefits
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-[#7B1123] bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-[#7B1123] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. ABOUT CEENEAI TAB (Full Width Layout) */}
      {activeTab === "about" && (
        <form onSubmit={handleSaveAbout} className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 space-y-6 shadow-xs w-full">
          <div className="border-b border-[#EFE8DE] pb-3">
            <h2 className="text-sm font-bold text-[#2B1A13]">About Brand Story & Content</h2>
            <p className="text-xs text-[#7A6F68] mt-0.5">
              Customize the storytelling copy and visual media displayed on the storefront.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1.5">Heading</label>
              <input
                type="text"
                required
                value={aboutHeading}
                onChange={(e) => setAboutHeading(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1.5">Subheading</label>
              <input
                type="text"
                required
                value={aboutSubheading}
                onChange={(e) => setAboutSubheading(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1.5">Brand Story Description</label>
              <textarea
                rows={4}
                required
                value={aboutDescription}
                onChange={(e) => setAboutDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1.5">Storefront Feature Image</label>
              <div className="flex items-center gap-4">
                {aboutStoreImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={aboutStoreImage}
                    alt="Storefront"
                    className="w-24 h-20 rounded-xl object-cover border border-[#E8DFD5] shadow-2xs"
                  />
                )}
                <label className="cursor-pointer px-4 py-2.5 bg-[#FAF7F2] border border-[#E8DFD5] hover:border-[#7B1123] rounded-xl text-xs font-medium text-[#2B1A13] flex items-center gap-2 transition-colors">
                  <Upload className="w-4 h-4 text-[#7B1123]" />
                  <span>{uploading ? "Uploading..." : "Upload to Cloudinary"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Brand Pillars */}
            <div className="md:col-span-2 space-y-2 pt-2 border-t border-[#EFE8DE]">
              <label className="block text-xs font-semibold text-[#2B1A13]">
                Brand Core Pillars (4 Elements)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {aboutPillars.map((p, idx) => (
                  <div key={idx} className="p-3.5 bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl space-y-2">
                    <div>
                      <span className="text-[10px] font-semibold text-[#7A6F68] block mb-1">
                        Pillar #{idx + 1} Title
                      </span>
                      <input
                        type="text"
                        value={p.title}
                        onChange={(e) => {
                          const updated = [...aboutPillars];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setAboutPillars(updated);
                        }}
                        placeholder="Title"
                        className="w-full px-2.5 py-1.5 text-xs font-bold text-[#2B1A13] bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-[#7A6F68] block mb-1">
                        Description
                      </span>
                      <input
                        type="text"
                        value={p.desc}
                        onChange={(e) => {
                          const updated = [...aboutPillars];
                          updated[idx] = { ...updated[idx], desc: e.target.value };
                          setAboutPillars(updated);
                        }}
                        placeholder="Description"
                        className="w-full px-2.5 py-1.5 text-xs text-[#7A6F68] bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#EFE8DE] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              {saving ? "Updating..." : "Save About Content"}
            </button>
          </div>
        </form>
      )}

      {/* 2. SHOPPING BENEFITS TAB (Full Width Layout, Without "Visit Our Store") */}
      {activeTab === "benefits" && (
        <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 space-y-6 shadow-xs w-full">
          <div className="border-b border-[#EFE8DE] pb-3">
            <h2 className="text-sm font-bold text-[#2B1A13]">Shopping Benefits Bar</h2>
            <p className="text-xs text-[#7A6F68] mt-0.5">
              Highlight the key customer shopping benefits shown across the storefront banner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {benefits.map((b, idx) => (
              <div
                key={idx}
                className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E8DFD5]/60">
                    <span className="text-[11px] font-bold text-[#7B1123]">Benefit #{idx + 1}</span>
                    <span className="text-[10px] text-[#7A6F68] font-medium">{b.icon}</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#7A6F68] mb-1">Title</label>
                    <input
                      type="text"
                      value={b.title}
                      onChange={(e) => {
                        const updated = [...benefits];
                        updated[idx].title = e.target.value;
                        setBenefits(updated);
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-[#2B1A13] bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#7A6F68] mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={b.subtitle}
                      onChange={(e) => {
                        const updated = [...benefits];
                        updated[idx].subtitle = e.target.value;
                        setBenefits(updated);
                      }}
                      className="w-full px-3 py-2 text-xs text-[#7A6F68] bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#7A6F68] mb-1">Icon</label>
                    <select
                      value={b.icon}
                      onChange={(e) => {
                        const updated = [...benefits];
                        updated[idx].icon = e.target.value;
                        setBenefits(updated);
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] cursor-pointer"
                    >
                      <option value="Truck">Truck (Free Shipping)</option>
                      <option value="RefreshCw">RefreshCw (Easy Returns)</option>
                      <option value="ShieldCheck">ShieldCheck (Secure Payments)</option>
                      <option value="Award">Award (Trusted Quality)</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#EFE8DE] flex justify-end">
            <button
              onClick={handleSaveBenefits}
              disabled={saving}
              className="px-6 py-2.5 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              {saving ? "Saving..." : "Save Benefits"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

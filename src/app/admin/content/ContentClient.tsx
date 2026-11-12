"use client";

import React, { useState } from "react";
import { Check, AlertCircle, Upload, Plus, Trash2 } from "lucide-react";

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

  // Benefits
  const [benefits, setBenefits] = useState<any[]>(
    initialContent.benefits || [
      { title: "Free Shipping", subtitle: "On Orders Above ₹999", icon: "Truck" },
      { title: "Easy Returns", subtitle: "Hassle-free Exchange", icon: "RefreshCw" },
      { title: "Secure Payments", subtitle: "100% Safe & Encrypted", icon: "ShieldCheck" },
      { title: "Visit Our Store", subtitle: "Malad West, Mumbai", icon: "Store" },
      { title: "Trusted Quality", subtitle: "Style, Comfort & Value", icon: "Award" },
    ]
  );

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
    <div className="space-y-6 max-w-4xl">
      {/* Tabs */}
      <div className="flex border-b border-[#EFE8DE] bg-white rounded-t-2xl p-2 px-4 gap-2">
        <button
          onClick={() => { setActiveTab("about"); setSuccess(null); setError(null); }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "about"
              ? "bg-[#7B1123] text-white shadow-xs"
              : "text-[#7A6F68] hover:text-[#2B1A13]"
          }`}
        >
          About CeeneAI Section
        </button>
        <button
          onClick={() => { setActiveTab("benefits"); setSuccess(null); setError(null); }}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "benefits"
              ? "bg-[#7B1123] text-white shadow-xs"
              : "text-[#7A6F68] hover:text-[#2B1A13]"
          }`}
        >
          Shopping Benefits Bar
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-[#7B1123] bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-[#7B1123]" />
          <span>{error}</span>
        </div>
      )}

      {/* ABOUT CEENEAI TAB */}
      {activeTab === "about" && (
        <form onSubmit={handleSaveAbout} className="bg-white rounded-2xl border border-[#EFE8DE] p-6 space-y-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Heading</label>
              <input
                type="text"
                required
                value={aboutHeading}
                onChange={(e) => setAboutHeading(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Subheading</label>
              <input
                type="text"
                required
                value={aboutSubheading}
                onChange={(e) => setAboutSubheading(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Brand Story Description</label>
              <textarea
                rows={4}
                required
                value={aboutDescription}
                onChange={(e) => setAboutDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Storefront Image</label>
              <div className="flex items-center gap-4">
                {aboutStoreImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={aboutStoreImage} alt="Storefront" className="w-20 h-16 rounded-lg object-cover border" />
                )}
                <label className="cursor-pointer px-4 py-2 bg-[#FAF7F2] border border-[#E8DFD5] hover:border-[#7B1123] rounded-lg text-xs font-medium text-[#2B1A13] flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-[#7B1123]" />
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
          </div>

          <div className="pt-4 border-t border-[#EFE8DE] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              {saving ? "Updating..." : "Save About Content"}
            </button>
          </div>
        </form>
      )}

      {/* BENEFITS TAB */}
      {activeTab === "benefits" && (
        <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 space-y-4 shadow-xs">
          <div className="space-y-3">
            {benefits.map((b, idx) => (
              <div key={idx} className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-[#7A6F68] mb-0.5">Title</label>
                  <input
                    type="text"
                    value={b.title}
                    onChange={(e) => {
                      const updated = [...benefits];
                      updated[idx].title = e.target.value;
                      setBenefits(updated);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DFD5] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#7A6F68] mb-0.5">Subtitle</label>
                  <input
                    type="text"
                    value={b.subtitle}
                    onChange={(e) => {
                      const updated = [...benefits];
                      updated[idx].subtitle = e.target.value;
                      setBenefits(updated);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DFD5] rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#7A6F68] mb-0.5">Icon (Lucide)</label>
                  <select
                    value={b.icon}
                    onChange={(e) => {
                      const updated = [...benefits];
                      updated[idx].icon = e.target.value;
                      setBenefits(updated);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E8DFD5] rounded-md"
                  >
                    <option value="Truck">Truck (Shipping)</option>
                    <option value="RefreshCw">RefreshCw (Returns)</option>
                    <option value="ShieldCheck">ShieldCheck (Payments)</option>
                    <option value="Store">Store (Physical Store)</option>
                    <option value="Award">Award (Quality)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#EFE8DE] flex justify-end">
            <button
              onClick={handleSaveBenefits}
              disabled={saving}
              className="px-6 py-2.5 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              {saving ? "Saving..." : "Save Benefits"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


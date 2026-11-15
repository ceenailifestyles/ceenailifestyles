"use client";

import React, { useState } from "react";
import { Check, AlertCircle } from "lucide-react";

export default function SettingsClient({ initialSettings }: { initialSettings: Record<string, any> }) {
  // Announcement Bar
  const [announcementAddress, setAnnouncementAddress] = useState(
    initialSettings.announcement_bar?.address || "Om Kripa CHS, Shop No. 1, Janakalyan Road, Off Marve Road, Malad West, Mumbai - 400095"
  );
  const [announcementPhone, setAnnouncementPhone] = useState(
    initialSettings.announcement_bar?.phone || "9987087055"
  );
  const [announcementEmail, setAnnouncementEmail] = useState(
    initialSettings.announcement_bar?.email || "support@ceenai.in"
  );
  const [announcementActive, setAnnouncementActive] = useState(
    initialSettings.announcement_bar?.isActive ?? true
  );

  // Footer & Store Settings
  const [brandDesc, setBrandDesc] = useState(
    initialSettings.footer_settings?.brandDescription || "Right Nightwear Beginnings to Everyday Elegance."
  );
  const [storeAddress, setStoreAddress] = useState(
    initialSettings.footer_settings?.storeAddress || "Om Kripa CHS, Shop No. 1, Janakalyan Road, Off Marve Road, Malad West, Mumbai - 400095"
  );
  const [instagram, setInstagram] = useState(
    initialSettings.footer_settings?.socialLinks?.instagram || "https://instagram.com/ceenai"
  );
  const [facebook, setFacebook] = useState(
    initialSettings.footer_settings?.socialLinks?.facebook || "https://facebook.com/ceenai"
  );
  const [youtube, setYoutube] = useState(
    initialSettings.footer_settings?.socialLinks?.youtube || "https://youtube.com/@ceenai"
  );
  const [copyright, setCopyright] = useState(
    initialSettings.footer_settings?.copyright || "© 2026 Ceenai. All Rights Reserved."
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      // 1. Update announcement bar
      await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "announcement_bar",
          value: {
            address: announcementAddress,
            phone: announcementPhone,
            email: announcementEmail,
            isActive: announcementActive,
          },
        }),
      });

      // 2. Update footer settings
      await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "footer_settings",
          value: {
            brandDescription: brandDesc,
            phone: announcementPhone,
            email: announcementEmail,
            storeAddress: storeAddress,
            socialLinks: {
              instagram,
              facebook,
              youtube,
            },
            copyright,
          },
        }),
      });

      setSuccess("Website settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 w-full">
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

      {/* 1. Announcement Bar Card (Full-Width Layout) */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 space-y-5 shadow-xs w-full">
        <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
          <div>
            <h2 className="text-sm font-bold text-[#2B1A13]">Announcement Header Bar</h2>
            <p className="text-xs text-[#7A6F68] mt-0.5">
              Topmost banner showing physical store address, contact phone, and email across storefront pages.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#2B1A13] cursor-pointer bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E8DFD5]">
            <input
              type="checkbox"
              checked={announcementActive}
              onChange={(e) => setAnnouncementActive(e.target.checked)}
              className="accent-[#7B1123] w-4 h-4 rounded-sm cursor-pointer"
            />
            <span>Enabled</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1.5">
              Top Bar Address Line
            </label>
            <input
              type="text"
              value={announcementAddress}
              onChange={(e) => setAnnouncementAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1.5">Phone Number</label>
            <input
              type="text"
              value={announcementPhone}
              onChange={(e) => setAnnouncementPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1.5">Support Email</label>
            <input
              type="email"
              value={announcementEmail}
              onChange={(e) => setAnnouncementEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>
        </div>
      </div>

      {/* 2. Store & Footer Settings Card (Full-Width Layout) */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 sm:p-8 space-y-5 shadow-xs w-full">
        <div className="pb-3 border-b border-[#EFE8DE]">
          <h2 className="text-sm font-bold text-[#2B1A13]">Footer & Store Location</h2>
          <p className="text-xs text-[#7A6F68] mt-0.5">
            Storefront brand mission tagline, physical store address, social networks, and copyright.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1.5">
              Brand Tagline / Description
            </label>
            <input
              type="text"
              value={brandDesc}
              onChange={(e) => setBrandDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1.5">
              Physical Store Address
            </label>
            <textarea
              rows={2}
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-2">
              Social Media Channels
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="block text-[10px] font-semibold text-[#7A6F68] mb-1">Instagram URL</span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-[#7A6F68] mb-1">Facebook URL</span>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-[#7A6F68] mb-1">YouTube URL</span>
                <input
                  type="text"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1.5">Copyright Notice</label>
            <input
              type="text"
              value={copyright}
              onChange={(e) => setCopyright(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          {saving ? "Saving..." : "Save Website Settings"}
        </button>
      </div>
    </form>
  );
}

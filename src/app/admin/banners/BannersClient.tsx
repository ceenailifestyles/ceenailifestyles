"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Upload, X, AlertCircle } from "lucide-react";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function BannersClient({ initialBanners }: { initialBanners: any[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [desktopImage, setDesktopImage] = useState("");
  const [desktopPublicId, setDesktopPublicId] = useState("");
  const [mobileImage, setMobileImage] = useState("");
  const [mobilePublicId, setMobilePublicId] = useState("");
  const [ctaText, setCtaText] = useState("Shop Now");
  const [ctaLink, setCtaLink] = useState("/products");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setDesktopImage("");
    setDesktopPublicId("");
    setMobileImage("");
    setMobilePublicId("");
    setCtaText("Shop Now");
    setCtaLink("/products");
    setDisplayOrder(banners.length + 1);
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (b: any) => {
    setEditingBanner(b);
    setTitle(b.title);
    setSubtitle(b.subtitle || "");
    setDesktopImage(b.desktopImage);
    setDesktopPublicId(b.desktopPublicId || "");
    setMobileImage(b.mobileImage || "");
    setMobilePublicId(b.mobilePublicId || "");
    setCtaText(b.ctaText);
    setCtaLink(b.ctaLink);
    setDisplayOrder(b.displayOrder || 0);
    setIsActive(b.isActive ?? true);
    setError(null);
    setIsModalOpen(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMobile: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isMobile) setUploadingMobile(true);
    else setUploadingDesktop(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "ceeneai/banners");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (isMobile) {
        setMobileImage(data.url);
        setMobilePublicId(data.publicId);
      } else {
        setDesktopImage(data.url);
        setDesktopPublicId(data.publicId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      if (isMobile) setUploadingMobile(false);
      else setUploadingDesktop(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desktopImage) {
      setError("Desktop image is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title,
      subtitle: subtitle || null,
      desktopImage,
      desktopPublicId: desktopPublicId || null,
      mobileImage: mobileImage || null,
      mobilePublicId: mobilePublicId || null,
      ctaText,
      ctaLink,
      displayOrder: parseInt(displayOrder.toString(), 10) || 0,
      isActive,
    };

    try {
      const url = editingBanner
        ? `/api/admin/banners/${editingBanner.id}`
        : `/api/admin/banners`;
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      // Refresh list
      const ref = await fetch("/api/admin/banners");
      const refData = await ref.json();
      setBanners(refData.banners || []);
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/banners/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setBanners((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hero Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-[#EFE8DE] shadow-xs overflow-hidden flex flex-col"
          >
            <div className="relative aspect-16/9 bg-gray-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.desktopImage} alt={b.title} className="w-full h-full object-cover" />
              <div className="absolute top-2.5 left-2.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    b.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {b.isActive ? "Active" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-[#2B1A13]">{b.title}</h3>
                {b.subtitle && <p className="text-xs text-[#7B1123] font-medium">{b.subtitle}</p>}
                <div className="flex items-center gap-2 mt-2 text-xs text-[#7A6F68]">
                  <span>CTA: <strong>{b.ctaText}</strong></span>
                  <span>• Order: {b.displayOrder}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE8DE] mt-3">
                <button
                  onClick={() => openEdit(b)}
                  className="p-1.5 text-[#2B1A13] hover:text-[#7B1123] hover:bg-[#FAF7F2] rounded-lg transition-colors"
                  title="Edit Banner"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: b.id, title: b.title })}
                  className="p-1.5 text-[#7A6F68] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#EFE8DE] shadow-2xl overflow-hidden">
            <div className="bg-[#7B1123] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">
                {editingBanner ? "Edit Hero Banner" : "Add Hero Banner"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="flex items-start gap-2 p-3 text-xs text-[#7B1123] bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Heading / Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Ceenai FESTIVE '26"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Celebrate in Splendor"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B1A13] mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    required
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Shop Now"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2B1A13] mb-1">CTA Link</label>
                  <input
                    type="text"
                    required
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    placeholder="/products"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Desktop Banner Image *</label>
                <div className="flex items-center gap-3">
                  {desktopImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={desktopImage} alt="Desktop preview" className="w-20 h-12 rounded object-cover border" />
                  )}
                  <label className="cursor-pointer px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg text-xs font-medium flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-[#7B1123]" />
                    <span>{uploadingDesktop ? "Uploading..." : "Upload Desktop Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingDesktop}
                      onChange={(e) => handleUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Mobile Banner Image (Optional)</label>
                <div className="flex items-center gap-3">
                  {mobileImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mobileImage} alt="Mobile preview" className="w-12 h-16 rounded object-cover border" />
                  )}
                  <label className="cursor-pointer px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg text-xs font-medium flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-[#7B1123]" />
                    <span>{uploadingMobile ? "Uploading..." : "Upload Mobile Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingMobile}
                      onChange={(e) => handleUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#2B1A13] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="accent-[#7B1123] w-4 h-4 rounded-sm"
                    />
                    <span>Active in Carousel</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE8DE]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E8DFD5] text-xs font-semibold rounded-lg text-[#2B1A13] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingDesktop || uploadingMobile}
                  className="px-5 py-2 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* PROPER DELETE CONFIRMATION POPUP */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemType="banner"
        itemName={deleteTarget?.title}
        isLoading={isDeleting}
      />
    </div>
  );
}


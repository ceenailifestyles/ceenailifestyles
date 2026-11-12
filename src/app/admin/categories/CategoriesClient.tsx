"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Upload, ChevronDown, ChevronRight, X, AlertCircle } from "lucide-react";
import { slugify } from "@/lib/utils";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function CategoriesClient({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    [initialCategories[0]?.id]: true,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [parentCatForSub, setParentCatForSub] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [publicId, setPublicId] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddCategory = () => {
    setEditingCat(null);
    setParentCatForSub(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setPublicId("");
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openAddSubcategory = (parent: any) => {
    setEditingCat(null);
    setParentCatForSub(parent);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setPublicId("");
    setDisplayOrder((parent.children?.length || 0) + 1);
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditingCat(cat);
    setParentCatForSub(cat.parentId ? { id: cat.parentId } : null);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setPublicId(cat.publicId || "");
    setDisplayOrder(cat.displayOrder || 0);
    setIsActive(cat.isActive ?? true);
    setError(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "ceeneai/categories");

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setImage(data.url);
      setPublicId(data.publicId);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      slug: slugify(slug || name),
      description: description || null,
      image: image || null,
      publicId: publicId || null,
      displayOrder: parseInt(displayOrder.toString(), 10) || 0,
      isActive,
      parentId: parentCatForSub?.id || null,
    };

    try {
      const url = editingCat
        ? `/api/admin/categories/${editingCat.id}`
        : `/api/admin/categories`;
      const method = editingCat ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      // Reload fresh categories
      const refreshRes = await fetch("/api/admin/categories");
      const refreshData = await refreshRes.json();
      setCategories(refreshData.categories || []);

      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; isSub?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      const refreshRes = await fetch("/api/admin/categories");
      const refreshData = await refreshRes.json();
      setCategories(refreshData.categories || []);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex justify-end">
        <button
          onClick={openAddCategory}
          className="flex items-center gap-2 px-4 py-2 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Primary Category</span>
        </button>
      </div>

      {/* Categories Tree Accordion */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const isExpanded = expandedCats[cat.id];
          const children = cat.children || [];

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-[#EFE8DE] shadow-xs overflow-hidden"
            >
              {/* Category Head */}
              <div className="p-4 px-6 flex items-center justify-between bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] transition-colors">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="p-1 text-[#7A6F68] hover:text-[#2B1A13]"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {cat.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-12 h-14 rounded-lg object-cover border border-[#E8DFD5] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                      No Img
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#2B1A13]">{cat.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E8DFD5] text-[#7A6F68]">
                        Order: {cat.displayOrder}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#7A6F68]">
                      /{cat.slug} • {cat._count?.products || 0} products • {children.length} subcategories
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddSubcategory(cat)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#E8DFD5] hover:border-[#7B1123] rounded-lg text-xs font-semibold text-[#2B1A13] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#7B1123]" />
                    <span>Add Subcategory</span>
                  </button>

                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 text-[#2B1A13] hover:text-[#7B1123] hover:bg-white rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeleteTarget({ id: cat.id, name: cat.name, isSub: false })}
                    className="p-2 text-[#7A6F68] hover:text-red-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subcategories List */}
              {isExpanded && children.length > 0 && (
                <div className="p-4 px-6 border-t border-[#EFE8DE] bg-[#FAF7F2]/20 divide-y divide-[#EFE8DE]/60 space-y-2">
                  {children.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="pt-2 first:pt-0 flex items-center justify-between text-xs hover:bg-white p-2.5 rounded-xl border border-transparent hover:border-[#E8DFD5] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {sub.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sub.image}
                            alt={sub.name}
                            className="w-12 h-9 rounded-md object-cover border border-[#E8DFD5] shadow-2xs shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-9 rounded-md bg-[#FAF7F2] border border-dashed border-[#D8CFBF] flex flex-col items-center justify-center text-[9px] text-[#7A6F68] shrink-0 font-medium">
                            <span>No Img</span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#2B1A13]">{sub.name}</span>
                            {sub.image ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                                Banner Image Set
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                No Banner Image
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#7A6F68]">
                            /{sub.slug}
                            {sub.description ? ` • "${sub.description.slice(0, 45)}..."` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#7A6F68]">
                          {sub._count?.subProducts || 0} products
                        </span>
                        <button
                          onClick={() => openEdit(sub)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[#2B1A13] hover:text-[#7B1123] bg-white border border-[#E8DFD5] rounded-md font-medium text-[11px] hover:border-[#7B1123] transition-colors cursor-pointer"
                          title="Edit Subcategory & Banner Image"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit / Banner</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: sub.id, name: sub.name, isSub: true })}
                          className="p-1.5 text-[#7A6F68] hover:text-red-600 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Subcategory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#EFE8DE] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#7B1123] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">
                {editingCat
                  ? `Edit ${parentCatForSub ? "Subcategory" : "Category"}`
                  : parentCatForSub
                  ? `Add Subcategory to "${parentCatForSub.name}"`
                  : "Add Primary Category"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 text-xs text-[#7B1123] bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  placeholder={parentCatForSub ? "Enter subcategory name" : "Enter category name"}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCat) setSlug(slugify(e.target.value));
                  }}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  placeholder={parentCatForSub ? "Enter subcategory slug" : "Enter category slug"}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Display Order</label>
                <input
                  type="number"
                  value={displayOrder}
                  placeholder="0"
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  {parentCatForSub
                    ? "Subcategory Description (shown on banner below heading)"
                    : "Category Description (shown on banner below heading)"}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    parentCatForSub
                      ? "Enter subcategory description"
                      : "Enter category description"
                  }
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              {/* Banner / Section Background Image upload */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  {parentCatForSub
                    ? "Subcategory Background Banner Image (Shop Page Section)"
                    : "Category Arched & Banner Image"}
                </label>
                <p className="text-[11px] text-[#7A6F68] mb-2">
                  {parentCatForSub
                    ? "Displayed as the landscape background banner when users select or browse this subcategory."
                    : "Displayed in the \"Shop by Category\" arched cards and as the category banner on the Shop page."}
                </p>

                {/* Preview if image is present */}
                {image && (
                  <div className="relative mb-2.5 rounded-xl overflow-hidden border border-[#E8DFD5] bg-[#24150F] h-28 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt="Banner Preview"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-end p-2.5">
                      <span className="text-[10px] text-white/90 font-medium bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                        Banner Preview
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImage("");
                        setPublicId("");
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer"
                      title="Remove Image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Upload & URL input */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-2 bg-[#FAF7F2] border border-[#E8DFD5] hover:border-[#7B1123] rounded-lg text-xs font-medium text-[#2B1A13] flex items-center gap-2 shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-[#7B1123]" />
                      <span>{uploading ? "Uploading..." : "Upload File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex-1">
                      <input
                        type="url"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="Or paste image URL (https://...)"
                        className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                      />
                    </div>
                  </div>
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
                  disabled={saving || uploading}
                  className="px-5 py-2 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* PROPER DELETE POPUP UI */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemType={deleteTarget?.isSub ? "subcategory" : "category"}
        itemName={deleteTarget?.name}
        isLoading={isDeleting}
      />
    </div>
  );
}


"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, Upload, Split, AlertCircle, Image as ImageIcon } from "lucide-react";
import { slugify } from "@/lib/utils";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

interface ParentCategory {
  id: string;
  name: string;
  slug: string;
}

interface SubcategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  publicId?: string | null;
  displayOrder: number;
  isActive: boolean;
  parentId: string | null;
  parent?: { id: string; name: string; slug: string } | null;
  _count?: { subProducts: number };
}

export default function SubcategoriesClient({
  initialSubcategories,
  parentCategories,
}: {
  initialSubcategories: SubcategoryItem[];
  parentCategories: ParentCategory[];
}) {
  const [subcategories, setSubcategories] = useState<SubcategoryItem[]>(initialSubcategories);
  const [selectedParentFilter, setSelectedParentFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubcategoryItem | null>(null);

  // Form Fields (Empty placeholders, no hardcoded dummy data)
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [publicId, setPublicId] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingSub(null);
    setName("");
    setSlug("");
    setParentId(selectedParentFilter !== "ALL" ? selectedParentFilter : parentCategories[0]?.id || "");
    setDescription("");
    setImage("");
    setPublicId("");
    setDisplayOrder(subcategories.length + 1);
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sub: SubcategoryItem) => {
    setEditingSub(sub);
    setName(sub.name);
    setSlug(sub.slug);
    setParentId(sub.parentId || parentCategories[0]?.id || "");
    setDescription(sub.description || "");
    setImage(sub.image || "");
    setPublicId(sub.publicId || "");
    setDisplayOrder(sub.displayOrder);
    setIsActive(sub.isActive);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSub(null);
    setName("");
    setSlug("");
    setParentId("");
    setDescription("");
    setImage("");
    setPublicId("");
    setDisplayOrder(0);
    setIsActive(true);
    setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "ceeneai/subcategories");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setImage(data.url);
      setPublicId(data.publicId || "");
    } catch (err: any) {
      setError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter subcategory name.");
      return;
    }
    if (!parentId) {
      setError("Please select a parent category.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        parentId,
        description: description.trim() || null,
        image: image || null,
        publicId: publicId || null,
        displayOrder: Number(displayOrder) || 0,
        isActive,
      };

      const url = editingSub
        ? `/api/admin/subcategories/${editingSub.id}`
        : "/api/admin/subcategories";
      const method = editingSub ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save subcategory");
      }

      if (editingSub) {
        setSubcategories((prev) =>
          prev.map((s) => (s.id === editingSub.id ? data.subcategory : s))
        );
      } else {
        setSubcategories((prev) => [data.subcategory, ...prev]);
      }

      closeModal();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/subcategories/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete subcategory");
        return;
      }
      setSubcategories((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert("Error deleting subcategory.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered view
  const filteredSubcategories = subcategories.filter((s) => {
    const matchesParent =
      selectedParentFilter === "ALL" || s.parentId === selectedParentFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parent?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesParent && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Parent Category Filter */}
          <select
            value={selectedParentFilter}
            onChange={(e) => setSelectedParentFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] font-semibold text-[#2B1A13]"
          >
            <option value="ALL">All Parent Categories</option>
            {parentCategories.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Search box */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subcategories..."
            className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] w-full sm:w-64"
          />
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs cursor-pointer shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subcategory</span>
        </button>
      </div>

      {/* Subcategories Table */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EFE8DE] text-[#7A6F68]">
              <tr>
                <th className="py-3 px-4 font-semibold">Subcategory</th>
                <th className="py-3 px-4 font-semibold">Parent Category</th>
                <th className="py-3 px-4 font-semibold">Slug</th>
                <th className="py-3 px-4 font-semibold">Banner Image</th>
                <th className="py-3 px-4 font-semibold">Products</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DE]/60">
              {filteredSubcategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#7A6F68]">
                    No subcategories found.
                  </td>
                </tr>
              ) : (
                filteredSubcategories.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#FAF7F2]/50">
                    <td className="py-3.5 px-4 font-bold text-[#2B1A13]">
                      <div className="flex items-center gap-2">
                        <span>{sub.name}</span>
                        {sub.description && (
                          <span
                            className="text-[10px] text-[#7A6F68] font-normal truncate max-w-xs block"
                            title={sub.description}
                          >
                            — {sub.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF7F2] text-[#7B1123] border border-[#E8DFD5]">
                        {sub.parent?.name || "Unassigned"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#7A6F68] text-[11px]">
                      {sub.slug}
                    </td>
                    <td className="py-3.5 px-4">
                      {sub.image ? (
                        <div className="w-16 h-8 rounded-md overflow-hidden border border-[#E8DFD5] bg-[#FAF7F2]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sub.image}
                            alt={sub.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#7A6F68] italic">No image</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#2B1A13]">
                      {sub._count?.subProducts || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      {sub.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(sub)}
                          className="p-1.5 text-[#7A6F68] hover:text-[#7B1123] hover:bg-[#FAF7F2] rounded-md transition-colors cursor-pointer"
                          title="Edit Subcategory"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: sub.id, name: sub.name })}
                          disabled={deletingId === sub.id}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Subcategory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL FOR ADDING / EDITING SUBCATEGORY (Requirement 1 & 2) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE8DE] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-[#EFE8DE] bg-[#FAF7F2] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Split className="w-4 h-4 text-[#7B1123]" />
                <h3 className="font-bold text-sm text-[#2B1A13]">
                  {editingSub ? "Edit Subcategory" : "Add New Subcategory"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-[#7A6F68] hover:text-[#2B1A13] rounded-full hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Parent Category Dropdown (Requirement 2 & 5) */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Parent Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] font-semibold text-[#2B1A13]"
                  required
                >
                  <option value="">Select parent category</option>
                  {parentCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Name (Requirement 5: Empty placeholder) */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Subcategory Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingSub) setSlug(slugify(e.target.value));
                  }}
                  placeholder="Enter subcategory name"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Enter URL slug"
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Description (shown in shop banner)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter subcategory description"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              {/* Image Upload (Landscape banner background) */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Subcategory Image (Landscape Banner Background)
                </label>
                <div className="flex items-center gap-3">
                  {image ? (
                    <div className="relative w-24 h-14 rounded-lg overflow-hidden border border-[#E8DFD5] group shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setImage(""); setPublicId(""); }}
                        className="absolute top-1 right-1 p-0.5 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-14 rounded-lg border-2 border-dashed border-[#E8DFD5] flex flex-col items-center justify-center text-[#7A6F68] bg-[#FAF7F2] shrink-0">
                      <ImageIcon className="w-4 h-4 text-[#7A6F68]/70" />
                      <span className="text-[9px] mt-0.5">No image</span>
                    </div>
                  )}

                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-[#E8DFD5] rounded-lg text-xs font-semibold text-[#2B1A13] hover:border-[#7B1123] cursor-pointer bg-[#FAF7F2] transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#7B1123]" />
                    <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Display Order & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    placeholder="Enter display order"
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                    Visibility
                  </label>
                  <label className="flex items-center gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-[#7B1123] rounded-sm focus:ring-[#7B1123]"
                    />
                    <span className="text-xs font-medium text-[#2B1A13]">
                      Active & Visible
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#EFE8DE] flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-[#E8DFD5] text-[#7A6F68] text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-5 py-2 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingSub ? "Update Subcategory" : "Create Subcategory"}
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
        itemType="subcategory"
        itemName={deleteTarget?.name}
        isLoading={Boolean(deletingId)}
      />
    </div>
  );
}


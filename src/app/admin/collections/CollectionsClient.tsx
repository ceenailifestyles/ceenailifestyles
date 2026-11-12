"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import { slugify } from "@/lib/utils";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

export default function CollectionsClient({
  initialCollections,
  availableProducts,
}: {
  initialCollections: any[];
  availableProducts: any[];
}) {
  const [collections, setCollections] = useState(initialCollections);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<any | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setEditingCol(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setSelectedProductIds([]);
    setDisplayOrder(collections.length + 1);
    setIsActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (col: any) => {
    setEditingCol(col);
    setTitle(col.title);
    setSlug(col.slug);
    setDescription(col.description || "");
    setSelectedProductIds(col.products?.map((cp: any) => cp.product.id) || []);
    setDisplayOrder(col.displayOrder || 0);
    setIsActive(col.isActive ?? true);
    setError(null);
    setIsModalOpen(true);
  };

  const toggleProductSelect = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title,
      slug: slugify(slug || title),
      description: description || null,
      isActive,
      displayOrder: parseInt(displayOrder.toString(), 10) || 0,
      productIds: selectedProductIds,
    };

    try {
      const url = editingCol
        ? `/api/admin/collections/${editingCol.id}`
        : `/api/admin/collections`;
      const method = editingCol ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      // Refresh list
      const ref = await fetch("/api/admin/collections");
      const refData = await ref.json();
      setCollections(refData.collections || []);
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
      const res = await fetch(`/api/admin/collections/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setCollections((prev) => prev.filter((c) => c.id !== deleteTarget.id));
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
          <span>Create Collection</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((col) => {
          const prods = col.products || [];
          return (
            <div
              key={col.id}
              className="bg-white rounded-2xl border border-[#EFE8DE] shadow-xs p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-serif font-bold text-base text-[#2B1A13]">{col.title}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      col.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {col.isActive ? "Active" : "Disabled"}
                  </span>
                </div>

                <p className="text-xs text-[#7A6F68] mb-3 line-clamp-2">
                  {col.description || "No description."}
                </p>

                <div className="text-[11px] text-[#7A6F68] space-y-1 mb-3">
                  <div>Slug: <code className="text-[#7B1123]">/{col.slug}</code></div>
                  <div>Assigned Products: <strong>{prods.length}</strong> items</div>
                </div>

                {/* Preview thumbnails */}
                {prods.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-hidden py-1">
                    {prods.slice(0, 4).map((cp: any, idx: number) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={idx}
                        src={cp.product.mainImage}
                        alt={cp.product.name}
                        className="w-10 h-12 rounded object-cover border border-[#E8DFD5]"
                      />
                    ))}
                    {prods.length > 4 && (
                      <span className="text-[10px] text-[#7A6F68] font-bold pl-1">
                        +{prods.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE8DE] mt-4">
                <button
                  onClick={() => openEdit(col)}
                  className="p-1.5 text-[#2B1A13] hover:text-[#7B1123] hover:bg-[#FAF7F2] rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: col.id, title: col.title })}
                  className="p-1.5 text-[#7A6F68] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#EFE8DE] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#7B1123] px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-serif font-bold text-base">
                {editingCol ? "Edit Collection" : "New Collection"}
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
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editingCol) setSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Festive Edit"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Dresses, Suits & More for Your Special Occasions"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>

              {/* Assign Products Checklist */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-2">
                  Select Associated Products ({selectedProductIds.length} chosen)
                </label>
                <div className="border border-[#E8DFD5] rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 bg-[#FAF7F2]">
                  {availableProducts.map((p) => {
                    const checked = selectedProductIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProductSelect(p.id)}
                          className="accent-[#7B1123] w-4 h-4 rounded-sm"
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.mainImage} alt={p.name} className="w-8 h-10 rounded object-cover" />
                        <span className="truncate flex-1 font-medium text-[#2B1A13]">{p.name}</span>
                      </label>
                    );
                  })}
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
                  disabled={saving}
                  className="px-5 py-2 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Collection"}
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
        itemType="collection"
        itemName={deleteTarget?.title}
        isLoading={isDeleting}
      />
    </div>
  );
}


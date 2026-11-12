"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, Ruler, AlertCircle } from "lucide-react";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

interface SizeItem {
  id: string;
  name: string;
  displayOrder: number;
}

export default function SizesClient({ initialSizes }: { initialSizes: SizeItem[] }) {
  const [sizes, setSizes] = useState<SizeItem[]>(initialSizes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<SizeItem | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingSize(null);
    setName("");
    setDisplayOrder(sizes.length + 1);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (size: SizeItem) => {
    setEditingSize(size);
    setName(size.name);
    setDisplayOrder(size.displayOrder);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSize(null);
    setName("");
    setDisplayOrder(0);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter size label.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingSize
        ? `/api/admin/sizes/${editingSize.id}`
        : "/api/admin/sizes";
      const method = editingSize ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim().toUpperCase(),
          displayOrder: Number(displayOrder) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save size");
      }

      if (editingSize) {
        setSizes((prev) =>
          prev
            .map((s) => (s.id === editingSize.id ? data.size : s))
            .sort((a, b) => a.displayOrder - b.displayOrder)
        );
      } else {
        setSizes((prev) =>
          [...prev, data.size].sort((a, b) => a.displayOrder - b.displayOrder)
        );
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
      const res = await fetch(`/api/admin/sizes/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete size");
        return;
      }
      setSizes((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert("Error deleting size.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#7A6F68]">
          Total Sizes: <strong>{sizes.length}</strong>
        </span>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Size</span>
        </button>
      </div>

      {/* Sizes List */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EFE8DE] text-[#7A6F68]">
              <tr>
                <th className="py-3 px-6 font-semibold w-24">Order</th>
                <th className="py-3 px-6 font-semibold">Size Label</th>
                <th className="py-3 px-6 font-semibold">Preview Badge</th>
                <th className="py-3 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DE]/60">
              {sizes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[#7A6F68]">
                    No sizes created yet.
                  </td>
                </tr>
              ) : (
                sizes.map((size) => (
                  <tr key={size.id} className="hover:bg-[#FAF7F2]/50">
                    <td className="py-3.5 px-6 font-mono text-[#7A6F68]">
                      #{size.displayOrder}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-[#2B1A13]">
                      {size.name}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] text-xs font-bold text-[#2B1A13]">
                        {size.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(size)}
                          className="p-1.5 text-[#7A6F68] hover:text-[#7B1123] hover:bg-[#FAF7F2] rounded-md transition-colors cursor-pointer"
                          title="Edit Size"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: size.id, name: size.name })}
                          disabled={deletingId === size.id}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Size"
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

      {/* REUSABLE POPUP MODAL (Requirement 1 & 7) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE8DE] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-[#EFE8DE] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#7B1123]" />
                <h3 className="font-bold text-sm text-[#2B1A13]">
                  {editingSize ? "Edit Size" : "Add New Size"}
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Size Label (Requirement 5: empty placeholder) */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Size Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="Enter size label (e.g. S, M, XL)"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] font-semibold"
                  autoFocus
                  required
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                  placeholder="Enter display order (e.g. 1)"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  min={0}
                />
                <p className="text-[10px] text-[#7A6F68] mt-1">
                  Lower numbers appear first in the customer size picker.
                </p>
              </div>

              {/* Preview */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] flex items-center justify-between">
                <span className="text-xs text-[#7A6F68]">Preview:</span>
                <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-lg border border-[#7B1123] bg-white text-xs font-bold text-[#7B1123]">
                  {name || "S"}
                </span>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#EFE8DE] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-[#E8DFD5] text-[#7A6F68] text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingSize ? "Update Size" : "Create Size"}
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
        itemType="size"
        itemName={deleteTarget?.name}
        isLoading={Boolean(deletingId)}
      />
    </div>
  );
}


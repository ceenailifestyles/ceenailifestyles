"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, Palette, Check, AlertCircle } from "lucide-react";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

interface ColorItem {
  id: string;
  name: string;
  hex: string;
}

export default function ColorsClient({ initialColors }: { initialColors: ColorItem[] }) {
  const [colors, setColors] = useState<ColorItem[]>(initialColors);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<ColorItem | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#000000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingColor(null);
    setName("");
    setHex("#7B1123");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (color: ColorItem) => {
    setEditingColor(color);
    setName(color.name);
    setHex(color.hex);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingColor(null);
    setName("");
    setHex("#000000");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter color name.");
      return;
    }
    if (!hex.trim()) {
      setError("Please select or enter color HEX code.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingColor
        ? `/api/admin/colors/${editingColor.id}`
        : "/api/admin/colors";
      const method = editingColor ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), hex: hex.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save color");
      }

      if (editingColor) {
        setColors((prev) =>
          prev.map((c) => (c.id === editingColor.id ? data.color : c))
        );
      } else {
        setColors((prev) => [...prev, data.color].sort((a, b) => a.name.localeCompare(b.name)));
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
      const res = await fetch(`/api/admin/colors/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete color");
        return;
      }
      setColors((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert("Error deleting color.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#7A6F68]">
          Total Colors: <strong>{colors.length}</strong>
        </span>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Color</span>
        </button>
      </div>

      {/* Colors Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {colors.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-[#EFE8DE] p-12 text-center text-xs text-[#7A6F68]">
            No colors added yet. Click &quot;Add New Color&quot; above to create one.
          </div>
        ) : (
          colors.map((color) => (
            <div
              key={color.id}
              className="bg-white rounded-2xl border border-[#EFE8DE] p-4 flex flex-col items-center justify-between shadow-xs hover:border-[#7B1123] transition-all group"
            >
              <div
                className="w-14 h-14 rounded-full border-2 border-black/10 shadow-inner mb-3 transition-transform group-hover:scale-105"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-xs font-bold text-[#2B1A13] text-center truncate w-full">
                {color.name}
              </span>
              <span className="text-[10px] text-[#7A6F68] font-mono mt-0.5">
                {color.hex.toUpperCase()}
              </span>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#EFE8DE] w-full justify-center">
                <button
                  onClick={() => openEditModal(color)}
                  className="p-1.5 text-[#7A6F68] hover:text-[#7B1123] hover:bg-[#FAF7F2] rounded-md transition-colors cursor-pointer"
                  title="Edit Color"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: color.id, name: color.name })}
                  disabled={deletingId === color.id}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                  title="Delete Color"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* REUSABLE POPUP MODAL (Requirement 1 & 7) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE8DE] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-[#EFE8DE] bg-[#FAF7F2] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#7B1123]" />
                <h3 className="font-bold text-sm text-[#2B1A13]">
                  {editingColor ? "Edit Color" : "Add New Color"}
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

              {/* Color Name (No hardcoded values, Requirement 5) */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Color Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter color name"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  autoFocus
                  required
                />
              </div>

              {/* Color Code & Picker */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Color Code (HEX) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hex.startsWith("#") ? hex : `#${hex}`}
                    onChange={(e) => setHex(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-[#E8DFD5] cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                    required
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: hex }}
                />
                <div className="text-xs">
                  <span className="font-semibold text-[#2B1A13] block">
                    {name || "Preview Color"}
                  </span>
                  <span className="text-[#7A6F68] font-mono text-[10px]">
                    {hex.toUpperCase()}
                  </span>
                </div>
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
                  {saving ? "Saving..." : editingColor ? "Update Color" : "Create Color"}
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
        itemType="color"
        itemName={deleteTarget?.name}
        isLoading={Boolean(deletingId)}
      />
    </div>
  );
}


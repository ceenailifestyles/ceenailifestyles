"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, Package, Palette, CheckCircle, EyeOff } from "lucide-react";
import { formatINR } from "@/lib/utils";
import ProductModal from "@/components/admin/ProductModal";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

interface AdminProductsTableProps {
  products: any[];
  categories: any[];
  colors: any[];
  sizes: any[];
  currentSearch?: string;
  currentCategoryId?: string;
}

export default function AdminProductsTable({
  products: initialProducts,
  categories,
  colors,
  sizes,
  currentSearch = "",
  currentCategoryId = "",
}: AdminProductsTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const openAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleProductSaved = (savedProduct: any) => {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === savedProduct.id ? savedProduct : p))
      );
    } else {
      setProducts((prev) => [savedProduct, ...prev]);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete product");
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      alert("Error deleting product.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Add Button Bar */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <form
          method="GET"
          action="/admin/products"
          className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1"
        >
          {/* Search box */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-[#7A6F68] absolute left-3 top-2.5" />
            <input
              type="text"
              name="search"
              defaultValue={currentSearch}
              placeholder="Search by title or SKU..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          {/* Category filter */}
          <select
            name="categoryId"
            defaultValue={currentCategoryId}
            className="px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#FAF7F2] text-[#2B1A13] hover:text-[#7B1123] border border-[#E8DFD5] rounded-lg text-xs font-semibold cursor-pointer"
          >
            Apply
          </button>
        </form>

        {/* POPUP MODAL TRIGGER (Requirement 1 & 6) */}
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs cursor-pointer shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EFE8DE] text-[#7A6F68]">
              <tr>
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Price</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold">Badges</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DE]/60">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#7A6F68]">
                    No products found. Click &quot;Add New Product&quot; to create one.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF7F2]/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 rounded-md overflow-hidden bg-[#FAF7F2] border border-[#E8DFD5] shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.mainImage}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="max-w-[200px]">
                          <span className="font-semibold text-[#2B1A13] block truncate">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-[#7A6F68] font-mono">
                            SKU: {p.sku || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Product Type (Requirement 6) */}
                    <td className="py-3 px-4">
                      {p.productType === "COLOR_WISE" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Palette className="w-3 h-3" />
                          Color-Wise
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Package className="w-3 h-3" />
                          Normal
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-[#2B1A13] block">
                        {p.category?.name || "Uncategorized"}
                      </span>
                      {p.subcategory?.name && (
                        <span className="text-[10px] text-[#7A6F68]">
                          ↳ {p.subcategory.name}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-[#7B1123] block">
                        {formatINR(p.sellingPrice)}
                      </span>
                      {p.originalPrice > p.sellingPrice && (
                        <span className="text-[10px] text-[#7A6F68] line-through">
                          {formatINR(p.originalPrice)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          p.stock <= 5
                            ? "text-red-600"
                            : p.stock <= 15
                            ? "text-amber-600"
                            : "text-[#2B1A13]"
                        }`}
                      >
                        {p.stock} in stock
                      </span>
                      {p.variants && p.variants.length > 0 && (
                        <span className="text-[10px] text-[#7A6F68] block">
                          {p.variants.length} variant(s)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.isNewArrival && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-sm text-[9px] font-bold">
                            New
                          </span>
                        )}
                        {p.isFeatured && (
                          <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-sm text-[9px] font-bold">
                            Featured
                          </span>
                        )}
                        {p.isBestSeller && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-sm text-[9px] font-bold">
                            Best Seller
                          </span>
                        )}
                        {p.isOffer && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-sm text-[9px] font-bold">
                            Offer
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {p.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* EDIT OPENS POPUP MODAL (Requirement 1) */}
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-[#7A6F68] hover:text-[#7B1123] hover:bg-[#FAF7F2] rounded-md transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                          disabled={deletingId === p.id}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete Product"
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

      {/* REUSABLE PRODUCT CREATION / EDITING POPUP MODAL */}
      <ProductModal
        key={editingProduct?.id || "new"}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSaved={handleProductSaved}
        categories={categories}
        availableColors={colors}
        availableSizes={sizes}
        initialData={editingProduct}
      />

      {/* PROPER DELETE CONFIRMATION POPUP UI */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemType="product"
        itemName={deleteTarget?.name}
        isLoading={Boolean(deletingId)}
      />
    </div>
  );
}

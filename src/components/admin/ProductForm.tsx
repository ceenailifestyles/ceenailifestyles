"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Check, AlertCircle, ArrowRight } from "lucide-react";
import { slugify, calculateDiscount } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  children?: { id: string; name: string }[];
}

interface ProductFormProps {
  categories: Category[];
  initialData?: any;
}

export default function ProductForm({ categories, initialData }: ProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || "");
  const [subcategoryId, setSubcategoryId] = useState(initialData?.subcategoryId || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || "");
  const [sellingPrice, setSellingPrice] = useState(initialData?.sellingPrice?.toString() || "");
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice?.toString() || "");
  const [discount, setDiscount] = useState(initialData?.discount || 0);
  const [stock, setStock] = useState(initialData?.stock?.toString() || "");
  const [mainImage, setMainImage] = useState(initialData?.mainImage || "");
  const [mainImageId, setMainImageId] = useState(initialData?.mainImageId || "");

  const [galleryImages, setGalleryImages] = useState<{ url: string; publicId?: string }[]>(
    initialData?.images?.map((img: any) => ({ url: img.url, publicId: img.publicId })) || []
  );

  const [sizesInput, setSizesInput] = useState(
    Array.isArray(initialData?.sizes) ? (initialData.sizes as string[]).join(", ") : ""
  );
  const [colorsInput, setColorsInput] = useState(
    Array.isArray(initialData?.colors) ? (initialData.colors as string[]).join(", ") : ""
  );

  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [isBestSeller, setIsBestSeller] = useState(initialData?.isBestSeller ?? false);
  const [isNewArrival, setIsNewArrival] = useState(initialData?.isNewArrival ?? true);
  const [isOffer, setIsOffer] = useState(initialData?.isOffer ?? false);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-slug from name if empty
  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialData) {
      setSlug(slugify(val));
    }
  };

  // Auto calculate discount
  const handlePriceChange = (sell: string, orig: string) => {
    setSellingPrice(sell);
    setOriginalPrice(orig);
    const s = parseFloat(sell) || 0;
    const o = parseFloat(orig) || 0;
    if (o > s && o > 0) {
      setDiscount(calculateDiscount(o, s));
    } else {
      setDiscount(0);
    }
  };

  // Upload image to Cloudinary via server API
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "ceeneai/products");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (isGallery) {
        setGalleryImages((prev) => [...prev, { url: data.url, publicId: data.publicId }]);
      } else {
        setMainImage(data.url);
        setMainImageId(data.publicId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image to Cloudinary");
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (idx: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!mainImage) {
      setError("Please upload a main product image.");
      return;
    }

    const sizes = sizesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const colors = colorsInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const payload = {
      name,
      slug: slugify(slug),
      sku: sku || undefined,
      categoryId,
      subcategoryId: subcategoryId || null,
      description,
      shortDescription: shortDescription || null,
      sellingPrice: parseFloat(sellingPrice),
      originalPrice: parseFloat(originalPrice) || parseFloat(sellingPrice),
      discount: parseInt(discount.toString(), 10) || 0,
      stock: parseInt(stock, 10) || 0,
      mainImage,
      mainImageId: mainImageId || null,
      galleryImages,
      sizes,
      colors,
      isFeatured,
      isBestSeller,
      isNewArrival,
      isOffer,
      isActive,
    };

    setLoading(true);

    try {
      const url = initialData
        ? `/api/admin/products/${initialData.id}`
        : `/api/admin/products`;
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Find subcategories for selected category
  const selectedCatObj = categories.find((c) => c.id === categoryId);
  const subcategories = selectedCatObj?.children || [];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
      {error && (
        <div className="flex items-start gap-2 p-3 text-xs text-[#7B1123] bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#2B1A13] pb-2 border-b border-[#EFE8DE]">
          Product Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Embroidered A-Line Kurti"
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Unique Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. embroidered-a-line-kurti"
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">SKU</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. CEE-IK-001"
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubcategoryId("");
              }}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Subcategory (Optional)</label>
            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            >
              <option value="">None</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Stock Quantity</label>
            <input
              type="number"
              required
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Short Description</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief 1-sentence highlight for cards & previews"
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Full Description</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description, fabric information, styling notes..."
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Variations */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#2B1A13] pb-2 border-b border-[#EFE8DE]">
          Pricing & Variations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Selling Price (₹)</label>
            <input
              type="number"
              required
              value={sellingPrice}
              onChange={(e) => handlePriceChange(e.target.value, originalPrice)}
              placeholder="1199"
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Original Price (₹)</label>
            <input
              type="number"
              required
              value={originalPrice}
              onChange={(e) => handlePriceChange(sellingPrice, e.target.value)}
              placeholder="1499"
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">Calculated Discount (%)</label>
            <input
              type="number"
              readOnly
              value={discount}
              className="w-full px-3 py-2 text-xs bg-gray-100 border border-[#E8DFD5] rounded-lg text-[#7A6F68]"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
              Sizes (Comma separated)
            </label>
            <input
              type="text"
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              placeholder="S, M, L, XL, XXL"
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
              Colors (Comma separated)
            </label>
            <input
              type="text"
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              placeholder="Plum Magenta, Deep Teal"
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
            />
          </div>
        </div>
      </div>

      {/* Cloudinary Image Upload Section */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#2B1A13] pb-2 border-b border-[#EFE8DE]">
          Cloudinary Images
        </h3>

        <div>
          <label className="block text-xs font-semibold text-[#2B1A13] mb-2">
            Main Product Image *
          </label>
          <div className="flex items-center gap-4">
            {mainImage ? (
              <div className="relative w-24 h-32 rounded-lg overflow-hidden border border-[#E8DFD5] bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mainImage} alt="Main Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setMainImage(""); setMainImageId(""); }}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : null}

            <label className="cursor-pointer border-2 border-dashed border-[#D8CFBF] hover:border-[#7B1123] rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors">
              <Upload className="w-5 h-5 text-[#7A6F68] mb-1" />
              <span className="text-xs font-semibold text-[#2B1A13]">
                {uploading ? "Uploading..." : "Upload Main Image to Cloudinary"}
              </span>
              <span className="text-[10px] text-[#7A6F68]">JPG, PNG, WEBP up to 10MB</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => handleImageUpload(e, false)}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Gallery Images */}
        <div className="pt-4 border-t border-[#EFE8DE]">
          <label className="block text-xs font-semibold text-[#2B1A13] mb-2">
            Additional Gallery Images
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                className="relative w-20 h-24 rounded-lg overflow-hidden border border-[#E8DFD5] bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <label className="cursor-pointer border-2 border-dashed border-[#D8CFBF] hover:border-[#7B1123] rounded-xl w-20 h-24 flex flex-col items-center justify-center text-center transition-colors">
              <Upload className="w-4 h-4 text-[#7A6F68] mb-1" />
              <span className="text-[10px] font-semibold text-[#2B1A13]">Add Image</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => handleImageUpload(e, true)}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Badges and Visibility */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#2B1A13] pb-2 border-b border-[#EFE8DE]">
          Badges & Catalog Visibility
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#2B1A13] cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="accent-[#7B1123] w-4 h-4 rounded-sm"
            />
            <span>Featured Product</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#2B1A13] cursor-pointer">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="accent-[#7B1123] w-4 h-4 rounded-sm"
            />
            <span>Best Seller</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#2B1A13] cursor-pointer">
            <input
              type="checkbox"
              checked={isNewArrival}
              onChange={(e) => setIsNewArrival(e.target.checked)}
              className="accent-[#7B1123] w-4 h-4 rounded-sm"
            />
            <span>New Arrival</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#2B1A13] cursor-pointer">
            <input
              type="checkbox"
              checked={isOffer}
              onChange={(e) => setIsOffer(e.target.checked)}
              className="accent-[#7B1123] w-4 h-4 rounded-sm"
            />
            <span>Special Offer</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-[#2B1A13] cursor-pointer sm:col-span-4 pt-2 border-t border-[#EFE8DE]">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-[#7B1123] w-4 h-4 rounded-sm"
            />
            <span className="font-bold">Active in Storefront (Visible to customers)</span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || uploading}
          className="px-6 py-3 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Saving to MySQL..." : initialData ? "Update Product" : "Publish Product"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-white border border-[#E8DFD5] text-[#2B1A13] text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}


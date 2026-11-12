"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Upload,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Package,
  Palette,
  Ruler,
  Image as ImageIcon,
} from "lucide-react";
import { slugify, calculateDiscount, formatINR } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  children?: { id: string; name: string }[];
}

interface ColorItem {
  id: string;
  name: string;
  hex: string;
}

interface SizeItem {
  id: string;
  name: string;
  displayOrder: number;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (product: any) => void;
  categories: Category[];
  availableColors: ColorItem[];
  availableSizes: SizeItem[];
  initialData?: any;
}

export default function ProductModal({
  isOpen,
  onClose,
  onSaved,
  categories,
  availableColors,
  availableSizes,
  initialData,
}: ProductModalProps) {
  // Product Type: "NORMAL" | "COLOR_WISE"
  const [productType, setProductType] = useState<"NORMAL" | "COLOR_WISE">(
    initialData?.productType || "NORMAL"
  );

  // Basic Info
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId || categories[0]?.id || ""
  );
  const [subcategoryId, setSubcategoryId] = useState(
    initialData?.subcategoryId || ""
  );
  const [description, setDescription] = useState(initialData?.description || "");
  const [shortDescription, setShortDescription] = useState(
    initialData?.shortDescription || ""
  );
  const [sellingPrice, setSellingPrice] = useState(
    initialData?.sellingPrice?.toString() || ""
  );
  const [originalPrice, setOriginalPrice] = useState(
    initialData?.originalPrice?.toString() || ""
  );
  const [discount, setDiscount] = useState(initialData?.discount || 0);
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>(
    Array.isArray(initialData?.specifications) ? initialData.specifications : []
  );

  // Status & Badges
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured ?? false);
  const [isBestSeller, setIsBestSeller] = useState(
    initialData?.isBestSeller ?? false
  );
  const [isNewArrival, setIsNewArrival] = useState(
    initialData?.isNewArrival ?? true
  );
  const [isOffer, setIsOffer] = useState(initialData?.isOffer ?? false);

  // --- Normal Product State ---
  const [mainImage, setMainImage] = useState(initialData?.mainImage || "");
  const [mainImageId, setMainImageId] = useState(
    initialData?.mainImageId || ""
  );
  const [normalGallery, setNormalGallery] = useState<
    { url: string; publicId?: string }[]
  >(
    initialData?.images
      ? initialData.images
          .filter((img: any) => !img.colorName)
          .map((img: any) => ({ url: img.url, publicId: img.publicId }))
      : []
  );
  // Normal sizes selected + individual stock per size ( strictly from saved variants matching availableSizes )
  const [normalSelectedSizes, setNormalSelectedSizes] = useState<string[]>(() => {
    const validSizeNames = new Set(availableSizes.map((s) => s.name));
    if (Array.isArray(initialData?.variants)) {
      return initialData.variants
        .filter((v: any) => !v.colorName && validSizeNames.has(v.size))
        .map((v: any) => v.size as string);
    }
    return [];
  });
  const [normalSizeStock, setNormalSizeStock] = useState<Record<string, number | string>>(
    () => {
      const validSizeNames = new Set(availableSizes.map((s) => s.name));
      const stockMap: Record<string, number | string> = {};
      if (Array.isArray(initialData?.variants)) {
        for (const v of initialData.variants) {
          if (!v.colorName && validSizeNames.has(v.size)) {
            stockMap[v.size] = v.stock;
          }
        }
      }
      return stockMap;
    }
  );
  // Direct stock when product has no size variants
  const [stock, setStock] = useState<number | string>(() => initialData?.stock ?? 0);

  // --- Color-Wise Product State ---
  const [selectedColors, setSelectedColors] = useState<string[]>(() => {
    const validColorNames = new Set(availableColors.map((c) => c.name));
    if (Array.isArray(initialData?.variants) && initialData.variants.length > 0) {
      const cols = Array.from(
        new Set<string>(
          initialData.variants
            .filter((v: any) => v.colorName && validColorNames.has(v.colorName))
            .map((v: any) => String(v.colorName))
        )
      );
      if (cols.length > 0) return cols;
    }
    return [];
  });
  // Images mapped per color: Record<colorName, { url: string; publicId?: string }[]>
  const [colorImages, setColorImages] = useState<
    Record<string, { url: string; publicId?: string }[]>
  >(() => {
    const map: Record<string, { url: string; publicId?: string }[]> = {};
    if (initialData?.images) {
      for (const img of initialData.images) {
        if (img.colorName) {
          if (!map[img.colorName]) map[img.colorName] = [];
          map[img.colorName].push({ url: img.url, publicId: img.publicId });
        }
      }
    }
    return map;
  });
  // Sizes selected per color: Record<colorName, string[]>
  const [colorSizes, setColorSizes] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {};
    if (initialData?.variants) {
      for (const v of initialData.variants) {
        if (v.colorName) {
          if (!map[v.colorName]) map[v.colorName] = [];
          if (!map[v.colorName].includes(v.size)) {
            map[v.colorName].push(v.size);
          }
        }
      }
    }
    return map;
  });
  // Stock per (Color + Size): Record<`${colorName}_${size}`, number | string>
  const [colorVariantStock, setColorVariantStock] = useState<
    Record<string, number | string>
  >(() => {
    const map: Record<string, number | string> = {};
    if (initialData?.variants) {
      for (const v of initialData.variants) {
        if (v.colorName) {
          map[`${v.colorName}_${v.size}`] = v.stock;
        }
      }
    }
    return map;
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form state whenever initialData or isOpen changes
  useEffect(() => {
    if (!isOpen) return;

    setError(null);

    if (initialData) {
      const hasColorVariants =
        initialData.productType === "COLOR_WISE" ||
        (Array.isArray(initialData.variants) &&
          initialData.variants.some((v: any) => Boolean(v.colorName))) ||
        (Array.isArray(initialData.images) &&
          initialData.images.some((img: any) => Boolean(img.colorName)));

      setProductType(hasColorVariants ? "COLOR_WISE" : "NORMAL");
      setName(initialData.name || "");
      setSlug(initialData.slug || "");
      setSku(initialData.sku || "");
      setCategoryId(initialData.categoryId || categories[0]?.id || "");
      setSubcategoryId(initialData.subcategoryId || "");
      setDescription(initialData.description || "");
      setShortDescription(initialData.shortDescription || "");
      setSellingPrice(
        initialData.sellingPrice !== undefined && initialData.sellingPrice !== null
          ? initialData.sellingPrice.toString()
          : ""
      );
      setOriginalPrice(
        initialData.originalPrice !== undefined && initialData.originalPrice !== null
          ? initialData.originalPrice.toString()
          : ""
      );
      setDiscount(initialData.discount || 0);
      setSpecifications(
        Array.isArray(initialData.specifications)
          ? initialData.specifications.map((s: any) => ({
              key: String(s?.key || ""),
              value: String(s?.value || ""),
            }))
          : []
      );

      setIsActive(initialData.isActive ?? true);
      setIsFeatured(initialData.isFeatured ?? false);
      setIsBestSeller(initialData.isBestSeller ?? false);
      setIsNewArrival(initialData.isNewArrival ?? true);
      setIsOffer(initialData.isOffer ?? false);

      setMainImage(initialData.mainImage || "");
      setMainImageId(initialData.mainImageId || "");

      // Normal gallery
      setNormalGallery(
        Array.isArray(initialData.images)
          ? initialData.images
              .filter((img: any) => !img.colorName)
              .map((img: any) => ({ url: img.url, publicId: img.publicId }))
          : []
      );

      // Normal sizes & stock (strictly from saved variants that exist in availableSizes)
      const validSizeNames = new Set(availableSizes.map((s) => s.name));
      const normalVariants = Array.isArray(initialData.variants)
        ? initialData.variants.filter(
            (v: any) => !v.colorName && validSizeNames.has(v.size)
          )
        : [];
      const parsedSizes = Array.from(
        new Set<string>(normalVariants.map((v: any) => String(v.size)))
      );

      setNormalSelectedSizes(parsedSizes);

      const nStockMap: Record<string, number | string> = {};
      for (const v of normalVariants) {
        nStockMap[v.size] = v.stock;
      }
      setNormalSizeStock(nStockMap);
      setStock(
        initialData.stock !== undefined && initialData.stock !== null
          ? initialData.stock
          : 0
      );

      // Color-wise state (strictly from saved variants/images matching availableColors)
      const validColorNames = new Set(availableColors.map((c) => c.name));
      const colorVariants = Array.isArray(initialData.variants)
        ? initialData.variants.filter(
            (v: any) =>
              Boolean(v.colorName) &&
              validColorNames.has(v.colorName) &&
              validSizeNames.has(v.size)
          )
        : [];
      const colorsFromVariants: string[] = Array.from(
        new Set<string>(colorVariants.map((v: any) => String(v.colorName)))
      );
      const colorsFromImages: string[] = Array.isArray(initialData.images)
        ? Array.from(
            new Set<string>(
              initialData.images
                .filter(
                  (img: any) =>
                    Boolean(img.colorName) && validColorNames.has(img.colorName)
                )
                .map((img: any) => String(img.colorName))
            )
          )
        : [];
      const parsedColors: string[] = Array.from(
        new Set<string>([...colorsFromVariants, ...colorsFromImages])
      );

      setSelectedColors(parsedColors);

      const cImgMap: Record<string, { url: string; publicId?: string }[]> = {};
      if (Array.isArray(initialData.images)) {
        for (const img of initialData.images) {
          if (img.colorName && validColorNames.has(img.colorName)) {
            if (!cImgMap[img.colorName]) cImgMap[img.colorName] = [];
            cImgMap[img.colorName].push({ url: img.url, publicId: img.publicId });
          }
        }
      }
      setColorImages(cImgMap);

      const cSizeMap: Record<string, string[]> = {};
      const cStockMap: Record<string, number | string> = {};
      for (const v of colorVariants) {
        if (v.colorName) {
          if (!cSizeMap[v.colorName]) cSizeMap[v.colorName] = [];
          if (!cSizeMap[v.colorName].includes(v.size)) {
            cSizeMap[v.colorName].push(v.size);
          }
          cStockMap[`${v.colorName}_${v.size}`] = v.stock;
        }
      }
      setColorSizes(cSizeMap);
      setColorVariantStock(cStockMap);
    } else {
      // Reset for "Add New Product"
      setProductType("NORMAL");
      setName("");
      setSlug("");
      setSku("");
      setCategoryId(categories[0]?.id || "");
      setSubcategoryId("");
      setDescription("");
      setShortDescription("");
      setSellingPrice("");
      setOriginalPrice("");
      setDiscount(0);
      setSpecifications([]);
      setIsActive(true);
      setIsFeatured(false);
      setIsBestSeller(false);
      setIsNewArrival(true);
      setIsOffer(false);
      setMainImage("");
      setMainImageId("");
      setNormalGallery([]);
      setNormalSelectedSizes([]);
      setNormalSizeStock({});
      setStock(0);
      setSelectedColors([]);
      setColorImages({});
      setColorSizes({});
      setColorVariantStock({});
    }
  }, [initialData, isOpen, categories]);

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

  // Find subcategories for selected category
  const activeCategory = categories.find((c) => c.id === categoryId);
  const subcategories = activeCategory?.children || [];

  // Cloudinary upload helper
  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "ceeneai/products");

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return { url: data.url, publicId: data.publicId };
  };

  // Upload main image for normal product
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadFile(file);
      setMainImage(uploaded.url);
      setMainImageId(uploaded.publicId || "");
    } catch (err: any) {
      setError(err.message || "Failed to upload main image");
    } finally {
      setUploading(false);
    }
  };

  // Upload extra gallery images for normal product
  const handleNormalGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const uploaded = await uploadFile(files[i]);
        setNormalGallery((prev) => [...prev, uploaded]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload gallery images");
    } finally {
      setUploading(false);
    }
  };

  // Upload images for a specific color
  const handleColorImageUpload = async (
    colorName: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const uploaded = await uploadFile(files[i]);
        setColorImages((prev) => ({
          ...prev,
          [colorName]: [...(prev[colorName] || []), uploaded],
        }));
        // If no main image is set yet, use first color's first photo
        if (!mainImage) {
          setMainImage(uploaded.url);
          setMainImageId(uploaded.publicId || "");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image for color");
    } finally {
      setUploading(false);
    }
  };

  // Toggle Normal Size
  const toggleNormalSize = (sizeName: string) => {
    if (normalSelectedSizes.includes(sizeName)) {
      setNormalSelectedSizes((prev) => prev.filter((s) => s !== sizeName));
      const nextStock = { ...normalSizeStock };
      delete nextStock[sizeName];
      setNormalSizeStock(nextStock);
    } else {
      setNormalSelectedSizes((prev) => [...prev, sizeName]);
      setNormalSizeStock((prev) => ({ ...prev, [sizeName]: "" }));
    }
  };

  // Toggle Color selection
  const toggleColor = (colorName: string) => {
    if (selectedColors.includes(colorName)) {
      setSelectedColors((prev) => prev.filter((c) => c !== colorName));
    } else {
      setSelectedColors((prev) => [...prev, colorName]);
      if (!colorSizes[colorName]) {
        setColorSizes((prev) => ({ ...prev, [colorName]: [] }));
      }
    }
  };

  // Toggle Size for a specific color
  const toggleColorSize = (colorName: string, sizeName: string) => {
    const current = colorSizes[colorName] || [];
    if (current.includes(sizeName)) {
      setColorSizes((prev) => ({
        ...prev,
        [colorName]: current.filter((s) => s !== sizeName),
      }));
      const newStock = { ...colorVariantStock };
      delete newStock[`${colorName}_${sizeName}`];
      setColorVariantStock(newStock);
    } else {
      setColorSizes((prev) => ({
        ...prev,
        [colorName]: [...current, sizeName],
      }));
      setColorVariantStock((prev) => ({
        ...prev,
        [`${colorName}_${sizeName}`]: "",
      }));
    }
  };

  // Calculate live total stock
  const calculateTotalStock = () => {
    if (productType === "NORMAL") {
      if (normalSelectedSizes.length === 0) {
        return Math.max(0, parseInt(String(stock || 0), 10) || 0);
      }
      return normalSelectedSizes.reduce<number>(
        (sum, sz) => sum + (parseInt(String(normalSizeStock[sz] || 0), 10) || 0),
        0
      );
    } else {
      return Object.values(colorVariantStock).reduce<number>(
        (sum, val) => sum + (parseInt(String(val || 0), 10) || 0),
        0
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter product name.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    const sPrice = parseFloat(sellingPrice);
    const oPrice = parseFloat(originalPrice);
    if (isNaN(sPrice) || sPrice <= 0) {
      setError("Please enter a valid selling price.");
      return;
    }
    if (isNaN(oPrice) || oPrice <= 0) {
      setError("Please enter a valid original price.");
      return;
    }

    // Validation per type
    if (productType === "NORMAL") {
      if (!mainImage) {
        setError("Please upload at least one main image for the product.");
        return;
      }
      // Sizes are optional: if none selected, direct product stock is used
    } else {
      if (selectedColors.length === 0) {
        setError("Please select at least one color for this color-wise product.");
        return;
      }
      for (const c of selectedColors) {
        if (!colorImages[c] || colorImages[c].length === 0) {
          setError(`Please upload at least one image for color "${c}".`);
          return;
        }
        if (!colorSizes[c] || colorSizes[c].length === 0) {
          setError(`Please select available sizes for color "${c}".`);
          return;
        }
      }
    }

    setSaving(true);
    setError(null);

    try {
      // Build variants & gallery
      let galleryImagesPayload: { url: string; publicId?: string | null; colorName?: string | null }[] = [];
      let variantsPayload: {
        size: string;
        stock: number;
        colorName?: string | null;
        colorHex?: string | null;
      }[] = [];

      let finalMainImage = mainImage;
      let finalMainImageId = mainImageId;
      let finalSizes: string[] = [];
      let finalColors: string[] = [];

      if (productType === "NORMAL") {
        galleryImagesPayload = normalGallery.map((g) => ({
          url: g.url,
          publicId: g.publicId,
          colorName: null,
        }));
        if (normalSelectedSizes.length > 0) {
          variantsPayload = normalSelectedSizes.map((sz) => ({
            size: sz,
            stock: parseInt(String(normalSizeStock[sz] || 0), 10) || 0,
            colorName: null,
            colorHex: null,
          }));
          finalSizes = normalSelectedSizes;
        } else {
          variantsPayload = [];
          finalSizes = [];
        }
        finalColors = [];
      } else {
        // Color-wise: combine all color galleries
        finalColors = selectedColors;
        const allUniqueSizes = new Set<string>();

        selectedColors.forEach((colorName) => {
          const cObj = availableColors.find((ac) => ac.name === colorName);
          const imgs = colorImages[colorName] || [];
          imgs.forEach((img) => {
            galleryImagesPayload.push({
              url: img.url,
              publicId: img.publicId,
              colorName,
            });
          });

          // If mainImage not set, pick the first image of the first color
          if (!finalMainImage && imgs.length > 0) {
            finalMainImage = imgs[0].url;
            finalMainImageId = imgs[0].publicId || "";
          }

          const sizesForThisColor = colorSizes[colorName] || [];
          sizesForThisColor.forEach((sz) => {
            allUniqueSizes.add(sz);
            variantsPayload.push({
              colorName,
              colorHex: cObj?.hex || null,
              size: sz,
              stock:
                parseInt(
                  String(colorVariantStock[`${colorName}_${sz}`] || 0),
                  10
                ) || 0,
            });
          });
        });

        finalSizes = Array.from(allUniqueSizes);
      }

      const totalStock = calculateTotalStock();
      const cleanedSpecifications = specifications
        .map((s) => ({ key: s.key.trim(), value: s.value.trim() }))
        .filter((s) => s.key.length > 0 && s.value.length > 0);

      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        sku: sku.trim() || null,
        description: description.trim(),
        shortDescription: shortDescription.trim() || null,
        categoryId,
        subcategoryId: subcategoryId || null,
        productType,
        sellingPrice: sPrice,
        originalPrice: oPrice,
        discount,
        mainImage: finalMainImage,
        mainImageId: finalMainImageId || null,
        sizes: finalSizes,
        colors: finalColors,
        specifications: cleanedSpecifications,
        stock: totalStock,
        isActive,
        isFeatured,
        isBestSeller,
        isNewArrival,
        isOffer,
        galleryImages: galleryImagesPayload,
        variants: variantsPayload,
      };

      const url = initialData
        ? `/api/admin/products/${initialData.id}`
        : "/api/admin/products";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save product");
      }

      onSaved(resData.product);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving product");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#EFE8DE] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-[#EFE8DE] bg-[#FAF7F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-[#7B1123]" />
            <div>
              <h3 className="font-bold text-sm text-[#2B1A13]">
                {initialData ? "Edit Product" : "Add New Product"}
              </h3>
              <p className="text-[11px] text-[#7A6F68]">
                {productType === "NORMAL"
                  ? "Standard product with size-level inventory"
                  : "Color-wise product with dedicated images, sizes & variant inventory"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#7A6F68] hover:text-[#2B1A13] rounded-full hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. PRODUCT TYPE SELECTION (Requirement 6) */}
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DFD5]">
            <label className="block text-xs font-bold text-[#2B1A13] mb-2 uppercase tracking-wider">
              Select Product Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  productType === "NORMAL"
                    ? "border-[#7B1123] bg-white shadow-xs"
                    : "border-[#E8DFD5] bg-white/60 hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="productType"
                  value="NORMAL"
                  checked={productType === "NORMAL"}
                  onChange={() => setProductType("NORMAL")}
                  className="mt-0.5 text-[#7B1123] focus:ring-[#7B1123]"
                />
                <div>
                  <span className="font-bold text-xs text-[#2B1A13] block">
                    Normal Product
                  </span>
                  <span className="text-[11px] text-[#7A6F68] block mt-0.5">
                    No color variations. Single gallery with size & stock management.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  productType === "COLOR_WISE"
                    ? "border-[#7B1123] bg-white shadow-xs"
                    : "border-[#E8DFD5] bg-white/60 hover:bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="productType"
                  value="COLOR_WISE"
                  checked={productType === "COLOR_WISE"}
                  onChange={() => setProductType("COLOR_WISE")}
                  className="mt-0.5 text-[#7B1123] focus:ring-[#7B1123]"
                />
                <div>
                  <span className="font-bold text-xs text-[#2B1A13] block flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#7B1123]" />
                    Color-Wise Product
                  </span>
                  <span className="text-[11px] text-[#7A6F68] block mt-0.5">
                    Multiple colors. Separate image uploads & stock for each color/size.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 2. GENERAL INFORMATION (Requirement 5: Empty Placeholders) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#2B1A13] uppercase tracking-wider border-b border-[#EFE8DE] pb-1.5">
              General Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!initialData) setSlug(slugify(e.target.value));
                  }}
                  placeholder="Enter product name"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  required
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Enter product SKU"
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryId("");
                  }}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] font-semibold text-[#2B1A13]"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Subcategory
                </label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={subcategories.length === 0}
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] text-[#2B1A13] disabled:opacity-50"
                >
                  <option value="">
                    {subcategories.length === 0
                      ? "No subcategories for this category"
                      : "Select subcategory"}
                  </option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Selling Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => handlePriceChange(e.target.value, originalPrice)}
                  placeholder="Enter product price"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123] font-semibold text-[#7B1123]"
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Original Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => handlePriceChange(sellingPrice, e.target.value)}
                  placeholder="Enter original price"
                  className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                  min={0}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                  Discount (%)
                </label>
                <div className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg font-bold text-[#7B1123] flex items-center justify-between">
                  <span>{discount}% OFF</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#2B1A13] mb-1">
                Full Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                required
              />
            </div>

            {/* Common Product Specifications (Key & Value) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-semibold text-[#2B1A13]">
                    Product Specifications (Key &amp; Value)
                  </label>
                  <p className="text-[11px] text-[#7A6F68]">
                    Add common product details such as Fabric, Pattern, Fit, Wash Care, etc.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSpecifications((prev) => [...prev, { key: "", value: "" }])
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#7B1123] text-[#7B1123] hover:text-white border border-[#E8DFD5] hover:border-[#7B1123] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Specification</span>
                </button>
              </div>

              {specifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#7A6F68] bg-[#FAF7F2]/60 rounded-xl border border-dashed border-[#E8DFD5]">
                  No specifications added yet. Click &ldquo;Add Specification&rdquo; to add key-value details.
                </div>
              ) : (
                <div className="space-y-2 bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DFD5]">
                  {specifications.map((spec, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={spec.key}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSpecifications((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, key: val } : item
                              )
                            );
                          }}
                          placeholder="Enter key"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                        />
                      </div>
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSpecifications((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, value: val } : item
                              )
                            );
                          }}
                          placeholder="Enter value"
                          className="w-full px-3 py-2 text-xs bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setSpecifications((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Specification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. TYPE-SPECIFIC CONFIGURATION (Requirement 6 & 8) */}
          {productType === "NORMAL" ? (
            /* --- NORMAL PRODUCT FIELDS --- */
            <div className="space-y-6 pt-2">
              <h4 className="text-xs font-bold text-[#2B1A13] uppercase tracking-wider border-b border-[#EFE8DE] pb-1.5 flex items-center justify-between">
                <span>Normal Product Images & Sizes</span>
                <span className="text-[11px] font-semibold text-[#7B1123] lowercase">
                  Total Stock: {calculateTotalStock()} units
                </span>
              </h4>

              {/* Images */}
              <div>
                <label className="block text-xs font-semibold text-[#2B1A13] mb-2">
                  Product Images (Main Photo + Gallery)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {/* Main Image */}
                  {mainImage ? (
                    <div className="relative aspect-3/4 rounded-xl overflow-hidden border-2 border-[#7B1123] group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mainImage} alt="Main" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-sm bg-[#7B1123] text-white text-[9px] font-bold">
                        Main
                      </span>
                      <button
                        type="button"
                        onClick={() => { setMainImage(""); setMainImageId(""); }}
                        className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="aspect-3/4 rounded-xl border-2 border-dashed border-[#7B1123]/40 bg-[#FAF7F2] hover:bg-white flex flex-col items-center justify-center cursor-pointer p-2 text-center transition-colors">
                      <Upload className="w-5 h-5 text-[#7B1123] mb-1" />
                      <span className="text-[10px] font-bold text-[#7B1123]">Upload Main</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Extra Gallery Images */}
                  {normalGallery.map((img, idx) => (
                    <div key={idx} className="relative aspect-3/4 rounded-xl overflow-hidden border border-[#E8DFD5] group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setNormalGallery((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add more button */}
                  <label className="aspect-3/4 rounded-xl border-2 border-dashed border-[#E8DFD5] bg-[#FAF7F2] hover:bg-white flex flex-col items-center justify-center cursor-pointer p-2 text-center transition-colors">
                    <Plus className="w-5 h-5 text-[#7A6F68] mb-1" />
                    <span className="text-[10px] text-[#7A6F68]">Add Photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleNormalGalleryUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sizes Selection & Per-Size Stock */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#2B1A13]">
                    Available Sizes <span className="text-[11px] font-normal text-[#7A6F68]">(Optional)</span>
                  </label>
                  <span className="text-[11px] text-[#7A6F68]">
                    {normalSelectedSizes.length > 0
                      ? `${normalSelectedSizes.length} size(s) selected`
                      : "No sizes selected"}
                  </span>
                </div>

                <p className="text-[11px] text-[#7A6F68]">
                  Select sizes if this product comes in different sizes. If not applicable (e.g. accessories, sarees, free size), leave unselected and enter total stock below.
                </p>

                {/* Available Sizes Pills */}
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((sz) => {
                    const isSelected = normalSelectedSizes.includes(sz.name);
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => toggleNormalSize(sz.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-[#7B1123] text-white border-[#7B1123] shadow-2xs"
                            : "bg-[#FAF7F2] text-[#2B1A13] border-[#E8DFD5] hover:border-[#7B1123]"
                        }`}
                      >
                        {sz.name} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>

                {/* Stock Input: Direct Product Stock when no sizes selected */}
                {normalSelectedSizes.length === 0 ? (
                  <div className="bg-[#FAF7F2] rounded-xl p-4 border border-[#E8DFD5] space-y-2">
                    <label className="block text-xs font-bold text-[#2B1A13]">
                      Product Stock Quantity
                    </label>
                    <p className="text-[11px] text-[#7A6F68]">
                      Enter available units for this product.
                    </p>
                    <input
                      type="number"
                      min={0}
                      value={stock}
                      placeholder="e.g. 50"
                      onChange={(e) => {
                        const val = e.target.value;
                        setStock(val === "" ? "" : Math.max(0, parseInt(val, 10) || 0));
                      }}
                      className="w-full sm:w-48 px-3 py-2 text-xs font-bold text-[#7B1123] bg-white border border-[#E8DFD5] rounded-lg focus:outline-hidden focus:border-[#7B1123]"
                    />
                  </div>
                ) : (
                  /* Stock Table for selected sizes */
                  <div className="bg-[#FAF7F2] rounded-xl p-4 border border-[#E8DFD5] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2B1A13] block">
                        Individual Size Stock Quantity
                      </span>
                      <span className="text-[11px] font-semibold text-[#7B1123]">
                        Total Stock: {calculateTotalStock()} units
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {normalSelectedSizes.map((sz) => (
                        <div key={sz} className="bg-white p-2.5 rounded-lg border border-[#E8DFD5]">
                          <label className="block text-[11px] font-bold text-[#2B1A13] mb-1">
                            Size {sz}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={normalSizeStock[sz] ?? ""}
                            placeholder="Enter quantity"
                            onChange={(e) => {
                              const val = e.target.value;
                              setNormalSizeStock((prev) => ({
                                ...prev,
                                [sz]: val === "" ? "" : Math.max(0, parseInt(val, 10) || 0),
                              }));
                            }}
                            className="w-full px-2 py-1 text-xs font-bold text-[#7B1123] border border-[#E8DFD5] rounded-md focus:outline-hidden focus:border-[#7B1123]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --- COLOR-WISE PRODUCT FIELDS (Requirement 6B) --- */
            <div className="space-y-6 pt-2">
              <h4 className="text-xs font-bold text-[#2B1A13] uppercase tracking-wider border-b border-[#EFE8DE] pb-1.5 flex items-center justify-between">
                <span>Color-Wise Variations & Image Galleries</span>
                <span className="text-[11px] font-semibold text-[#7B1123] lowercase">
                  Total Stock: {calculateTotalStock()} units
                </span>
              </h4>

              {/* Step 1: Multiple Color Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#2B1A13]">
                  Select Available Colors for this Product <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {availableColors.map((c) => {
                    const isSelected = selectedColors.includes(c.name);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleColor(c.name)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-[#7B1123] text-white border-[#7B1123] shadow-xs"
                            : "bg-[#FAF7F2] text-[#2B1A13] border-[#E8DFD5] hover:border-[#7B1123]"
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Per-Color Dedicated Gallery & Stock */}
              {selectedColors.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#7A6F68] bg-[#FAF7F2] rounded-xl border border-dashed border-[#E8DFD5]">
                  Select one or more colors above to configure their individual image galleries and size stock.
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedColors.map((colorName) => {
                    const cObj = availableColors.find((ac) => ac.name === colorName);
                    const imgs = colorImages[colorName] || [];
                    const activeSizesForColor = colorSizes[colorName] || [];

                    return (
                      <div
                        key={colorName}
                        className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8DFD5] space-y-4"
                      >
                        {/* Color Card Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD5]">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                              style={{ backgroundColor: cObj?.hex || "#000" }}
                            />
                            <h5 className="font-bold text-sm text-[#2B1A13]">
                              {colorName}
                            </h5>
                            <span className="text-[10px] text-[#7A6F68] font-mono">
                              ({cObj?.hex})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleColor(colorName)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                          >
                            Remove Color
                          </button>
                        </div>

                        {/* Dedicated Image Gallery for this Color */}
                        <div>
                          <label className="block text-xs font-semibold text-[#2B1A13] mb-2">
                            Images for {colorName} ({imgs.length} uploaded)
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {imgs.map((img, idx) => (
                              <div
                                key={idx}
                                className="relative aspect-3/4 rounded-xl overflow-hidden border border-[#E8DFD5] group bg-white"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.url}
                                  alt={`${colorName} ${idx}`}
                                  className="w-full h-full object-cover"
                                />
                                {idx === 0 && (
                                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-sm bg-[#2B1A13] text-white text-[9px] font-bold">
                                    Cover
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setColorImages((prev) => ({
                                      ...prev,
                                      [colorName]: prev[colorName].filter(
                                        (_, i) => i !== idx
                                      ),
                                    }))
                                  }
                                  className="absolute top-1 right-1 p-1 bg-black/70 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {/* Upload button for this color */}
                            <label className="aspect-3/4 rounded-xl border-2 border-dashed border-[#7B1123]/40 bg-white hover:bg-white/80 flex flex-col items-center justify-center cursor-pointer p-2 text-center transition-colors">
                              <Upload className="w-5 h-5 text-[#7B1123] mb-1" />
                              <span className="text-[10px] font-bold text-[#7B1123]">
                                Upload Photos
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) =>
                                  handleColorImageUpload(colorName, e)
                                }
                                disabled={uploading}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Sizes Available for this Color */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#2B1A13]">
                            Available Sizes for {colorName}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {availableSizes.map((sz) => {
                              const isSelected =
                                activeSizesForColor.includes(sz.name);
                              return (
                                <button
                                  key={sz.id}
                                  type="button"
                                  onClick={() =>
                                    toggleColorSize(colorName, sz.name)
                                  }
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                    isSelected
                                      ? "bg-[#7B1123] text-white border-[#7B1123]"
                                      : "bg-white text-[#2B1A13] border-[#E8DFD5] hover:border-[#7B1123]"
                                  }`}
                                >
                                  {sz.name} {isSelected && "✓"}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Stock Input per Size for this Color */}
                        {activeSizesForColor.length > 0 && (
                          <div className="bg-white p-3.5 rounded-xl border border-[#E8DFD5] space-y-2">
                            <span className="text-[11px] font-bold text-[#2B1A13] block">
                              Stock per Size for {colorName}:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                              {activeSizesForColor.map((sz) => {
                                const key = `${colorName}_${sz}`;
                                return (
                                  <div
                                    key={key}
                                    className="bg-[#FAF7F2] p-2 rounded-lg border border-[#E8DFD5]"
                                  >
                                    <label className="block text-[10px] font-bold text-[#2B1A13] mb-0.5">
                                      {colorName} — {sz}
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      value={colorVariantStock[key] ?? ""}
                                      placeholder="Enter quantity"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setColorVariantStock((prev) => ({
                                          ...prev,
                                          [key]:
                                            val === ""
                                              ? ""
                                              : Math.max(
                                                  0,
                                                  parseInt(val, 10) || 0
                                                ),
                                        }));
                                      }}
                                      className="w-full px-2 py-1 text-xs font-bold text-[#7B1123] border border-[#E8DFD5] rounded-md bg-white focus:outline-hidden focus:border-[#7B1123]"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 4. BADGES & VISIBILITY */}
          <div className="space-y-3 pt-2 border-t border-[#EFE8DE]">
            <h4 className="text-xs font-bold text-[#2B1A13] uppercase tracking-wider">
              Status & Storefront Badges
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DFD5]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#7B1123] rounded-sm focus:ring-[#7B1123]"
                />
                <span className="text-xs font-semibold text-[#2B1A13]">
                  Active & Visible
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="w-4 h-4 text-[#7B1123] rounded-sm focus:ring-[#7B1123]"
                />
                <span className="text-xs font-semibold text-[#2B1A13]">
                  New Arrival
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-[#7B1123] rounded-sm focus:ring-[#7B1123]"
                />
                <span className="text-xs font-semibold text-[#2B1A13]">
                  Featured Product
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(e) => setIsBestSeller(e.target.checked)}
                  className="w-4 h-4 text-[#7B1123] rounded-sm focus:ring-[#7B1123]"
                />
                <span className="text-xs font-semibold text-[#2B1A13]">
                  Best Seller
                </span>
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-[#EFE8DE] flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-[#7B1123]">
              Calculated Total Stock: {calculateTotalStock()} units
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E8DFD5] text-[#7A6F68] text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-2.5 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : initialData
                  ? "Update Product"
                  : "Create Product"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

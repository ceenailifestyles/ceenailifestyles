import { z } from "zod";

export const customerRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
});

export const customerLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    otp: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Please enter a valid 6-digit OTP"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required"),
  sku: z.string().optional().nullable(),
  description: z.string().min(5, "Description is required"),
  shortDescription: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  subcategoryId: z.string().optional().nullable(),
  productType: z.enum(["NORMAL", "COLOR_WISE"]).default("NORMAL"),
  sellingPrice: z.number().positive("Selling price must be positive"),
  originalPrice: z.number().positive("Original price must be positive"),
  discount: z.number().int().min(0).max(100).default(0),
  mainImage: z.string().url("Valid image URL required"),
  mainImageId: z.string().optional().nullable(),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  specifications: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .default([]),
  stock: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(true),
  isOffer: z.boolean().default(false),
  isActive: z.boolean().default(true),
  galleryImages: z.array(z.object({
    url: z.string().url(),
    publicId: z.string().optional().nullable(),
    colorName: z.string().optional().nullable(),
  })).optional(),
  variants: z.array(z.object({
    size: z.string(),
    stock: z.number().int().min(0),
    colorName: z.string().optional().nullable(),
    colorHex: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
  })).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Category name is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  publicId: z.string().optional().nullable(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  parentId: z.string().optional().nullable(),
});

export const bannerSchema = z.object({
  title: z.string().min(2, "Title is required"),
  subtitle: z.string().optional().nullable(),
  desktopImage: z.string().url("Desktop image URL is required"),
  desktopPublicId: z.string().optional().nullable(),
  mobileImage: z.string().optional().nullable(),
  mobilePublicId: z.string().optional().nullable(),
  ctaText: z.string().default("Shop Now"),
  ctaLink: z.string().default("/products"),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const collectionSchema = z.object({
  title: z.string().min(2, "Collection title is required"),
  slug: z.string().min(2, "Slug is required"),
  description: z.string().optional().nullable(),
  bannerImage: z.string().optional().nullable(),
  bannerPublicId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
  productIds: z.array(z.string()).default([]),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  addressLine: z.string().min(5, "Address line is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(5, "Postal code is required"),
  paymentMethod: z.enum(["COD", "ONLINE"]).default("COD"),
  notes: z.string().optional(),
});

export function getZodErrorMessage(error: any): string {
  if (error?.issues && Array.isArray(error.issues) && error.issues[0]?.message) {
    return error.issues[0].message;
  }
  if (error?.errors && Array.isArray(error.errors) && error.errors[0]?.message) {
    return error.errors[0].message;
  }
  return "Validation failed";
}


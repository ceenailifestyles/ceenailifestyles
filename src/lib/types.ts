export const Role = {
  CUSTOMER: "CUSTOMER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OrderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  role: Role;
  addresses: any | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    orders: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  publicId: string | null;
  displayOrder: number;
  isActive: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: Category | null;
  children?: Category[];
  _count?: {
    products?: number;
    subProducts?: number;
    children?: number;
  };
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  publicId: string | null;
  colorName: string | null;
  displayOrder: number;
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  colorName: string | null;
  colorHex: string | null;
  size: string;
  stock: number;
  sku: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string;
  shortDescription: string | null;
  categoryId: string;
  subcategoryId: string | null;
  sellingPrice: number;
  originalPrice: number;
  discount: number;
  productType: string;
  mainImage: string;
  mainImageId: string | null;
  sizes: any | null;
  colors: any | null;
  specifications: any | null;
  stock: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isOffer: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  category?: Category | { name: string; slug: string } | null;
  subcategory?: Category | { name: string; slug: string } | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  collectionItems?: CollectionProduct[];
}

export interface Color {
  id: string;
  name: string;
  hex: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Size {
  id: string;
  name: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  bannerImage: string | null;
  bannerPublicId: string | null;
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  products?: (CollectionProduct & { product?: Product })[];
}

export interface CollectionProduct {
  id: string;
  collectionId: string;
  productId: string;
  displayOrder: number;
  product?: Product;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  desktopImage: string;
  desktopPublicId: string | null;
  mobileImage: string | null;
  mobilePublicId: string | null;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: any;
  items: any;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User | null;
}

export interface Cart {
  id: string;
  userId: string | null;
  sessionId: string | null;
  items: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
  product?: Product;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: any;
  updatedAt: Date;
}

export interface PasswordReset {
  id: string;
  email: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}


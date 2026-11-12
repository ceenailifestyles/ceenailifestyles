"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
  maxStock?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
}

interface StoreContextType {
  // Auth state
  user: UserProfile | null;
  isLoadingUser: boolean;
  isAuthModalOpen: boolean;
  authModalTab: "login" | "register" | "forgot";
  openAuthModal: (tab?: "login" | "register" | "forgot") => void;
  closeAuthModal: () => void;
  setUser: (user: UserProfile | null) => void;
  logout: () => Promise<void>;

  // Cart state
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (itemId: string) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;

  // Wishlist state
  wishlist: string[]; // product IDs
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register" | "forgot">("login");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("ceenai_cart");
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedWishlist = localStorage.getItem("ceenai_wishlist");
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (e) {
      console.error("Failed to load store data from localStorage", e);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("ceenai_cart", JSON.stringify(cart));
  }, [cart]);

  // Save wishlist to localStorage
  useEffect(() => {
    localStorage.setItem("ceenai_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // Check current customer auth session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const openAuthModal = (tab: "login" | "register" | "forgot" = "login") => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.reload();
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  const addToCart = (item: Omit<CartItem, "id">) => {
    // Prevent out-of-stock products or 0-quantity items from entering cart
    if (item.maxStock !== undefined && item.maxStock <= 0) {
      return;
    }
    if (item.quantity <= 0) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.size === item.size && i.color === item.color
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const effectiveMax = item.maxStock ?? existing.maxStock;
        let newQty = existing.quantity + item.quantity;
        if (effectiveMax !== undefined && newQty > effectiveMax) {
          newQty = Math.max(1, effectiveMax);
        }
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          maxStock: effectiveMax,
        };
        return updated;
      }
      const effectiveMax = item.maxStock;
      const initialQty = effectiveMax !== undefined && item.quantity > effectiveMax ? effectiveMax : item.quantity;
      if (initialQty <= 0) return prev;

      const newItem: CartItem = {
        ...item,
        quantity: initialQty,
        id: `${item.productId}-${item.size || "default"}-${item.color || "default"}-${Date.now()}`,
      };
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const max = i.maxStock;
          const cappedQty = max !== undefined && quantity > max ? max : quantity;
          return { ...i, quantity: cappedQty };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (!exists) {
        setIsWishlistOpen(true);
      }
      return exists ? prev.filter((id) => id !== productId) : [...prev, productId];
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);
  const wishlistCount = wishlist.length;

  return (
    <StoreContext.Provider
      value={{
        user,
        isLoadingUser,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        setUser,
        logout,
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartTotal,
        wishlist,
        isWishlistOpen,
        setIsWishlistOpen,
        toggleWishlist,
        isInWishlist,
        wishlistCount,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}


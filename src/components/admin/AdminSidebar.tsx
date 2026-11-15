"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Split,
  Palette,
  Ruler,
  Layers,
  Image,
  Users,
  ShoppingBag,
  FileText,
  Settings,
  LogOut,
  LogIn,
  ExternalLink,
} from "lucide-react";

import Logo from "@/components/common/Logo";

interface AdminSidebarProps {
  session?: any;
  onNavClick?: () => void;
}

export default function AdminSidebar({ session, onNavClick }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error("Admin logout error", e);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Subcategories", href: "/admin/subcategories", icon: Split },
    { label: "Colors", href: "/admin/colors", icon: Palette },
    { label: "Sizes", href: "/admin/sizes", icon: Ruler },
    { label: "Hero Banners", href: "/admin/banners", icon: Image },
    { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Website Content", href: "/admin/content", icon: FileText, badge: "CMS" },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#24150F] text-[#F7E7CE] flex flex-col h-screen fixed top-0 left-0 shrink-0 border-r border-white/5 select-none z-40">
      {/* Brand Header with real logo centered, same height as top header */}
      <div className="h-16 px-5 border-b border-white/10 flex items-center justify-center">
        <Logo variant="light" />
      </div>

      {/* Nav list */}
      <nav className="flex-1 overflow-y-auto p-3.5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavClick?.()}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#7B1123] text-white shadow-xs"
                  : "text-[#F7E7CE]/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#C59A47]/20 text-[#C59A47] border border-[#C59A47]/30 font-bold uppercase">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Auth Info */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        {session ? (
          <div className="space-y-2">
            <div className="text-[11px] text-white/80 truncate">
              <span className="block font-semibold text-white truncate">{session.name}</span>
              <span className="text-[10px] text-white/50">{session.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-white/5 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/admin/login"
            onClick={() => onNavClick?.()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-[#7B1123] text-white hover:bg-[#630c1b] transition-all cursor-pointer shadow-xs"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In as Admin</span>
          </Link>
        )}
      </div>
    </aside>
  );
}


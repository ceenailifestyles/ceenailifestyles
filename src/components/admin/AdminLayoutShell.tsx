"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "./AdminSidebar";
import { Menu, X, ShieldAlert, LogIn, ExternalLink } from "lucide-react";

export default function AdminLayoutShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If on login page, render full screen without sidebar/header
  if (pathname === "/admin/login") {
    return <div className="min-h-screen w-full bg-[#2B1A13]">{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-[#FAF7F2]">
      {/* Desktop Sidebar (Fixed on large screens) */}
      <div className="hidden lg:block w-64 shrink-0">
        <AdminSidebar session={session} />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar
          session={session}
          onNavClick={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header - fixed on top with h-16 height */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-[#EFE8DE] px-4 sm:px-8 flex items-center justify-between z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[#2B1A13] hover:text-[#7B1123] rounded-lg transition-colors cursor-pointer"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="text-xs text-[#7A6F68]">
              {session && (
                <>
                  Welcome back, <strong className="text-[#2B1A13]">{session.name}</strong>{" "}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7B1123]/10 text-[#7B1123]">
                    {session.role}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected MySQL
            </span>
          </div>
        </header>

        {/* Page Content with top padding matching fixed h-16 header without shorthand collisions */}
        <main className="pt-20 sm:pt-24 px-4 sm:px-8 pb-8 flex-1">{children}</main>
      </div>
    </div>
  );
}

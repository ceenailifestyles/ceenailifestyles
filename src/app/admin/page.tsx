import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Package,
  FolderTree,
  Users,
  ShoppingBag,
  TrendingUp,
  Plus,
  ArrowRight,
  ExternalLink,
  FileText,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    totalProducts,
    totalCategories,
    totalCustomers,
    totalOrders,
    recentOrders,
    recentProducts,
    revenueData,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count({ where: { parentId: null } }),
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.order.count(),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    }),
  ]);

  const totalRevenue = revenueData._sum.total || 0;

  const statCards = [
    {
      label: "Total Revenue",
      value: formatINR(totalRevenue),
      icon: TrendingUp,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Total Orders",
      value: totalOrders,
      icon: ShoppingBag,
      color: "text-[#7B1123] bg-red-50 border-red-200",
    },
    {
      label: "Active Products",
      value: totalProducts,
      icon: Package,
      color: "text-amber-800 bg-amber-50 border-amber-200",
    },
    {
      label: "Registered Customers",
      value: totalCustomers,
      icon: Users,
      color: "text-blue-800 bg-blue-50 border-blue-200",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B1A13]">
            Executive Dashboard
          </h1>
          <p className="text-xs text-[#7A6F68] mt-1">
            Real-time catalog metrics and store performance from MySQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#7B1123] text-white text-xs font-semibold rounded-lg hover:bg-[#630c1b] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            href="/admin/categories"
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#2B1A13] border border-[#E8DFD5] text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] transition-colors"
          >
            <FolderTree className="w-4 h-4" />
            <span>Manage Categories</span>
          </Link>
          <Link
            href="/admin/content"
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#2B1A13] border border-[#E8DFD5] text-xs font-semibold rounded-lg hover:border-[#7B1123] transition-colors"
          >
            <FileText className="w-4 h-4 text-[#7B1123]" />
            <span>Website Content</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#EFE8DE] p-5 shadow-xs flex items-center justify-between"
            >
              <div>
                <span className="text-xs text-[#7A6F68] font-medium block mb-1">
                  {stat.label}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-[#2B1A13]">
                  {stat.value}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Website Content CMS Quick Banner */}
      <div className="bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-[#7B1123]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2B1A13]">Website Content CMS</h3>
            <p className="text-xs text-[#7A6F68] mt-0.5">
              Customize Shopping Benefits, Brand Story & Pillars directly in MySQL.
            </p>
          </div>
        </div>
        <Link
          href="/admin/content"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#7B1123] hover:bg-[#630c1b] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs shrink-0"
        >
          <span>Manage Content</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Two Column Section: Recent Orders & Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Orders (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
            <div>
              <h2 className="text-sm font-bold text-[#2B1A13]">Recent Customer Orders</h2>
              <span className="text-xs text-[#7A6F68]">Latest transactions from storefront</span>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#7B1123] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-[#7A6F68] py-8 text-center">No orders placed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EFE8DE] text-[#7A6F68]">
                    <th className="pb-3 font-semibold">Order</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE8DE]/60">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#FAF7F2]/60">
                      <td className="py-3 font-semibold text-[#2B1A13]">#{ord.orderNumber}</td>
                      <td className="py-3">
                        <span className="font-medium text-[#2B1A13] block">{ord.customerName}</span>
                        <span className="text-[10px] text-[#7A6F68]">{ord.customerEmail}</span>
                      </td>
                      <td className="py-3 font-bold text-[#7B1123]">{formatINR(ord.total)}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.status === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.status === "CONFIRMED"
                              ? "bg-blue-100 text-blue-800"
                              : ord.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Products (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EFE8DE] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFE8DE]">
            <div>
              <h2 className="text-sm font-bold text-[#2B1A13]">Catalog Products</h2>
              <span className="text-xs text-[#7A6F68]">Recently updated items</span>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[#7B1123] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.mainImage}
                  alt={p.name}
                  className="w-11 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                />
                <div className="flex-1 truncate">
                  <h4 className="font-semibold text-[#2B1A13] truncate">{p.name}</h4>
                  <span className="text-[11px] text-[#7A6F68]">{p.category?.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-[#7B1123]">{formatINR(p.sellingPrice)}</span>
                    <span className="text-[10px] text-[#7A6F68]">• Stock: {p.stock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

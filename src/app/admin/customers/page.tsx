import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { findUsers } from "@/lib/repositories/user";
import { Role } from "@/lib/types";
import { Users, Mail, Phone, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const customers = await findUsers({
    where: { role: Role.CUSTOMER },
    orderBy: { createdAt: "desc" },
    includeOrderCount: true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">Registered Customers</h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          View all registered customer accounts and their order engagement.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#EFE8DE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EFE8DE] text-[#7A6F68]">
              <tr>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Orders Placed</th>
                <th className="py-3 px-4 font-semibold">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE8DE]/60">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#7A6F68]">
                    No registered customers yet.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF7F2]/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#7B1123] text-white font-bold flex items-center justify-center text-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-[#2B1A13]">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#7A6F68]">{c.email}</td>
                    <td className="py-3 px-4 text-[#7A6F68]">{c.phone || "—"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF7F2] border border-[#E8DFD5] text-[#7B1123]">
                        {c._count?.orders || 0} {c._count?.orders === 1 ? "order" : "orders"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#7A6F68]">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

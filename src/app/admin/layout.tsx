import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  // The /admin/login page itself must stay accessible without redirect loop
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminLayoutShell session={session}>
      {children}
    </AdminLayoutShell>
  );
}

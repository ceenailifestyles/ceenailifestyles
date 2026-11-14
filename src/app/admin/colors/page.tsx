import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { findColors } from "@/lib/repositories/color";
import ColorsClient from "./ColorsClient";

export const dynamic = "force-dynamic";

export default async function AdminColorsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const colors = await findColors({
    name: "asc",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">Colors Management</h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          Manage product color swatches and HEX codes. Colors created here are automatically available in the Add Product form.
        </p>
      </div>

      <ColorsClient initialColors={colors} />
    </div>
  );
}


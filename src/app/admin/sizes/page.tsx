import React from "react";
import { findSizes } from "@/lib/repositories/size";
import SizesClient from "./SizesClient";

export const dynamic = "force-dynamic";

export default async function AdminSizesPage() {
  const sizes = await findSizes({
    displayOrder: "asc",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">Sizes Management</h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          Manage product sizing options and order (XS, S, M, L, XL, XXL, etc.). Sizes created here are automatically available in the Add Product form.
        </p>
      </div>

      <SizesClient initialSizes={sizes} />
    </div>
  );
}


import React from "react";
import prisma from "@/lib/prisma";
import BannersClient from "./BannersClient";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">Hero Banners</h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          Manage desktop and mobile carousel hero slides displayed on the customer storefront.
        </p>
      </div>

      <BannersClient initialBanners={banners} />
    </div>
  );
}

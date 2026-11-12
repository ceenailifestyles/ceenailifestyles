import React from "react";
import prisma from "@/lib/prisma";
import ContentClient from "./ContentClient";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: { in: ["benefits", "about_ceenai"] },
    },
  });

  const contentMap: Record<string, any> = {};
  for (const s of settings) {
    contentMap[s.key] = s.value;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">Website Content CMS</h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          Manage shopping benefits, brand story & pillars.
        </p>
      </div>

      <ContentClient initialContent={contentMap} />
    </div>
  );
}

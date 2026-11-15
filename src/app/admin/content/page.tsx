import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { findSiteSettings } from "@/lib/repositories/siteSetting";
import ContentClient from "./ContentClient";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const settings = await findSiteSettings({
    key: { in: ["benefits", "about_ceenai"] },
  });

  const contentMap: Record<string, any> = {};
  for (const s of settings) {
    contentMap[s.key] = s.value;
  }

  return (
    <div className="w-full">
      <ContentClient initialContent={contentMap} />
    </div>
  );
}

import React from "react";
import { findSiteSettings } from "@/lib/repositories/siteSetting";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await findSiteSettings({
    key: { in: ["announcement_bar", "footer_settings"] },
  });

  const settingsMap: Record<string, any> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#2B1A13]">Website Settings</h1>
        <p className="text-xs text-[#7A6F68] mt-0.5">
          Configure physical store address, contact lines, announcement messages, and social links.
        </p>
      </div>

      <SettingsClient initialSettings={settingsMap} />
    </div>
  );
}

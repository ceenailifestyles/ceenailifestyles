import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { findSiteSettings, upsertSiteSetting } from "@/lib/repositories/siteSetting";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await findSiteSettings({
      key: {
        in: ["benefits", "about_ceenai", "testimonials", "announcement_bar", "footer_settings"],
      },
    });

    const config: Record<string, any> = {};
    for (const item of settings) {
      config[item.key] = item.value;
    }

    return NextResponse.json({ content: config });
  } catch (error) {
    console.error("Admin content GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }

    const updated = await upsertSiteSetting(key, value);

    revalidatePath("/");
    revalidatePath("/products");
    revalidateTag("settings", "max");
    revalidateTag("storefront", "max");

    return NextResponse.json({ success: true, setting: updated });
  } catch (error) {
    console.error("Admin content PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


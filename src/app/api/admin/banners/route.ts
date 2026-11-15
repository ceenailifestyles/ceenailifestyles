import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { findBanners, createBanner } from "@/lib/repositories/banner";
import { getAdminSession } from "@/lib/auth";
import { bannerSchema, getZodErrorMessage } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const banners = await findBanners(undefined, { displayOrder: "asc" });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Admin banners GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = bannerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const data = validated.data;
    const banner = await createBanner({
      title: data.title,
      subtitle: data.subtitle || null,
      desktopImage: data.desktopImage,
      desktopPublicId: data.desktopPublicId || null,
      mobileImage: data.mobileImage || null,
      mobilePublicId: data.mobilePublicId || null,
      ctaText: data.ctaText,
      ctaLink: data.ctaLink,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    });

    revalidatePath("/");
    revalidatePath("/products");

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Admin banner POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

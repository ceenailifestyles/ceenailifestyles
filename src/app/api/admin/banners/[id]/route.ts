import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { findBannerById, updateBanner, deleteBanner } from "@/lib/repositories/banner";
import { getAdminSession } from "@/lib/auth";
import { bannerSchema, getZodErrorMessage } from "@/lib/validations";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = bannerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated.error) },
        { status: 400 }
      );
    }

    const data = validated.data;
    const existing = await findBannerById(id);
    if (!existing) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    const updated = await updateBanner(id, {
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

    if (existing.desktopPublicId && existing.desktopPublicId !== (data.desktopPublicId || null)) {
      deleteFromCloudinary(existing.desktopPublicId).catch((err) => {
        console.error("Failed to delete replaced desktop banner asset:", err);
      });
    }
    if (existing.mobilePublicId && existing.mobilePublicId !== (data.mobilePublicId || null)) {
      deleteFromCloudinary(existing.mobilePublicId).catch((err) => {
        console.error("Failed to delete replaced mobile banner asset:", err);
      });
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidateTag("banners", "max");
    revalidateTag("storefront", "max");

    return NextResponse.json({ success: true, banner: updated });
  } catch (error) {
    console.error("Admin banner PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const banner = await findBannerById(id);
    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    await deleteBanner(id);

    if (banner.desktopPublicId) {
      deleteFromCloudinary(banner.desktopPublicId).catch((err) => {
        console.error("Failed to delete desktop banner asset on delete:", err);
      });
    }
    if (banner.mobilePublicId) {
      deleteFromCloudinary(banner.mobilePublicId).catch((err) => {
        console.error("Failed to delete mobile banner asset on delete:", err);
      });
    }

    revalidatePath("/");
    revalidatePath("/products");
    revalidateTag("banners", "max");
    revalidateTag("storefront", "max");

    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    console.error("Admin banner DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

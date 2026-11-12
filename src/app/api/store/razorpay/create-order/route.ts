import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, customer } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate subtotal securely from DB & validate live stock
    let subtotal = 0;
    for (const item of items) {
      const dbProduct = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!dbProduct || !dbProduct.isActive) {
        return NextResponse.json(
          { error: `Product "${item.name}" is no longer available.` },
          { status: 400 }
        );
      }

      // Check variant stock if size/color specified, otherwise fallback to product stock
      let effectiveStock = dbProduct.stock;

      if (Array.isArray(dbProduct.variants) && dbProduct.variants.length > 0) {
        const matched = dbProduct.variants.find((v) => {
          const matchSize = item.size
            ? v.size.trim().toLowerCase() === item.size.trim().toLowerCase()
            : true;
          const matchColor = item.color && v.colorName
            ? v.colorName.trim().toLowerCase() === item.color.trim().toLowerCase()
            : true;
          return matchSize && matchColor;
        });

        if (matched) {
          effectiveStock = matched.stock;
        } else {
          effectiveStock = dbProduct.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
        }
      }

      if (effectiveStock <= 0) {
        const variantDesc = [item.color, item.size].filter(Boolean).join(" - ");
        return NextResponse.json(
          {
            error: `"${dbProduct.name}"${variantDesc ? ` (${variantDesc})` : ""} is currently out of stock and cannot be purchased.`,
          },
          { status: 400 }
        );
      }

      if (effectiveStock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${dbProduct.name}". Only ${effectiveStock} item(s) left in stock.`,
          },
          { status: 400 }
        );
      }

      subtotal += dbProduct.sellingPrice * item.quantity;
    }

    const shippingFee = subtotal >= 999 ? 0 : 99;
    const totalAmount = subtotal + shippingFee;

    // Amount in paisa for Razorpay (multiply INR by 100)
    const amountInPaisa = Math.round(totalAmount * 100);

    const razorpay = getRazorpayClient();
    const receipt = `rcpt_${Date.now().toString().slice(-8)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaisa,
      currency: "INR",
      receipt,
      notes: {
        customerEmail: customer?.customerEmail || "",
        customerPhone: customer?.customerPhone || "",
      },
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    const errorMessage =
      error?.error?.description ||
      error?.description ||
      error?.message ||
      "Failed to initialize Razorpay payment.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


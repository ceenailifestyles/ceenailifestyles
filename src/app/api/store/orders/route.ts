import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/auth";
import { checkoutSchema, getZodErrorMessage } from "@/lib/validations";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getCustomerSession();
    const body = await req.json();

    const { customer, items, razorpayPayment } = body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const validatedCustomer = checkoutSchema.safeParse(customer);
    if (!validatedCustomer.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validatedCustomer.error) },
        { status: 400 }
      );
    }

    const cust = validatedCustomer.data;

    // Verify online payment authenticity via Razorpay HMAC signature
    if (cust.paymentMethod === "ONLINE") {
      if (
        !razorpayPayment ||
        !razorpayPayment.razorpay_order_id ||
        !razorpayPayment.razorpay_payment_id ||
        !razorpayPayment.razorpay_signature
      ) {
        return NextResponse.json(
          { error: "Payment verification details are missing." },
          { status: 400 }
        );
      }

      const isValidSignature = verifyRazorpaySignature({
        orderId: razorpayPayment.razorpay_order_id,
        paymentId: razorpayPayment.razorpay_payment_id,
        signature: razorpayPayment.razorpay_signature,
      });

      if (!isValidSignature) {
        return NextResponse.json(
          { error: "Payment verification failed. Invalid transaction signature." },
          { status: 400 }
        );
      }
    }

    // Calculate subtotal from real database prices to prevent tampering & validate live stock
    let subtotal = 0;
    const durableItems: any[] = [];

    for (const cartItem of items) {
      const dbProduct = await prisma.product.findUnique({
        where: { id: cartItem.productId },
        include: { variants: true },
      });

      if (!dbProduct || !dbProduct.isActive) {
        return NextResponse.json(
          { error: `Product "${cartItem.name}" is no longer available.` },
          { status: 400 }
        );
      }

      // Check variant stock if applicable, otherwise fallback to product stock
      let matchedVariantId: string | null = null;
      let effectiveStock = dbProduct.stock;

      if (Array.isArray(dbProduct.variants) && dbProduct.variants.length > 0) {
        const matched = dbProduct.variants.find((v) => {
          const matchSize = cartItem.size
            ? v.size.trim().toLowerCase() === cartItem.size.trim().toLowerCase()
            : true;
          const matchColor = cartItem.color && v.colorName
            ? v.colorName.trim().toLowerCase() === cartItem.color.trim().toLowerCase()
            : true;
          return matchSize && matchColor;
        });

        if (matched) {
          effectiveStock = matched.stock;
          matchedVariantId = matched.id;
        } else {
          // Total stock across all variants
          effectiveStock = dbProduct.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
        }
      }

      // Strict out-of-stock check
      if (effectiveStock <= 0) {
        const variantDesc = [cartItem.color, cartItem.size].filter(Boolean).join(" - ");
        return NextResponse.json(
          {
            error: `"${dbProduct.name}"${variantDesc ? ` (${variantDesc})` : ""} is currently out of stock and cannot be purchased.`,
          },
          { status: 400 }
        );
      }

      // Quantity availability check
      if (effectiveStock < cartItem.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${dbProduct.name}". Only ${effectiveStock} item(s) available in stock.`,
          },
          { status: 400 }
        );
      }

      const itemTotal = dbProduct.sellingPrice * cartItem.quantity;
      subtotal += itemTotal;

      durableItems.push({
        productId: dbProduct.id,
        variantId: matchedVariantId,
        name: dbProduct.name,
        slug: dbProduct.slug,
        sku: dbProduct.sku,
        image: cartItem.image || dbProduct.mainImage,
        price: dbProduct.sellingPrice,
        originalPrice: dbProduct.originalPrice,
        size: cartItem.size || null,
        color: cartItem.color || null,
        quantity: cartItem.quantity,
        total: itemTotal,
      });
    }

    const shippingFee = subtotal >= 999 ? 0 : 99;
    const total = subtotal + shippingFee;

    const orderNumber = `CEE-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock for product and specific variant
      for (const itm of durableItems) {
        await tx.product.update({
          where: { id: itm.productId },
          data: { stock: { decrement: itm.quantity } },
        });

        if (itm.variantId) {
          await tx.productVariant.update({
            where: { id: itm.variantId },
            data: { stock: { decrement: itm.quantity } },
          });
        }
      }

      // 2. Create Order
      return tx.order.create({
        data: {
          orderNumber,
          userId: session?.userId || null,
          customerName: cust.customerName,
          customerEmail: cust.customerEmail,
          customerPhone: cust.customerPhone,
          shippingAddress: {
            addressLine: cust.addressLine,
            city: cust.city,
            state: cust.state,
            postalCode: cust.postalCode,
          },
          items: durableItems,
          subtotal,
          shippingFee,
          total,
          status: "CONFIRMED",
          paymentStatus: cust.paymentMethod === "ONLINE" ? "PAID" : "PENDING",
          paymentMethod: cust.paymentMethod,
          notes: cust.notes || null,
        },
      });
    });

    await sendOrderConfirmationEmail({
      to: cust.customerEmail,
      customerName: cust.customerName,
      orderNumber: order.orderNumber,
      items: durableItems,
      subtotal,
      shippingFee,
      total,
      paymentMethod: cust.paymentMethod,
      shippingAddress: {
        addressLine: cust.addressLine,
        city: cust.city,
        state: cust.state,
        postalCode: cust.postalCode,
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Customer orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

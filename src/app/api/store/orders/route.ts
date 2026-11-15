import { NextResponse } from "next/server";
import { getPool, generateId } from "@/lib/db";
import { findOrders, findOrderById } from "@/lib/repositories/order";
import { findProductById } from "@/lib/repositories/product";
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
    const paymentId =
      cust.paymentMethod === "ONLINE"
        ? razorpayPayment?.razorpay_payment_id
        : null;

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

      // Check if payment id was already used before proceeding
      const pool = getPool();
      const [existingOrderRows] = await pool.query(
        "SELECT `id` FROM `orders` WHERE `razorpayPaymentId` = ? LIMIT 1",
        [paymentId]
      );
      if (Array.isArray(existingOrderRows) && existingOrderRows.length > 0) {
        return NextResponse.json(
          { error: "Payment ID has already been used for an order." },
          { status: 409 }
        );
      }
    }

    // Calculate subtotal from real database prices to prevent tampering & validate live stock
    let subtotal = 0;
    const durableItems: any[] = [];

    for (const cartItem of items) {
      const dbProduct = await findProductById(cartItem.productId, {
        includeVariants: true,
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
    const now = new Date();
    const orderId = generateId();

    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // Check payment id inside transaction lock to prevent concurrent race condition replay
      if (paymentId) {
        const [existingPaymentRows] = await conn.query(
          "SELECT `id` FROM `orders` WHERE `razorpayPaymentId` = ? FOR UPDATE",
          [paymentId]
        );
        if (Array.isArray(existingPaymentRows) && existingPaymentRows.length > 0) {
          await conn.rollback();
          return NextResponse.json(
            { error: "Payment ID has already been used for an order." },
            { status: 409 }
          );
        }
      }

      // 1. Lock and decrement stock atomically (UPDATE ... SET stock = stock - ? WHERE id = ? AND stock >= ?)
      for (const itm of durableItems) {
        const [prodRes] = await conn.execute(
          "UPDATE `products` SET `stock` = `stock` - ?, `updatedAt` = ? WHERE `id` = ? AND `stock` >= ?",
          [itm.quantity, now, itm.productId, itm.quantity]
        );
        const affectedProd = (prodRes as any).affectedRows;
        if (affectedProd === 0) {
          await conn.rollback();
          return NextResponse.json(
            { error: `Insufficient stock for "${itm.name}".` },
            { status: 400 }
          );
        }

        if (itm.variantId) {
          const [varRes] = await conn.execute(
            "UPDATE `product_variants` SET `stock` = `stock` - ?, `updatedAt` = ? WHERE `id` = ? AND `stock` >= ?",
            [itm.quantity, now, itm.variantId, itm.quantity]
          );
          const affectedVar = (varRes as any).affectedRows;
          if (affectedVar === 0) {
            await conn.rollback();
            return NextResponse.json(
              { error: `Insufficient stock for "${itm.name}" variant.` },
              { status: 400 }
            );
          }
        }
      }

      // 2. Create Order
      await conn.execute(
        `INSERT INTO \`orders\` (
          \`id\`, \`orderNumber\`, \`userId\`, \`customerName\`, \`customerEmail\`,
          \`customerPhone\`, \`shippingAddress\`, \`items\`, \`subtotal\`, \`shippingFee\`,
          \`discount\`, \`total\`, \`status\`, \`paymentStatus\`, \`paymentMethod\`,
          \`razorpayPaymentId\`, \`notes\`, \`createdAt\`, \`updatedAt\`
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          session?.userId || null,
          cust.customerName,
          cust.customerEmail,
          cust.customerPhone,
          JSON.stringify({
            addressLine: cust.addressLine,
            city: cust.city,
            state: cust.state,
            postalCode: cust.postalCode,
          }),
          JSON.stringify(durableItems),
          subtotal,
          shippingFee,
          0,
          total,
          "CONFIRMED",
          cust.paymentMethod === "ONLINE" ? "PAID" : "PENDING",
          cust.paymentMethod,
          paymentId || null,
          cust.notes || null,
          now,
          now,
        ]
      );

      await conn.commit();
    } catch (txError: any) {
      await conn.rollback();
      if (
        txError?.code === "ER_DUP_ENTRY" &&
        (typeof txError?.message === "string" && txError.message.includes("razorpayPaymentId"))
      ) {
        return NextResponse.json(
          { error: "Payment ID has already been used for an order." },
          { status: 409 }
        );
      }
      throw txError;
    } finally {
      conn.release();
    }

    const order = await findOrderById(orderId);

    await sendOrderConfirmationEmail({
      to: cust.customerEmail,
      customerName: cust.customerName,
      orderNumber: order?.orderNumber || orderNumber,
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

    const orders = await findOrders({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Customer orders GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { query, execute, transaction, generateId, toDate, parseJsonField } from "@/lib/db";
import { Order, OrderStatus, PaymentStatus } from "@/lib/types";

function mapOrder(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    shippingAddress: parseJsonField(row.shippingAddress),
    items: parseJsonField(row.items),
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shippingFee || 0),
    discount: Number(row.discount || 0),
    total: Number(row.total),
    status: row.status as OrderStatus,
    paymentStatus: row.paymentStatus as PaymentStatus,
    paymentMethod: row.paymentMethod || "COD",
    notes: row.notes,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

export async function findOrders(options?: {
  where?: {
    userId?: string;
    customerEmail?: string;
    status?: OrderStatus;
  };
  orderBy?: { createdAt?: "asc" | "desc" };
  take?: number;
  skip?: number;
  includeUser?: boolean;
}): Promise<Order[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (options?.where?.userId) {
    conditions.push("`userId` = ?");
    params.push(options.where.userId);
  }
  if (options?.where?.customerEmail) {
    conditions.push("LOWER(`customerEmail`) = LOWER(?)");
    params.push(options.where.customerEmail);
  }
  if (options?.where?.status) {
    conditions.push("`status` = ?");
    params.push(options.where.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const dir = options?.orderBy?.createdAt?.toLowerCase() === "asc" ? "ASC" : "DESC";
  const orderClause = `ORDER BY \`createdAt\` ${dir}`;

  let limitClause = "";
  if (options?.take !== undefined) {
    limitClause = `LIMIT ${Number(options.take)}`;
    if (options?.skip !== undefined) {
      limitClause += ` OFFSET ${Number(options.skip)}`;
    }
  }

  const rows = await query(`SELECT * FROM \`orders\` ${whereClause} ${orderClause} ${limitClause}`, params);
  const orders = rows.map(mapOrder);

  if (options?.includeUser && orders.length > 0) {
    const userIds = Array.from(new Set(orders.map((o) => o.userId).filter(Boolean))) as string[];
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => "?").join(",");
      const userRows = await query(`SELECT * FROM \`users\` WHERE \`id\` IN (${placeholders})`, userIds);
      const userMap = new Map(userRows.map((u: any) => [u.id, u]));
      for (const ord of orders) {
        ord.user = ord.userId ? userMap.get(ord.userId) || null : null;
      }
    }
  }

  return orders;
}

export async function findOrderById(id: string): Promise<Order | null> {
  const rows = await query("SELECT * FROM `orders` WHERE `id` = ? LIMIT 1", [id]);
  return rows.length > 0 ? mapOrder(rows[0]) : null;
}

export async function findOrderByNumber(orderNumber: string): Promise<Order | null> {
  const rows = await query("SELECT * FROM `orders` WHERE `orderNumber` = ? LIMIT 1", [orderNumber]);
  return rows.length > 0 ? mapOrder(rows[0]) : null;
}

export async function countOrders(where?: { status?: OrderStatus }): Promise<number> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (where?.status) {
    conditions.push("`status` = ?");
    params.push(where.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query(`SELECT COUNT(*) as total FROM \`orders\` ${whereClause}`, params);
  return Number(rows[0]?.total || 0);
}

export async function getRevenueSum(): Promise<number> {
  const rows = await query("SELECT COALESCE(SUM(`total`), 0) as totalRevenue FROM `orders`");
  return Number(rows[0]?.totalRevenue || 0);
}

export async function updateOrderStatus(
  id: string,
  data: Partial<{
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    notes: string | null;
  }>
): Promise<Order> {
  const setClauses: string[] = ["`updatedAt` = ?"];
  const params: any[] = [new Date()];

  if (data.status !== undefined) {
    setClauses.push("`status` = ?");
    params.push(data.status);
  }
  if (data.paymentStatus !== undefined) {
    setClauses.push("`paymentStatus` = ?");
    params.push(data.paymentStatus);
  }
  if (data.notes !== undefined) {
    setClauses.push("`notes` = ?");
    params.push(data.notes);
  }

  params.push(id);
  await execute(`UPDATE \`orders\` SET ${setClauses.join(", ")} WHERE \`id\` = ?`, params);
  return (await findOrderById(id))!;
}

export async function createOrderWithStockUpdate(data: {
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: any;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    image?: string;
  }>;
  subtotal: number;
  shippingFee?: number;
  discount?: number;
  total: number;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  status?: OrderStatus;
  notes?: string | null;
}): Promise<Order> {
  return await transaction(async (conn) => {
    const id = generateId();
    const now = new Date();

    // 1. Lock and deduct stock safely for each item
    for (const item of data.items) {
      // Check product exists and lock row
      const [prodRows] = await conn.query("SELECT `id`, `name`, `stock`, `isActive` FROM `products` WHERE `id` = ? FOR UPDATE", [
        item.productId,
      ]);
      const product = (prodRows as any[])[0];

      if (!product || !product.isActive) {
        throw new Error(`Product "${item.name}" is no longer available.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${item.name}". Only ${product.stock} available.`);
      }

      // Check variant stock if size/color specified
      if (item.size || item.color) {
        let variantQuery = "SELECT `id`, `stock` FROM `product_variants` WHERE `productId` = ?";
        const vParams: any[] = [item.productId];

        if (item.size) {
          variantQuery += " AND LOWER(`size`) = LOWER(?)";
          vParams.push(item.size.trim());
        }
        if (item.color) {
          variantQuery += " AND LOWER(`colorName`) = LOWER(?)";
          vParams.push(item.color.trim());
        }
        variantQuery += " FOR UPDATE LIMIT 1";

        const [variantRows] = await conn.query(variantQuery, vParams);
        const variant = (variantRows as any[])[0];

        if (variant) {
          if (variant.stock < item.quantity) {
            throw new Error(`Insufficient stock for "${item.name}" (${item.size || ""}, ${item.color || ""}).`);
          }
          // Atomic decrement variant stock
          await conn.execute("UPDATE `product_variants` SET `stock` = `stock` - ?, `updatedAt` = ? WHERE `id` = ?", [
            item.quantity,
            now,
            variant.id,
          ]);
        }
      }

      // Atomic decrement main product stock
      const [res] = await conn.execute(
        "UPDATE `products` SET `stock` = `stock` - ?, `updatedAt` = ? WHERE `id` = ? AND `stock` >= ?",
        [item.quantity, now, item.productId, item.quantity]
      );
      if ((res as any).affectedRows === 0) {
        throw new Error(`Insufficient stock for "${item.name}".`);
      }
    }

    // 2. Insert order
    await conn.execute(
      `INSERT INTO \`orders\` (
        \`id\`, \`orderNumber\`, \`userId\`, \`customerName\`, \`customerEmail\`, \`customerPhone\`,
        \`shippingAddress\`, \`items\`, \`subtotal\`, \`shippingFee\`, \`discount\`, \`total\`,
        \`status\`, \`paymentStatus\`, \`paymentMethod\`, \`notes\`, \`createdAt\`, \`updatedAt\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.orderNumber,
        data.userId || null,
        data.customerName,
        data.customerEmail,
        data.customerPhone,
        JSON.stringify(data.shippingAddress),
        JSON.stringify(data.items),
        data.subtotal,
        data.shippingFee ?? 0,
        data.discount ?? 0,
        data.total,
        data.status || OrderStatus.PENDING,
        data.paymentStatus || PaymentStatus.PENDING,
        data.paymentMethod || "COD",
        data.notes || null,
        now,
        now,
      ]
    );

    const [rows] = await conn.query("SELECT * FROM `orders` WHERE `id` = ? LIMIT 1", [id]);
    return mapOrder((rows as any[])[0]);
  });
}


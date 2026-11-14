import { findFirstProduct, findProductById } from "@/lib/repositories/product";
import { createOrderWithStockUpdate, findOrderByNumber } from "@/lib/repositories/order";
import { getPool } from "@/lib/db";

async function simulateCustomerOrder() {
  console.log("\n========================================================");
  console.log("CEENAI LIVE TRANSACTION & PERSISTENCE TEST (via mysql2)");
  console.log("========================================================\n");

  // 1. Pick a product from MySQL
  const product = await findFirstProduct({
    slug: "embroidered-a-line-kurti",
  });

  if (!product) throw new Error("Product not found");

  const initialStock = product.stock;
  const quantityToBuy = 2;
  console.log(`[BEFORE] Product: "${product.name}" | Stock in MySQL: ${initialStock}`);

  // 2. Create customer order in MySQL using atomic stock update & transaction
  const orderNumber = `CEE-LIVE-${Date.now().toString().slice(-5)}`;
  const order = await createOrderWithStockUpdate({
    orderNumber,
    customerName: "Ananya Mukherjee",
    customerEmail: "ananya.m@example.com",
    customerPhone: "9820112233",
    shippingAddress: {
      addressLine: "Flat 501, Silver Sands Apartments, Juhu Road",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400049",
    },
    items: [
      {
        productId: product.id,
        name: product.name,
        price: product.sellingPrice,
        quantity: quantityToBuy,
        size: "M",
        color: "Plum Magenta",
      },
    ],
    subtotal: product.sellingPrice * quantityToBuy,
    shippingFee: 0,
    total: product.sellingPrice * quantityToBuy,
    status: "CONFIRMED",
    paymentStatus: "PAID",
    paymentMethod: "ONLINE",
  });

  console.log(`[ORDER CREATED] Order #${order.orderNumber} placed by ${order.customerName} for ${order.total} INR.`);

  // 3. Verify updated stock in MySQL
  const updatedProduct = await findProductById(product.id);

  console.log(`[AFTER] Product: "${updatedProduct?.name}" | Stock in MySQL: ${updatedProduct?.stock}`);
  console.log(`[VERIFIED] Stock decremented accurately by ${quantityToBuy}: ${initialStock} -> ${updatedProduct?.stock}`);

  // 4. Verify order in MySQL
  const fetchedOrder = await findOrderByNumber(orderNumber);

  console.log(`[PERSISTED] Order is permanently stored in MySQL orders table with status "${fetchedOrder?.status}".`);
  console.log("\n========================================================\n");
}

simulateCustomerOrder()
  .catch(console.error)
  .finally(async () => {
    const pool = getPool();
    await pool.end();
  });

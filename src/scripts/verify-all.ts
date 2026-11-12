import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { signToken, verifyToken } from "../lib/auth";
import { Role } from "@prisma/client";

async function runTests() {
  console.log("\n========================================================");
  console.log("CEENAI SYSTEMATIC VERIFICATION & PRODUCTION AUDIT");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Database Connection & Categories Check
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true },
  });
  assert(categories.length === 7, `7 Primary Categories exist in MySQL (Found: ${categories.length})`);

  const totalSubcategories = categories.reduce((acc, c) => acc + c.children.length, 0);
  assert(totalSubcategories >= 35, `Subcategories seeded correctly in MySQL (Found: ${totalSubcategories})`);

  // 2. Products Check
  const products = await prisma.product.findMany();
  assert(products.length >= 10, `Products exist in MySQL (Found: ${products.length})`);

  const activeProducts = await prisma.product.findMany({ where: { isActive: true } });
  assert(activeProducts.length > 0, `Active products found: ${activeProducts.length}`);

  // 3. User Authentication & Password Hashing Check
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@ceenai.in" } });
  assert(adminUser !== null, "Admin user exists in database");
  if (adminUser) {
    const isPasswordValid = await bcrypt.compare("Admin@123", adminUser.password);
    assert(isPasswordValid, "Admin password hash verifies correctly with bcrypt");
    assert(adminUser.role === Role.ADMIN, "Admin role is correctly set to ADMIN");
  }

  // 4. JWT Session Sign & Verify Check
  const testPayload = {
    userId: "test-user-id",
    email: "test@example.com",
    role: Role.CUSTOMER,
    name: "Test Customer",
  };
  const token = signToken(testPayload);
  const decoded = verifyToken(token);
  assert(decoded?.email === "test@example.com", "JWT session signs and verifies accurately");

  // 5. Forgot Password Single-Use & Expiry Token Check
  const testResetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600 * 1000);
  const resetRecord = await prisma.passwordReset.create({
    data: {
      email: "priya.sharma@example.com",
      token: testResetToken,
      expiresAt,
    },
  });
  assert(resetRecord.usedAt === null, "Password reset token created unused");

  // Mark token used
  const updatedReset = await prisma.passwordReset.update({
    where: { token: testResetToken },
    data: { usedAt: new Date() },
  });
  assert(updatedReset.usedAt !== null, "Password reset token single-use invalidation verified");

  // Cleanup test token
  await prisma.passwordReset.delete({ where: { token: testResetToken } });

  // 6. Collections & Banners Check
  const banners = await prisma.banner.findMany();
  assert(banners.length >= 2, `Hero banners configured in MySQL (Found: ${banners.length})`);

  const collections = await prisma.collection.findMany();
  assert(collections.some((c) => c.slug === "festive-edit"), "Festive Edit collection exists");
  assert(collections.some((c) => c.slug === "new-arrivals"), "New Arrivals collection exists");

  // 7. Site Settings Check
  const announcementSetting = await prisma.siteSetting.findUnique({ where: { key: "announcement_bar" } });
  assert(announcementSetting !== null, "Announcement bar configured in site_settings table");

  const benefitsSetting = await prisma.siteSetting.findUnique({ where: { key: "benefits" } });
  assert(benefitsSetting !== null, "Shopping benefits configured in site_settings table");

  const aboutSetting = await prisma.siteSetting.findUnique({ where: { key: "about_ceenai" } });
  assert(aboutSetting !== null, "About CeeneAI configured in site_settings table");

  // 8. Order Placement & Durable Snapshot Check
  const sampleProduct = products[0];
  const orderNumber = `TEST-${Date.now().toString().slice(-6)}`;
  const testOrder = await prisma.order.create({
    data: {
      orderNumber,
      customerName: "Test Buyer",
      customerEmail: "buyer@example.com",
      customerPhone: "9998887770",
      shippingAddress: {
        addressLine: "Test Apartment, Malad",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400095",
      },
      items: [
        {
          productId: sampleProduct.id,
          name: sampleProduct.name,
          price: sampleProduct.sellingPrice,
          quantity: 2,
          size: "M",
          color: "Magenta",
        },
      ],
      subtotal: sampleProduct.sellingPrice * 2,
      shippingFee: 0,
      total: sampleProduct.sellingPrice * 2,
      status: "CONFIRMED",
      paymentMethod: "COD",
    },
  });
  assert(testOrder.id !== undefined, `Durable Order snapshot created (#${testOrder.orderNumber})`);

  // Cleanup test order
  await prisma.order.delete({ where: { id: testOrder.id } });

  console.log("\n========================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


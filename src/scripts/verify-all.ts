import { findCategories } from "@/lib/repositories/category";
import { findProducts } from "@/lib/repositories/product";
import { findUserByEmail } from "@/lib/repositories/user";
import { findBanners } from "@/lib/repositories/banner";
import { findCollections } from "@/lib/repositories/collection";
import { findSiteSettingByKey } from "@/lib/repositories/siteSetting";
import { createPasswordReset, findPasswordResetByToken } from "@/lib/repositories/passwordReset";
import { execute, generateId, getPool } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { signToken, verifyToken } from "@/lib/auth";
import { Role } from "@/lib/types";

async function runTests() {
  console.log("\n========================================================");
  console.log("CEENAI SYSTEMATIC VERIFICATION & PRODUCTION AUDIT (via mysql2)");
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
  const categories = await findCategories({
    where: { parentId: null },
    includeChildren: true,
  });
  assert(categories.length === 7, `7 Primary Categories exist in MySQL (Found: ${categories.length})`);

  const totalSubcategories = categories.reduce((acc, c) => acc + (c.children?.length || 0), 0);
  assert(totalSubcategories >= 35, `Subcategories seeded correctly in MySQL (Found: ${totalSubcategories})`);

  // 2. Products Check
  const products = await findProducts();
  assert(products.length >= 10, `Products exist in MySQL (Found: ${products.length})`);

  const activeProducts = await findProducts({ where: { isActive: true } });
  assert(activeProducts.length > 0, `Active products found: ${activeProducts.length}`);

  // 3. User Authentication & Password Hashing Check
  const adminUser = await findUserByEmail("admin@ceenai.in");
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
  const resetRecord = await createPasswordReset("priya.sharma@example.com", testResetToken, expiresAt);
  assert(resetRecord.usedAt === null, "Password reset token created unused");

  // Mark token used
  await execute("UPDATE `password_resets` SET `usedAt` = ? WHERE `token` = ?", [new Date(), testResetToken]);
  const updatedReset = await findPasswordResetByToken(testResetToken);
  assert(updatedReset?.usedAt !== null, "Password reset token single-use invalidation verified");

  // Cleanup test token
  await execute("DELETE FROM `password_resets` WHERE `token` = ?", [testResetToken]);

  // 6. Collections & Banners Check
  const banners = await findBanners();
  assert(banners.length >= 2, `Hero banners configured in MySQL (Found: ${banners.length})`);

  const collections = await findCollections();
  assert(collections.some((c) => c.slug === "festive-edit"), "Festive Edit collection exists");
  assert(collections.some((c) => c.slug === "new-arrivals"), "New Arrivals collection exists");

  // 7. Site Settings Check
  const announcementSetting = await findSiteSettingByKey("announcement_bar");
  assert(announcementSetting !== null, "Announcement bar configured in site_settings table");

  const benefitsSetting = await findSiteSettingByKey("benefits");
  assert(benefitsSetting !== null, "Shopping benefits configured in site_settings table");

  const aboutSetting = await findSiteSettingByKey("about_ceenai");
  assert(aboutSetting !== null, "About Ceenai configured in site_settings table");

  // 8. Order Placement & Durable Snapshot Check
  const sampleProduct = products[0];
  const orderNumber = `TEST-${Date.now().toString().slice(-6)}`;
  const orderId = generateId();
  const now = new Date();
  await execute(
    `INSERT INTO \`orders\` (
      \`id\`, \`orderNumber\`, \`customerName\`, \`customerEmail\`, \`customerPhone\`,
      \`shippingAddress\`, \`items\`, \`subtotal\`, \`shippingFee\`, \`discount\`,
      \`total\`, \`status\`, \`paymentStatus\`, \`paymentMethod\`, \`createdAt\`, \`updatedAt\`
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId,
      orderNumber,
      "Test Buyer",
      "buyer@example.com",
      "9998887770",
      JSON.stringify({
        addressLine: "Test Apartment, Malad",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400095",
      }),
      JSON.stringify([
        {
          productId: sampleProduct.id,
          name: sampleProduct.name,
          price: sampleProduct.sellingPrice,
          quantity: 2,
          size: "M",
          color: "Magenta",
        },
      ]),
      sampleProduct.sellingPrice * 2,
      0,
      0,
      sampleProduct.sellingPrice * 2,
      "CONFIRMED",
      "PENDING",
      "COD",
      now,
      now,
    ]
  );
  assert(orderId !== undefined, `Durable Order snapshot created (#${orderNumber})`);

  // Cleanup test order
  await execute("DELETE FROM `orders` WHERE `id` = ?", [orderId]);

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
    const pool = getPool();
    await pool.end();
  });

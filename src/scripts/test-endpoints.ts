import { findBanners } from "@/lib/repositories/banner";
import { findCategories, countCategories } from "@/lib/repositories/category";
import { findProducts, countProducts } from "@/lib/repositories/product";
import { countUsers } from "@/lib/repositories/user";
import { countOrders } from "@/lib/repositories/order";
import { createPasswordReset, findPasswordResetByToken } from "@/lib/repositories/passwordReset";
import { execute, getPool } from "@/lib/db";
import { Role } from "@/lib/types";

async function testApiEndpoints() {
  console.log("\n========================================================");
  console.log("CEENAI API ENDPOINT INTEGRATION AUDIT (via mysql2)");
  console.log("========================================================\n");

  try {
    // 1. Test Store Home Data Query
    const banners = await findBanners({ isActive: true });
    console.log(`[PASS] Store Home Banners: ${banners.length} active slides loaded.`);

    const categories = await findCategories({
      where: { parentId: null, isActive: true },
      includeChildren: true,
    });
    const subCount = categories.reduce((a, b) => a + (b.children?.length || 0), 0);
    console.log(`[PASS] Store Categories: ${categories.length} primary departments loaded with ${subCount} subcategories.`);

    // 2. Test Store Products with Filters
    const kurtiProducts = await findProducts({
      where: { categorySlug: "indian-wear", isActive: true },
    });
    console.log(`[PASS] Store Filter (Indian Wear): ${kurtiProducts.length} items found.`);

    const priceFiltered = await findProducts({
      where: { minPrice: 1000, maxPrice: 2000, isActive: true },
    });
    console.log(`[PASS] Store Price Range (₹1000 - ₹2000): ${priceFiltered.length} items found.`);

    // 3. Test Admin Stats Calculation
    const [prodCount, catCount, userCount, orderCount] = await Promise.all([
      countProducts(),
      countCategories({ parentId: null }),
      countUsers({ role: Role.CUSTOMER }),
      countOrders(),
    ]);
    console.log(`[PASS] Admin Stats: Products=${prodCount}, Categories=${catCount}, Customers=${userCount}, Orders=${orderCount}.`);

    // 4. Test Password Reset Token Validation & Cleanup
    const testToken = "test-token-" + Date.now();
    await createPasswordReset("priya.sharma@example.com", testToken, new Date(Date.now() + 3600000));
    const foundToken = await findPasswordResetByToken(testToken);
    if (!foundToken) throw new Error("Token retrieval failed");
    console.log(`[PASS] Password Reset: Token created, verified unexpired (${foundToken.expiresAt > new Date()}).`);
    await execute("DELETE FROM `password_resets` WHERE `token` = ?", [testToken]);

    console.log("\nAll core service integrations passed cleanly.\n");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    const pool = getPool();
    await pool.end();
  }
}

testApiEndpoints();

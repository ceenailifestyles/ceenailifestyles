import { execute, generateId, getPool } from "@/lib/db";
import { Role } from "@/lib/types";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database for Ceenai (via pure mysql2)...");

  // 1. Clean existing records safely in order of foreign key dependencies
  await execute("DELETE FROM `collection_products`");
  await execute("DELETE FROM `collections`");
  await execute("DELETE FROM `product_images`");
  await execute("DELETE FROM `product_variants`");
  await execute("DELETE FROM `wishlists`");
  await execute("DELETE FROM `orders`");
  await execute("DELETE FROM `carts`");
  await execute("DELETE FROM `products`");
  await execute("DELETE FROM `categories`");
  await execute("DELETE FROM `banners`");
  await execute("DELETE FROM `site_settings`");
  await execute("DELETE FROM `password_resets`");
  await execute("DELETE FROM `users`");

  const now = new Date();

  // 2. Create Users
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const customerPassword = await bcrypt.hash("Customer@123", 12);

  const superAdminId = generateId();
  await execute(
    "INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [superAdminId, "Ceenai Super Admin", "superadmin@ceenai.in", adminPassword, Role.SUPER_ADMIN, "9987087055", now, now]
  );

  const adminId = generateId();
  await execute(
    "INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [adminId, "Ceenai Admin", "admin@ceenai.in", adminPassword, Role.ADMIN, "9987087055", now, now]
  );

  const customerId = generateId();
  const customerAddresses = [
    {
      id: "addr_1",
      name: "Priya Sharma",
      phone: "9876543210",
      addressLine: "Flat 402, Lotus Residency, Link Road",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400064",
      isDefault: true,
    },
  ];
  await execute(
    "INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `addresses`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [customerId, "Priya Sharma", "priya.sharma@example.com", customerPassword, Role.CUSTOMER, "9876543210", JSON.stringify(customerAddresses), now, now]
  );

  console.log("Users created:", { superAdmin: "superadmin@ceenai.in", admin: "admin@ceenai.in", customer: "priya.sharma@example.com" });

  // 3. Create Categories and Subcategories
  const categoriesData = [
    {
      name: "Indian Wear",
      slug: "indian-wear",
      description: "Timeless kurtis, suit sets, anarkalis and celebration wear for the modern Indian woman.",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80",
      displayOrder: 1,
      subcategories: [
        "Kurtis",
        "Kurta Sets",
        "2-Piece Sets",
        "3-Piece Sets",
        "Anarkali Suits",
        "A-Line Suits",
        "Pakistani Style Suits",
        "Sharara Sets",
        "Festive & Party Wear",
        "Ajrakh Collection",
        "Chanderi Collection",
      ],
    },
    {
      name: "Western Wear",
      slug: "western-wear",
      description: "Chic dresses, elegant office tops, stylish co-ords and casual bottoms.",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
      displayOrder: 2,
      subcategories: [
        "Western Tops",
        "Casual Tops",
        "Office Wear Tops",
        "Dresses",
        "Midi Dresses",
        "A-Line Dresses",
        "Co-ord Sets",
        "Palazzo Pants",
        "Casual Bottoms",
      ],
    },
    {
      name: "Nightwear",
      slug: "nightwear",
      description: "Sumptuous nighties, satin night suits, kaftans and breathable loungewear.",
      image: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=600&q=80",
      displayOrder: 3,
      subcategories: [
        "Nighties",
        "Night Suits",
        "Capri Sets",
        "Kaftans",
        "Designer Nightwear",
        "Lounge Wear",
      ],
    },
    {
      name: "Innerwear & Essentials",
      slug: "innerwear-and-essentials",
      description: "Everyday comfort bras, panties, camisoles, slips and supportive leggings.",
      image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80",
      displayOrder: 4,
      subcategories: [
        "Bras",
        "Panties",
        "Camisoles",
        "Slips",
        "Leggings",
      ],
    },
    {
      name: "Fashion Accessories",
      slug: "fashion-accessories",
      description: "Handcrafted jhumkas, statement necklaces, bracelets, dupattas and luxury handbags.",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80",
      displayOrder: 5,
      subcategories: [
        "Imitation Jewellery",
        "Earrings",
        "Necklaces & Sets",
        "Bracelets & Bangles",
        "Hair Accessories",
        "Stoles",
        "Scarves",
        "Dupattas",
        "Handbags",
      ],
    },
    {
      name: "Beauty & Fragrance",
      slug: "beauty-and-fragrance",
      description: "Exquisite perfumes, lipsticks and curated beauty essentials.",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80",
      displayOrder: 6,
      subcategories: [
        "Perfumes & Fragrances",
        "Lipsticks",
        "Beauty Essentials",
      ],
    },
    {
      name: "Women's Essentials",
      slug: "womens-essentials",
      description: "Comfortable organic sanitary pads and daily personal care essentials.",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
      displayOrder: 7,
      subcategories: [
        "Sanitary Pads",
        "Personal Care Essentials",
      ],
    },
  ];

  const categoryMap = new Map<string, string>();
  const subcategoryMap = new Map<string, string>();

  for (const cat of categoriesData) {
    const catId = generateId();
    await execute(
      "INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [catId, cat.name, cat.slug, cat.description, cat.image, cat.displayOrder, 1, now, now]
    );
    categoryMap.set(cat.slug, catId);

    for (let i = 0; i < cat.subcategories.length; i++) {
      const subName = cat.subcategories[i];
      const subSlug = `${cat.slug}-${subName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const subId = generateId();
      await execute(
        "INSERT INTO `categories` (`id`, `name`, `slug`, `parentId`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [subId, subName, subSlug, catId, i + 1, 1, now, now]
      );
      subcategoryMap.set(subName, subId);
    }
  }

  console.log("Categories and subcategories created.");

  // 4. Create Hero Banners
  const banner1Id = generateId();
  await execute(
    `INSERT INTO \`banners\` (
      \`id\`, \`title\`, \`subtitle\`, \`desktopImage\`, \`mobileImage\`, \`ctaText\`,
      \`ctaLink\`, \`displayOrder\`, \`isActive\`, \`createdAt\`, \`updatedAt\`
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      banner1Id,
      "Ceenai FESTIVE '26",
      "Celebrate In Splendor",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1920&q=85",
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=85",
      "Shop Now",
      "/products?collection=festive-edit",
      1,
      1,
      now,
      now,
    ]
  );

  const banner2Id = generateId();
  await execute(
    `INSERT INTO \`banners\` (
      \`id\`, \`title\`, \`subtitle\`, \`desktopImage\`, \`mobileImage\`, \`ctaText\`,
      \`ctaLink\`, \`displayOrder\`, \`isActive\`, \`createdAt\`, \`updatedAt\`
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      banner2Id,
      "Timeless Elegance",
      "Couture for the Modern Indian Woman",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1920&q=85",
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=900&q=85",
      "SHOP NEW ARRIVALS →",
      "/products?new=true",
      2,
      1,
      now,
      now,
    ]
  );

  // 5. Create Collections
  const festiveColId = generateId();
  await execute(
    "INSERT INTO `collections` (`id`, `title`, `slug`, `description`, `bannerImage`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [festiveColId, "Festive Edit", "festive-edit", "Dresses, Suits & More for Your Special Occasions", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80", 1, 1, now, now]
  );

  const bestSellersColId = generateId();
  await execute(
    "INSERT INTO `collections` (`id`, `title`, `slug`, `description`, `bannerImage`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [bestSellersColId, "Best Sellers", "best-sellers", "Customer favourites crafted with premium quality.", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80", 2, 1, now, now]
  );

  const newArrivalsColId = generateId();
  await execute(
    "INSERT INTO `collections` (`id`, `title`, `slug`, `description`, `bannerImage`, `displayOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [newArrivalsColId, "New Arrivals", "new-arrivals", "The latest styles, just for you.", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80", 3, 1, now, now]
  );

  // 6. Create Products
  const productsData = [
    {
      name: "Embroidered A-Line Kurti",
      slug: "embroidered-a-line-kurti",
      sku: "CEE-IK-001",
      description: "Exquisite deep magenta embroidered A-line kurti made from pure chanderi blend with intricate zari needlework along the neckline and cuffs. Features three-quarter sleeves and a graceful flared hemline perfect for both festive occasions and semi-formal gatherings.",
      shortDescription: "Rich plum magenta kurti with golden thread zari embroidery.",
      categorySlug: "indian-wear",
      subName: "Kurtis",
      sellingPrice: 1199,
      originalPrice: 1499,
      discount: 20,
      mainImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Plum Magenta", "Deep Teal"],
      stock: 45,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isOffer: true,
      rating: 4.8,
      reviewCount: 124,
    },
    {
      name: "Floral Printed Kurta Set",
      slug: "floral-printed-kurta-set",
      sku: "CEE-IK-002",
      description: "Graceful peach and cream floral printed kurta paired with tailored cotton cigarette pants and a matching lightweight mulmul dupatta. Soft, breathable fabric keeps you comfortable all day.",
      shortDescription: "Pastel peach kurta set with delicate botanical floral prints.",
      categorySlug: "indian-wear",
      subName: "Kurta Sets",
      sellingPrice: 1399,
      originalPrice: 1999,
      discount: 30,
      mainImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["M", "L", "XL", "XXL"],
      colors: ["Peach Floral", "Powder Blue"],
      stock: 38,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isOffer: true,
      rating: 4.7,
      reviewCount: 96,
    },
    {
      name: "Satin Night Suit Set",
      slug: "satin-night-suit-set",
      sku: "CEE-NW-001",
      description: "Luxuriously soft premium satin notch collar button-down night suit featuring matching relaxed-fit pyjamas. Tailored piping details provide a refined touch of everyday elegance.",
      shortDescription: "Dusty rose satin notch-collar shirt and pyjama set.",
      categorySlug: "nightwear",
      subName: "Night Suits",
      sellingPrice: 1299,
      originalPrice: 1299,
      discount: 0,
      mainImage: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Dusty Pink", "Midnight Navy"],
      stock: 52,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isOffer: false,
      rating: 4.9,
      reviewCount: 67,
    },
    {
      name: "Linen Co-ord Set",
      slug: "linen-co-ord-set",
      sku: "CEE-WW-001",
      description: "Sophisticated deep emerald green pure breathable linen co-ord set with a belted tunic and relaxed straight-leg trousers. Designed for modern versatile styling from work meetings to brunch.",
      shortDescription: "Emerald linen tunic and trouser co-ord set.",
      categorySlug: "western-wear",
      subName: "Co-ord Sets",
      sellingPrice: 1799,
      originalPrice: 2399,
      discount: 25,
      mainImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["XS", "S", "M", "L"],
      colors: ["Bottle Green", "Beige Oatmeal"],
      stock: 29,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isOffer: true,
      rating: 4.8,
      reviewCount: 208,
    },
    {
      name: "Traditional Jhumka Earrings",
      slug: "traditional-jhumka-earrings",
      sku: "CEE-AC-001",
      description: "Handcrafted 22K gold-plated antique temple jewellery jhumkas studded with micro pearls and kundan detailing. Lightweight construction engineered for comfortable extended wear.",
      shortDescription: "Antique gold plated floral temple jhumkas with pearl drops.",
      categorySlug: "fashion-accessories",
      subName: "Earrings",
      sellingPrice: 599,
      originalPrice: 599,
      discount: 0,
      mainImage: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["Free Size"],
      colors: ["Gold & Pearl"],
      stock: 65,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isOffer: false,
      rating: 4.9,
      reviewCount: 42,
    },
    {
      name: "Anarkali Suit Set",
      slug: "anarkali-suit-set",
      sku: "CEE-IK-003",
      description: "Stately golden-cream floor-length flared anarkali suit tailored from pure georgette with gota patti borders, paired with matching churidar and scalloped organza dupatta.",
      shortDescription: "Royal cream georgette anarkali with gota patti craftsmanship.",
      categorySlug: "indian-wear",
      subName: "Anarkali Suits",
      sellingPrice: 2799,
      originalPrice: 2799,
      discount: 0,
      mainImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["S", "M", "L", "XL"],
      colors: ["Champagne Cream", "Soft Rose"],
      stock: 22,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isOffer: false,
      rating: 4.8,
      reviewCount: 36,
    },
    {
      name: "A-Line Dress",
      slug: "a-line-dress",
      sku: "CEE-WW-002",
      description: "Flattering wine red A-line midi dress featuring a V-neckline, subtle empire waist gather and breathable cotton-rayon stretch blend.",
      shortDescription: "Wine red V-neck relaxed A-line casual midi dress.",
      categorySlug: "western-wear",
      subName: "A-Line Dresses",
      sellingPrice: 1599,
      originalPrice: 1999,
      discount: 20,
      mainImage: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Wine Red", "Classic Black"],
      stock: 40,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isOffer: true,
      rating: 4.7,
      reviewCount: 118,
    },
    {
      name: "Printed Nightie",
      slug: "printed-nightie",
      sku: "CEE-NW-002",
      description: "Ultra-comfy pure combed cotton full-length nightie with gentle smocking at the yoke, cap sleeves and all-over sweet micro-botanical motifs.",
      shortDescription: "Pure combed cotton full-length floral printed nightie.",
      categorySlug: "nightwear",
      subName: "Nighties",
      sellingPrice: 799,
      originalPrice: 799,
      discount: 0,
      mainImage: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["Free Size", "XXL"],
      colors: ["Lavender Floral", "Mint Blossom"],
      stock: 80,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isOffer: false,
      rating: 4.8,
      reviewCount: 85,
    },
    {
      name: "Padded Bra",
      slug: "padded-bra",
      sku: "CEE-IN-001",
      description: "Seamless wireless T-shirt padded bra crafted from buttery microfibre with contour cups that give natural shaping and invisible coverage under everyday outfits.",
      shortDescription: "Non-wired seamless contour padded everyday bra.",
      categorySlug: "innerwear-and-essentials",
      subName: "Bras",
      sellingPrice: 599,
      originalPrice: 899,
      discount: 30,
      mainImage: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["32B", "34B", "34C", "36B", "36C", "38C"],
      colors: ["Rose Mauve", "Nude Almond", "Black"],
      stock: 110,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isOffer: true,
      rating: 4.8,
      reviewCount: 233,
    },
    {
      name: "Structured Handbag",
      slug: "structured-handbag",
      sku: "CEE-AC-002",
      description: "Premium vegan leather structured top-handle handbag in warm beige cream with gold-tone twist lock and detachable crossbody strap.",
      shortDescription: "Elegant cream structured vegan leather handbag with gold hardware.",
      categorySlug: "fashion-accessories",
      subName: "Handbags",
      sellingPrice: 1899,
      originalPrice: 1899,
      discount: 0,
      mainImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["Medium"],
      colors: ["Warm Beige", "Tan Camel"],
      stock: 35,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isOffer: false,
      rating: 4.9,
      reviewCount: 27,
    },
    {
      name: "Signature Rose & Oud Perfume",
      slug: "signature-rose-and-oud-perfume",
      sku: "CEE-BF-001",
      description: "An artisanal Eau de Parfum blending Damascene rose petals, spicy cardamom and rich royal cambodi oud. Long-lasting luxury projection designed for evening celebrations.",
      shortDescription: "Eau De Parfum (100ml) with opulent rose and agarwood accords.",
      categorySlug: "beauty-and-fragrance",
      subName: "Perfumes & Fragrances",
      sellingPrice: 1499,
      originalPrice: 1999,
      discount: 25,
      mainImage: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["100ml"],
      colors: ["Golden Amber"],
      stock: 50,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: true,
      isOffer: true,
      rating: 4.9,
      reviewCount: 78,
    },
    {
      name: "Organic Bamboo Cotton Sanitary Pads",
      slug: "organic-bamboo-cotton-sanitary-pads",
      sku: "CEE-WE-001",
      description: "Ultra-absorbent, hypoallergenic and rash-free certified organic bamboo cotton sanitary pads (Pack of 20 - XL). Chemical-free and breathable with leak-lock barriers.",
      shortDescription: "Pack of 20 XL organic bamboo breathable pads.",
      categorySlug: "womens-essentials",
      subName: "Sanitary Pads",
      sellingPrice: 349,
      originalPrice: 399,
      discount: 12,
      mainImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
      ],
      sizes: ["XL (Pack of 20)"],
      colors: ["Natural White"],
      stock: 140,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      isOffer: false,
      rating: 4.9,
      reviewCount: 310,
    },
  ];

  for (const item of productsData) {
    const parentCatId = categoryMap.get(item.categorySlug);
    const subCatId = item.subName ? subcategoryMap.get(item.subName) || null : null;
    const productId = generateId();

    await execute(
      `INSERT INTO \`products\` (
        \`id\`, \`name\`, \`slug\`, \`sku\`, \`description\`, \`shortDescription\`,
        \`categoryId\`, \`subcategoryId\`, \`sellingPrice\`, \`originalPrice\`, \`discount\`,
        \`productType\`, \`mainImage\`, \`sizes\`, \`colors\`, \`stock\`,
        \`isFeatured\`, \`isBestSeller\`, \`isNewArrival\`, \`isOffer\`, \`isActive\`,
        \`rating\`, \`reviewCount\`, \`createdAt\`, \`updatedAt\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        item.name,
        item.slug,
        item.sku,
        item.description,
        item.shortDescription,
        parentCatId,
        subCatId,
        item.sellingPrice,
        item.originalPrice,
        item.discount,
        "NORMAL",
        item.mainImage,
        JSON.stringify(item.sizes),
        JSON.stringify(item.colors),
        item.stock,
        item.isFeatured ? 1 : 0,
        item.isBestSeller ? 1 : 0,
        item.isNewArrival ? 1 : 0,
        item.isOffer ? 1 : 0,
        1,
        item.rating,
        item.reviewCount,
        now,
        now,
      ]
    );

    // Gallery images
    for (let idx = 0; idx < item.gallery.length; idx++) {
      const imgId = generateId();
      await execute(
        "INSERT INTO `product_images` (`id`, `productId`, `url`, `displayOrder`, `createdAt`) VALUES (?, ?, ?, ?, ?)",
        [imgId, productId, item.gallery[idx], idx, now]
      );
    }

    // Add to collections
    if (item.categorySlug === "indian-wear" || item.isOffer) {
      await execute(
        "INSERT INTO `collection_products` (`id`, `collectionId`, `productId`, `displayOrder`) VALUES (?, ?, ?, ?)",
        [generateId(), festiveColId, productId, 1]
      );
    }

    if (item.isBestSeller) {
      await execute(
        "INSERT INTO `collection_products` (`id`, `collectionId`, `productId`, `displayOrder`) VALUES (?, ?, ?, ?)",
        [generateId(), bestSellersColId, productId, 2]
      );
    }

    if (item.isNewArrival) {
      await execute(
        "INSERT INTO `collection_products` (`id`, `collectionId`, `productId`, `displayOrder`) VALUES (?, ?, ?, ?)",
        [generateId(), newArrivalsColId, productId, 3]
      );
    }
  }

  console.log("Products and collection mappings created.");

  // 7. Site Settings
  const siteSettings = [
    {
      key: "announcement_bar",
      value: {
        address: "Om Kripa CHS, Shop No. 1, Janakalyan Road, Off Marve Road, Malad West, Mumbai - 400095",
        phone: "9987087055",
        email: "support@ceenai.in",
        isActive: true,
      },
    },
    {
      key: "benefits",
      value: [
        {
          title: "Free Shipping",
          subtitle: "On Orders Above ₹999",
          icon: "Truck",
        },
        {
          title: "Easy Returns",
          subtitle: "Hassle-free Exchange",
          icon: "RefreshCw",
        },
        {
          title: "Secure Payments",
          subtitle: "100% Safe & Encrypted",
          icon: "ShieldCheck",
        },
        {
          title: "Visit Our Store",
          subtitle: "Malad West, Mumbai",
          icon: "Store",
        },
        {
          title: "Trusted Quality",
          subtitle: "Style, Comfort & Value",
          icon: "Award",
        },
      ],
    },
    {
      key: "about_ceenai",
      value: {
        heading: "About Ceenai",
        subheading: "A Story That Begins With You.",
        description: "What began with a passion for stylish nightwear on Amazon has grown into a complete women's fashion and lifestyle destination offering Indian wear, western wear, nightwear, accessories and more.",
        storeImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
        ctaText: "Know Our Story →",
        ctaLink: "/about",
        pillars: [
          { title: "Style", desc: "Trendy & Timeless" },
          { title: "Comfort", desc: "Feels as Good as It Looks" },
          { title: "Value", desc: "Great Fashion at Sensible Prices" },
          { title: "Choice", desc: "A Growing Range for Every Occasion" },
        ],
      },
    },
    {
      key: "testimonials",
      value: [
        {
          id: "t1",
          quote: "Beautiful collection, great quality and very comfortable! Ceenai is now my go-to for every occasion.",
          author: "Priya S.",
          role: "Verified Customer",
          rating: 5,
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
        },
      ],
    },
    {
      key: "footer_settings",
      value: {
        brandDescription: "Right Nightwear Beginnings to Everyday Elegance.",
        phone: "9987087055",
        email: "support@ceenai.in",
        storeAddress: "Om Kripa CHS, Shop No. 1, Janakalyan Road, Off Marve Road, Malad West, Mumbai - 400095",
        socialLinks: {
          instagram: "https://instagram.com/ceenai",
          facebook: "https://facebook.com/ceenai",
          youtube: "https://youtube.com/@ceenai",
          pinterest: "https://pinterest.com/ceenai",
        },
        copyright: "© 2026 Ceenai. All Rights Reserved.",
      },
    },
  ];

  for (const s of siteSettings) {
    const sId = generateId();
    await execute(
      "INSERT INTO `site_settings` (`id`, `key`, `value`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?)",
      [sId, s.key, JSON.stringify(s.value), now, now]
    );
  }

  console.log("Site settings seeded.");
  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    const pool = getPool();
    await pool.end();
  });


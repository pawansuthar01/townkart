// prisma/seed.ts
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

if (process.env.FORCE_SEED !== "true") {
  console.error(
    "✋ Seeder refused to run. To run seeder set environment variable FORCE_SEED=true"
  );
  process.exit(1);
}

// Retry/utility helpers (same ideas as your original)
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `Attempt ${attempt}/${maxRetries} failed:`,
        error instanceof Error ? error.message : String(error)
      );
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }
  }
  throw lastError!;
}

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection OK");
    return true;
  } catch (err) {
    console.error("❌ DB connection failed:", err);
    return false;
  }
}

async function safeTruncate(table: string) {
  try {
    await prisma.$executeRawUnsafe(
      `DO $$
       BEGIN
          IF EXISTS (SELECT 1 FROM pg_class WHERE relname='${table}') THEN
             EXECUTE 'TRUNCATE TABLE "${table}" CASCADE';
          END IF;
       END $$;`
    );
    console.log(`✔️ Truncated: ${table}`);
  } catch (err) {
    console.log(`⚠️ Skip (not exist): ${table}`);
  }
}

async function resetDatabase() {
  const tables = [
    "location_audit_logs",
    "location_data_records",
    "location_consents",
    "order_status_history",
    "store_staff",
    "store_inventory",
    "rider_cash_balances",
    "cash_settlements",
    "cash_transactions",
    "disputes",
    "delivery_logs",
    "rider_locations",
    "rider_earnings",
    "rider_logs",
    "product_sales",
    "coupon_usages",
    "coupons",
    "offers",
    "product_reviews",
    "reviews",
    "payments",
    "deliveries",
    "order_items",
    "orders",
    "wishlist_items",
    "product_images",
    "product_variants",
    "products",
    "product_categories",
    "collections",
    "banners",
    "advertisements",
    "special_offers",
    "service_areas",
    "delivery_zones",
    "rider_zone_assignments",
    "rider_profiles",
    "stores",
    "customer_profiles",
    "addresses",
    "wallet_transactions",
    "wallets",
    "notifications",
    "sessions",
    "devices",
    "login_attempts",
    "email_verifications",
    "phone_verifications",
    "users",
  ];

  for (const table of tables) {
    await safeTruncate(table);
  }
}

/**
 * Batch create helper that uses createMany for products.
 * Returns created product IDs for later use.
 */
async function batchCreateProducts(
  createDataArray: any[],
  batchSize = 200
): Promise<any[]> {
  const created: any[] = [];
  for (let i = 0; i < createDataArray.length; i += batchSize) {
    const slice = createDataArray.slice(i, i + batchSize);
    // Remove images from product data before creating
    const productDataForCreate = slice.map(({ images, ...rest }) => rest);
    // Use createMany for bulk insert
    await withRetry(
      () => prisma.product.createMany({ data: productDataForCreate }),
      3,
      2000
    );

    // Get the created products by querying with similar criteria
    // This is a simplified approach - in production you'd want better tracking
    const lastBatchProducts = await prisma.product.findMany({
      where: {
        slug: {
          in: slice.map((p: any) => p.slug),
        },
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        price: true,
        discountedPrice: true,
        isAvailable: true,
        imageUrls: true, // Keep for image creation
      },
    });

    console.log(`    Queried ${lastBatchProducts.length} products for batch`);
    created.push(...lastBatchProducts);
    console.log(
      `  ➕ Created batch ${Math.floor(i / batchSize) + 1} (${slice.length} items)`
    );
  }
  return created;
}

async function createProductBatchesForStore(
  store: any,
  productCount: number,
  startIndex = 0,
  categories: any[]
) {
  const productDatas: any[] = [];

  // distribution
  const groceryCount = Math.floor(productCount * 0.4);
  const electronicsCount = Math.floor(productCount * 0.25);
  const fashionCount = Math.floor(productCount * 0.2);
  const householdCount =
    productCount - groceryCount - electronicsCount - fashionCount;

  const now = Date.now();

  // helper to push product object
  const pushProduct = (
    template: any,
    i: number,
    categoryIndex: number,
    offset = 0
  ) => {
    const slugBase = `${template.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const slug = `${slugBase}-${startIndex + offset + i + 1}-${now}`;
    productDatas.push({
      name: `${template.name} ${startIndex + offset + i + 1}`,
      description: template.description,
      shortDescription: template.shortDescription,
      price:
        template.basePrice +
        Math.floor(Math.random() * (template.priceVariance || 50)),
      discountedPrice:
        Math.random() > 0.7
          ? template.basePrice - 5 + Math.floor(Math.random() * 10)
          : null,
      stockQuantity:
        (template.minStock || 5) +
        Math.floor(Math.random() * (template.maxStockVariance || 50)),
      categoryName: categories[categoryIndex].name,
      subcategory: template.subcategory,
      brand:
        template.brands[Math.floor(Math.random() * template.brands.length)],
      weight: template.weight || 0.2 + Math.random(),
      specifications: template.specifications,
      features: template.features,
      tags: template.tags,
      keywords: template.keywords,
      isAvailable: true,
      isFeatured: Math.random() > 0.9,
      isNew: Math.random() > 0.95,
      isOnSale: Math.random() > 0.8,
      averageRating: 4 + Math.random(),
      totalReviews: Math.floor(Math.random() * 100),
      totalSales: Math.floor(Math.random() * 300),
      categoryId: categories[categoryIndex].id,
      slug,
      images: template.images, // Add images for later use
      publishedAt: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ),
    });
  };

  // templates (reuse from your original templates but smaller and consistent)
  const groceryTemplates = [
    {
      name: "Fresh Organic Tomatoes",
      description: "Premium organic red tomatoes, grown without pesticides.",
      shortDescription: "Fresh organic tomatoes",
      basePrice: 35,
      subcategory: "Vegetables",
      brands: ["FarmFresh", "Organic Valley", "Green Harvest"],
      specifications: {
        Type: "Organic",
        Origin: "Local Farm",
        "Shelf Life": "7 days",
      },
      features: ["Pesticide-free", "Locally sourced"],
      tags: ["organic", "fresh"],
      keywords: ["tomatoes", "organic"],
      images: [
        "https://images.unsplash.com/photo-1546470427-e9e826abd807?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=400&h=300&fit=crop",
      ],
      minStock: 10,
      maxStockVariance: 50,
    },
    {
      name: "Whole Wheat Bread",
      description: "Freshly baked whole wheat bread with no preservatives.",
      shortDescription: "Whole wheat bread",
      basePrice: 30,
      subcategory: "Bakery",
      brands: ["Baker's Delight", "Whole Grain Co"],
      specifications: {
        Ingredients: "Whole wheat flour, water",
        "Shelf Life": "3 days",
      },
      features: ["Whole grain", "High fiber"],
      tags: ["bread", "bakery"],
      keywords: ["bread", "whole wheat"],
      images: [
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      ],
      minStock: 8,
      maxStockVariance: 40,
    },
    {
      name: "Fresh Milk",
      description: "Fresh cow milk, pasteurized and homogenized.",
      shortDescription: "Fresh cow milk",
      basePrice: 25,
      subcategory: "Dairy",
      brands: ["Dairy Fresh", "Milk Masters"],
      specifications: {
        Type: "Cow Milk",
        Fat: "3.5%",
        "Shelf Life": "5 days",
      },
      features: ["Pasteurized", "Homogenized"],
      tags: ["milk", "dairy"],
      keywords: ["fresh milk", "cow milk"],
      images: [
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=300&fit=crop",
      ],
      minStock: 12,
      maxStockVariance: 30,
    },
    {
      name: "Organic Bananas",
      description: "Sweet and ripe organic bananas.",
      shortDescription: "Organic bananas",
      basePrice: 40,
      subcategory: "Fruits",
      brands: ["Fruit Farm", "Organic Fruits"],
      specifications: {
        Type: "Organic",
        Origin: "Local Farm",
        "Shelf Life": "7 days",
      },
      features: ["Organic", "Ripe"],
      tags: ["banana", "organic"],
      keywords: ["bananas", "organic fruit"],
      images: [
        "https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1603833665858-e61e17a86224?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&h=300&fit=crop",
      ],
      minStock: 15,
      maxStockVariance: 45,
    },
  ];

  const electronicsTemplates = [
    {
      name: "Wireless Bluetooth Headphones",
      description: "Wireless headphones with ANC and long battery life.",
      shortDescription: "Bluetooth Headphones with ANC",
      basePrice: 2000,
      subcategory: "Audio",
      brands: ["SoundMax", "AudioTech"],
      specifications: {
        "Battery Life": "20-30 hours",
        Connectivity: "Bluetooth 5.0",
      },
      features: ["Noise Cancellation", "Long battery life"],
      tags: ["headphones", "wireless"],
      keywords: ["wireless headphones", "bluetooth"],
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop",
      ],
      minStock: 2,
      maxStockVariance: 10,
      priceVariance: 1500,
    },
    {
      name: "Smartphone Charger",
      description: "Fast charging USB-C charger for smartphones.",
      shortDescription: "Fast USB-C charger",
      basePrice: 500,
      subcategory: "Accessories",
      brands: ["TechCharge", "PowerMax"],
      specifications: {
        Output: "18W",
        "Connector Type": "USB-C",
        Compatibility: "Universal",
      },
      features: ["Fast charging", "Compact design"],
      tags: ["charger", "usb-c"],
      keywords: ["smartphone charger", "fast charger"],
      images: [
        "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1609594040430-23b4deaf9c83?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=300&fit=crop",
      ],
      minStock: 5,
      maxStockVariance: 20,
      priceVariance: 300,
    },
  ];

  const fashionTemplates = [
    {
      name: "Cotton Summer Dress",
      description: "Light and comfortable cotton dress.",
      shortDescription: "Breathable cotton dress",
      basePrice: 1000,
      subcategory: "Dresses",
      brands: ["Cotton Comfort", "Summer Style"],
      specifications: { Material: "100% Cotton", Fit: "Regular" },
      features: ["Breathable", "Comfortable fit"],
      tags: ["dress", "cotton"],
      keywords: ["summer dress"],
      images: [
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=300&fit=crop",
      ],
      minStock: 5,
      maxStockVariance: 40,
      priceVariance: 800,
    },
    {
      name: "Casual T-Shirt",
      description: "Comfortable cotton t-shirt for everyday wear.",
      shortDescription: "Cotton t-shirt",
      basePrice: 300,
      subcategory: "T-Shirts",
      brands: ["Comfort Wear", "Casual Style"],
      specifications: { Material: "100% Cotton", Fit: "Regular" },
      features: ["Soft fabric", "Easy care"],
      tags: ["t-shirt", "cotton"],
      keywords: ["casual t-shirt"],
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=300&fit=crop",
      ],
      minStock: 10,
      maxStockVariance: 50,
      priceVariance: 200,
    },
  ];

  const householdTemplates = [
    {
      name: "LED Desk Lamp",
      description: "Modern LED desk lamp with adjustable brightness.",
      shortDescription: "Adjustable LED lamp",
      basePrice: 1000,
      subcategory: "Lighting",
      brands: ["LightTech", "HomeBright"],
      specifications: { Power: "5W LED", "Brightness Levels": "5" },
      features: ["USB charging", "Touch control"],
      tags: ["desk lamp", "led"],
      keywords: ["desk lamp", "usb lamp"],
      images: [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      ],
      minStock: 6,
      maxStockVariance: 30,
      priceVariance: 700,
    },
    {
      name: "Kitchen Towel Set",
      description: "Absorbent cotton kitchen towels, set of 5.",
      shortDescription: "Cotton kitchen towels",
      basePrice: 150,
      subcategory: "Kitchen",
      brands: ["Home Essentials", "Kitchen Comfort"],
      specifications: { Material: "Cotton", Quantity: "5 pieces" },
      features: ["Absorbent", "Machine washable"],
      tags: ["towel", "kitchen"],
      keywords: ["kitchen towels", "cotton towels"],
      images: [
        "https://images.unsplash.com/photo-1583944583579-928d1ba7dc9a?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      ],
      minStock: 8,
      maxStockVariance: 25,
      priceVariance: 100,
    },
  ];

  // push grocery
  for (let i = 0; i < groceryCount; i++) {
    const template = groceryTemplates[i % groceryTemplates.length];
    pushProduct(template, i, 0, 0);
  }

  // electronics
  for (let i = 0; i < electronicsCount; i++) {
    const template = electronicsTemplates[i % electronicsTemplates.length];
    pushProduct(template, i, 3, groceryCount);
  }

  // fashion
  for (let i = 0; i < fashionCount; i++) {
    const template = fashionTemplates[i % fashionTemplates.length];
    pushProduct(template, i, 4, groceryCount + electronicsCount);
  }

  // household
  for (let i = 0; i < householdCount; i++) {
    const template = householdTemplates[i % householdTemplates.length];
    pushProduct(template, i, 5, groceryCount + electronicsCount + fashionCount);
  }

  // Create products in batches (transactions)
  console.log(
    `  Creating ${productDatas.length} products for store ${store.name} in batches...`
  );
  const createdProducts = await batchCreateProducts(productDatas, 200);

  // Create product images for each product
  console.log(
    `  Creating product images for ${createdProducts.length} products...`
  );
  console.log(
    `    Sample created product names: ${createdProducts
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ")}`
  );
  const imageRows: any[] = [];
  let matchedCount = 0;
  let totalImages = 0;
  productDatas.forEach((originalProduct: any, index: number) => {
    if (originalProduct.images && originalProduct.images.length > 0) {
      totalImages += originalProduct.images.length;
      // Find the corresponding created product
      const createdProduct = createdProducts.find(
        (cp) => cp.name === originalProduct.name
      );
      // Alternative: match by slug if name doesn't work
      // const createdProduct = createdProducts.find(
      //   (cp) => cp.slug === originalProduct.slug
      // );
      if (createdProduct) {
        matchedCount++;
        originalProduct.images.forEach((url: string, imgIndex: number) => {
          imageRows.push({
            productId: createdProduct.id,
            url: url,
            alt: `${originalProduct.name} image ${imgIndex + 1}`,
            isPrimary: imgIndex === 0,
            sortOrder: imgIndex,
          });
        });
      } else {
        console.log(`    No match found for product: ${originalProduct.name}`);
      }
    }
  });
  console.log(
    `    Found ${totalImages} total images in templates, matched ${matchedCount} products`
  );

  console.log(`    Prepared ${imageRows.length} product images to create`);

  // Create images individually to catch any errors
  console.log(`    Creating ${imageRows.length} product images...`);
  for (const imageRow of imageRows) {
    await withRetry(
      () => prisma.productImage.create({ data: imageRow }),
      3,
      2000
    );
  }
  console.log(`    ✅ Created all product images`);

  // Create storeInventory entries in batches using createMany (fast)
  console.log(
    `  Creating store inventory entries for ${createdProducts.length} products...`
  );
  const inventoryRows: any[] = createdProducts.map((p: any) => ({
    storeId: store.id,
    productId: p.id,
    stockQuantity: p.stockQuantity,
    minStockLevel: Math.max(1, Math.floor(p.stockQuantity * 0.1)),
    maxStockLevel: Math.max(p.stockQuantity, Math.floor(p.stockQuantity * 2)),
    price: p.price,
    discountedPrice: p.discountedPrice,
    isAvailable: p.isAvailable,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Create inventory in batches (createMany supports many rows)
  for (let i = 0; i < inventoryRows.length; i += 500) {
    const slice = inventoryRows.slice(i, i + 500);
    await withRetry(
      () => prisma.storeInventory.createMany({ data: slice }),
      3,
      2000
    );
    console.log(
      `    ➕ Created storeInventory batch ${Math.floor(i / 500) + 1}`
    );
  }

  return createdProducts;
}

async function main() {
  console.log("🌱 Seeder start");

  if (!(await checkDatabaseConnection())) {
    console.error("DB not available — aborting seeding.");
    process.exit(1);
  }

  try {
    // Clear DB
    await withRetry(() => resetDatabase(), 3, 2000);

    // Create service area
    console.log("📍 Creating ServiceArea");
    const serviceArea = await prisma.serviceArea.create({
      data: {
        name: "Hanumangarh Junction & Town",
        city: "Hanumangarh",
        state: "Rajasthan",
        centerLat: 29.5818,
        centerLng: 74.3294,
        radiusKm: 15.0,
        bounds: { north: 29.7, south: 29.5, east: 74.4, west: 74.2 },
        isActive: true,
      },
    });

    // Create admin users
    console.log("👑 Creating admin users");
    const adminUsers = await Promise.all([
      prisma.user.create({
        data: {
          phoneNumber: "+919876543210",
          fullName: "TownKart Admin 1",
          email: "admin1@townkart.com",
          password: await hashPassword("admin123"),
          userRoles: ["ADMIN"],
          activeRole: "ADMIN",
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543211",
          fullName: "TownKart Admin 2",
          email: "admin2@townkart.com",
          password: await hashPassword("admin123"),
          userRoles: ["ADMIN"],
          activeRole: "ADMIN",
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
        },
      }),
    ]);

    // Create store managers
    console.log("🏪 Creating store managers");
    const storeManagers = await Promise.all([
      prisma.user.create({
        data: {
          phoneNumber: "+919876543212",
          fullName: "Rajesh Kumar",
          email: "rajesh.manager@townkart.com",
          password: await hashPassword("manager123"),
          userRoles: ["STORE_MANAGER"],
          activeRole: "STORE_MANAGER",
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543213",
          fullName: "Priya Sharma",
          email: "priya.manager@townkart.com",
          password: await hashPassword("manager123"),
          userRoles: ["STORE_MANAGER"],
          activeRole: "STORE_MANAGER",
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
        },
      }),
    ]);

    // Create additional store managers for pending applications
    console.log(
      "🏪 Creating additional store managers for pending applications"
    );
    const pendingStoreManagers = await Promise.all([
      prisma.user.create({
        data: {
          phoneNumber: "+919876543214",
          fullName: "Amit Singh",
          email: "amit.manager@townkart.com",
          password: await hashPassword("manager123"),
          userRoles: ["STORE_MANAGER"],
          activeRole: "STORE_MANAGER",
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543215",
          fullName: "Sunita Patel",
          email: "sunita.manager@townkart.com",
          password: await hashPassword("manager123"),
          userRoles: ["STORE_MANAGER"],
          activeRole: "STORE_MANAGER",
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
        },
      }),
    ]);

    // Create stores (approved and pending)
    console.log("🏬 Creating stores (approved and pending)");
    const stores = await Promise.all([
      // Approved stores
      prisma.store.create({
        data: {
          name: "Fresh Mart Hanumangarh Junction",
          code: "FMHJ001",
          description: "Neighborhood grocery store",
          address: "123 Station Road, Hanumangarh Junction, Rajasthan 335512",
          city: "Hanumangarh",
          state: "Rajasthan",
          pincode: "335512",
          latitude: 29.5818,
          longitude: 74.3294,
          category: "Grocery",
          subcategory: "Supermarket",
          managerId: storeManagers[0].id,
          isActive: true,
          isVerified: true,
          // applicationStatus: "APPROVED", // TODO: Uncomment after Prisma client regeneration
          averageRating: 4.5,
          totalOrders: 1250,
          totalRevenue: 250000,
          phoneNumber: "+919876543216",
          email: "junction@freshmart.com",
          operatingHours: {
            monday: { open: "09:00", close: "21:00" },
            tuesday: { open: "09:00", close: "21:00" },
          },
          serviceAreaId: serviceArea.id,
        },
      }),
      prisma.store.create({
        data: {
          name: "Mega Mall Hanumangarh Town",
          code: "MMHT001",
          description: "Premium shopping destination",
          address: "456 Main Market, Hanumangarh Town, Rajasthan 335513",
          city: "Hanumangarh",
          state: "Rajasthan",
          pincode: "335513",
          latitude: 29.5918,
          longitude: 74.3194,
          category: "Retail",
          subcategory: "Departmental Store",
          managerId: storeManagers[1].id,
          isActive: true,
          isVerified: true,
          // applicationStatus: "APPROVED", // TODO: Uncomment after Prisma client regeneration
          averageRating: 4.3,
          totalOrders: 890,
          totalRevenue: 180000,
          phoneNumber: "+919876543217",
          email: "town@megamall.com",
          operatingHours: {
            monday: { open: "10:00", close: "20:00" },
          },
          serviceAreaId: serviceArea.id,
        },
      }),
      // Pending store applications
      prisma.store.create({
        data: {
          name: "Quick Grocery Hub",
          code: "QGH001",
          description: "Quick service grocery store",
          address: "789 Bypass Road, Hanumangarh, Rajasthan 335512",
          city: "Hanumangarh",
          state: "Rajasthan",
          pincode: "335512",
          latitude: 29.5718,
          longitude: 74.3394,
          category: "Grocery",
          subcategory: "Convenience Store",
          managerId: pendingStoreManagers[0].id,
          isActive: false, // Pending approval
          isVerified: false,
          // applicationStatus: "PENDING", // TODO: Uncomment after Prisma client regeneration
          phoneNumber: "+919876543218",
          email: "hub@quickgrocery.com",
          operatingHours: {
            monday: { open: "08:00", close: "22:00" },
          },
          serviceAreaId: serviceArea.id,
        },
      }),
      prisma.store.create({
        data: {
          name: "Fashion Corner",
          code: "FC001",
          description: "Trendy fashion boutique",
          address: "321 Mall Road, Hanumangarh, Rajasthan 335513",
          city: "Hanumangarh",
          state: "Rajasthan",
          pincode: "335513",
          latitude: 29.6018,
          longitude: 74.3094,
          category: "Fashion",
          subcategory: "Boutique",
          managerId: pendingStoreManagers[1].id,
          isActive: false, // Pending approval
          isVerified: false,
          // applicationStatus: "PENDING", // TODO: Uncomment after Prisma client regeneration
          phoneNumber: "+919876543219",
          email: "corner@fashioncorner.com",
          operatingHours: {
            monday: { open: "11:00", close: "19:00" },
          },
          serviceAreaId: serviceArea.id,
        },
      }),
    ]);

    // Create store staff entries for approved stores
    console.log("🏪 Creating store staff entries for approved stores");
    await Promise.all([
      prisma.storeStaff.create({
        data: {
          storeId: stores[0].id, // Fresh Mart
          userId: storeManagers[0].id,
          role: "manager",
          isActive: true,
        },
      }),
      prisma.storeStaff.create({
        data: {
          storeId: stores[1].id, // Mega Mall
          userId: storeManagers[1].id,
          role: "manager",
          isActive: true,
        },
      }),
    ]);

    // Create riders (small batch for demo)
    console.log("🚴 Creating riders");
    const riders: any[] = [];
    for (let i = 0; i < 6; i++) {
      const r = await prisma.user.create({
        data: {
          phoneNumber: `+9198765432${18 + i}`,
          fullName: `Rider ${i + 1}`,
          email: `rider${i + 1}@townkart.com`,
          password: await hashPassword("rider123"),
          userRoles: ["RIDER"],
          activeRole: "RIDER",
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
          riderProfile: {
            create: {
              city: "Hanumangarh",
              vehicleType: i % 2 === 0 ? "bike" : "scooter",
              isAvailable: true,
              currentLat: 29.5818 + (Math.random() - 0.5) * 0.02,
              currentLng: 74.3294 + (Math.random() - 0.5) * 0.02,
              rating: 4.0 + Math.random() * 1.0,
              totalDeliveries: Math.floor(Math.random() * 200) + 50,
              totalEarnings: Math.floor(Math.random() * 50000) + 10000,
              isVerified: true,
              isActive: true,
              maxDailyDeliveries: 20,
            },
          },
        },
        include: { riderProfile: true },
      });
      riders.push(r);
    }

    // Create customers
    console.log("👥 Creating customers (10)");
    const customers: any[] = [];
    for (let i = 0; i < 10; i++) {
      const c = await prisma.user.create({
        data: {
          phoneNumber: `+9198765433${i}`,
          fullName: `Customer ${i + 1}`,
          email: `customer${i + 1}@email.com`,
          password: await hashPassword("customer123"),
          userRoles: ["CUSTOMER"],
          activeRole: "CUSTOMER",
          emailVerified: true,
          phoneVerified: true,
          isActive: true,
          customerProfile: {
            create: {
              preferences: {
                notifications: true,
                language: "en",
                currency: "INR",
              },
            },
          },
          addresses: {
            create: [
              {
                line1: `${100 + i * 10} Main Street, Hanumangarh`,
                city: "Hanumangarh",
                state: "Rajasthan",
                pincode: i % 2 === 0 ? "335512" : "335513",
                latitude: 29.5818 + (Math.random() - 0.5) * 0.01,
                longitude: 74.3294 + (Math.random() - 0.5) * 0.01,
                addressType: "HOME",
                isDefault: true,
              },
            ],
          },
        },
      });
      customers.push(c);
    }

    // Create categories (re-using your categories)
    console.log("📚 Creating product categories");
    const categories = await Promise.all([
      prisma.productCategory.create({
        data: {
          name: "Grocery",
          slug: "grocery",
          description: "Fresh groceries",
          image:
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
          isActive: true,
          sortOrder: 1,
        },
      }),
      prisma.productCategory.create({
        data: {
          name: "Food",
          slug: "food",
          description: "Ready-to-eat",
          image:
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
          isActive: true,
          sortOrder: 2,
        },
      }),
      prisma.productCategory.create({
        data: {
          name: "Medicine",
          slug: "medicine",
          description: "Healthcare",
          image:
            "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop",
          isActive: true,
          sortOrder: 3,
        },
      }),
      prisma.productCategory.create({
        data: {
          name: "Electronics",
          slug: "electronics",
          description: "Gadgets",
          image:
            "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
          isActive: true,
          sortOrder: 4,
        },
      }),
      prisma.productCategory.create({
        data: {
          name: "Fashion",
          slug: "fashion",
          description: "Clothing",
          image:
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
          isActive: true,
          sortOrder: 5,
        },
      }),
      prisma.productCategory.create({
        data: {
          name: "Household",
          slug: "household",
          description: "Home essentials",
          image:
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
          isActive: true,
          sortOrder: 6,
        },
      }),
    ]);

    // Create collections, banners, ads, special offers
    console.log("🏷️ Creating collections, banners, ads, offers (small sample)");
    const [trending, newArrivals] = await Promise.all([
      prisma.collection.create({
        data: {
          name: "Trending Products",
          slug: "trending-products",
          description: "Trending",
          products: [],
          type: "FEATURED_PRODUCTS",
          image: "",
          isActive: true,
          isFeatured: true,
          sortOrder: 1,
        },
      }),
      prisma.collection.create({
        data: {
          name: "New Arrivals",
          slug: "new-arrivals",
          description: "New",
          products: [],
          type: "NEW_ARRIVALS",
          image: "",
          isActive: true,
          isFeatured: true,
          sortOrder: 2,
        },
      }),
    ]);

    await prisma.banner.createMany({
      data: [
        {
          title: "Fresh Groceries",
          imageUrl:
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&h=1080&fit=crop",
          linkUrl: "/categories/grocery",
          sortOrder: 1,
        },
        {
          title: "Electronics & Gadgets",
          imageUrl:
            "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1920&h=1080&fit=crop",
          linkUrl: "/categories/electronics",
          sortOrder: 2,
        },
      ],
    });

    await prisma.advertisement.createMany({
      data: [
        {
          title: "Flash Sale",
          description: "Up to 50% off",
          imageUrl:
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
          linkUrl: "/offers",
          position: "sidebar",
          isActive: true,
          sortOrder: 1,
        },
      ],
    });

    await prisma.specialOffer.createMany({
      data: [
        {
          title: "Weekend Special",
          description: "30% off groceries",
          imageUrl: "",
          discountType: "percentage",
          discountValue: 30,
          linkUrl: "/categories/grocery",
          isActive: true,
          sortOrder: 1,
        },
      ],
    });

    // Create products only for approved stores (not pending applications)
    console.log("📦 Creating products for approved stores (batched)");
    const store1Products = await createProductBatchesForStore(
      stores[0], // Fresh Mart - approved
      400,
      0,
      categories
    );
    const store2Products = await createProductBatchesForStore(
      stores[1], // Mega Mall - approved
      200,
      400,
      categories
    );
    // Note: stores[2] and stores[3] are pending applications, so no products created for them

    console.log(
      `✅ Products created: ${store1Products.length + store2Products.length}`
    );

    // Create sample orders/payments/deliveries for a few items (keeps things small & consistent)
    console.log("📦 Creating a few sample orders/deliveries/payments...");
    const sampleOrders = [];
    const p0 = store1Products[0];
    const p1 = store1Products[1];
    const p2 = store2Products[0];

    const order1 = await prisma.order.create({
      data: {
        orderNumber: `TK${Date.now()}1`,
        customerId: customers[0].id,
        storeId: stores[0].id,
        totalAmount: 100,
        deliveryFee: 20,
        taxAmount: 5,
        finalAmount: 125,
        paymentMethod: "CASH_ON_DELIVERY",
        paymentStatus: "COMPLETED",
        orderStatus: "DELIVERED",
        deliveryAddress: {
          line1: "789 Park Street",
          city: "Hanumangarh",
          state: "Rajasthan",
          pincode: "335512",
        },
        deliveredAt: new Date(),
        orderItems: {
          create: [
            {
              productId: p0.id,
              productSnapshot: { name: p0.name, price: p0.price },
              quantity: 1,
              unitPrice: p0.price,
              subtotal: p0.price,
            },
            {
              productId: p1.id,
              productSnapshot: { name: p1.name, price: p1.price },
              quantity: 1,
              unitPrice: p1.price,
              subtotal: p1.price,
            },
          ],
        },
      },
    });
    sampleOrders.push(order1);

    const delivery1 = await prisma.delivery.create({
      data: {
        orderId: order1.id,
        riderId: riders[0].riderProfile!.id,
        pickupOtp: "1111",
        deliveryOtp: "2222",
        deliveryStatus: "DELIVERED",
        distanceKm: 2.5,
        deliveryFee: 20,
        riderEarnings: 20,
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order1.id,
        amount: order1.finalAmount,
        paymentMethod: "CASH_ON_DELIVERY",
        paymentStatus: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await prisma.review.create({
      data: {
        orderId: order1.id,
        customerId: customers[0].id,
        storeId: stores[0].id,
        riderId: riders[0].riderProfile!.id,
        storeRating: 5,
        riderRating: 5,
        comment: "Great!",
      },
    });

    console.log("✅ Seeder finished successfully!");
    console.log(
      "  Admin credentials: +919876543210 / +919876543211 (admin123)"
    );
    console.log(
      "  Approved store managers: +919876543212 / +919876543213 (manager123)"
    );
    console.log(
      "  Pending store managers: +919876543214 / +919876543215 (manager123)"
    );
    console.log("  Sample customer: +91987654330 (customer123)");
    console.log("  📋 Pending Applications: 2 stores waiting for approval");
  } catch (err) {
    console.error("❌ Seeder error:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Prisma disconnected.");
  }
}

main();

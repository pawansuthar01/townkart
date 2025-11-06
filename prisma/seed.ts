import {
  PrismaClient,
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  DeliveryStatus,
  AddressType,
  NotificationType,
  TransactionType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive database seeding...");

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { phoneNumber: "+919876543210" },
    update: {},
    create: {
      phoneNumber: "+919876543210",
      fullName: "TownKart Admin",
      email: "admin@townkart.com",
      userRoles: [UserRole.ADMIN],
      activeRole: UserRole.ADMIN,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // Create multiple merchants with diverse categories
  const merchants = await Promise.all([
    prisma.user.upsert({
      where: { phoneNumber: "+919876543211" },
      update: {},
      create: {
        phoneNumber: "+919876543211",
        fullName: "Rajesh Kumar",
        email: "rajesh.kumar@townkart.com",
        userRoles: [UserRole.MERCHANT],
        activeRole: UserRole.MERCHANT,
        emailVerified: true,
        phoneVerified: true,
        merchantProfile: {
          create: {
            businessName: "Fresh Mart Grocery",
            description:
              "Your neighborhood grocery store with fresh produce and daily essentials. We source directly from local farmers to ensure quality and freshness.",
            address: "123 MG Road, Bangalore, Karnataka 560001",
            latitude: 12.9716,
            longitude: 77.5946,
            category: "Grocery",
            subcategory: "Supermarket",
            openingHours: "09:00",
            closingHours: "21:00",
            isVerified: true,
            averageRating: 4.5,
            totalOrders: 1250,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { phoneNumber: "+919876543212" },
      update: {},
      create: {
        phoneNumber: "+919876543212",
        fullName: "Priya Sharma",
        email: "priya.sharma@townkart.com",
        userRoles: [UserRole.MERCHANT],
        activeRole: UserRole.MERCHANT,
        emailVerified: true,
        phoneVerified: true,
        merchantProfile: {
          create: {
            businessName: "Healthy Bites Cafe",
            description:
              "Healthy and delicious meals prepared with fresh ingredients. Specializing in salads, smoothies, and nutritious meals.",
            address: "456 Brigade Road, Bangalore, Karnataka 560025",
            latitude: 12.9719,
            longitude: 77.6123,
            category: "Food",
            subcategory: "Cafe",
            openingHours: "08:00",
            closingHours: "22:00",
            isVerified: true,
            averageRating: 4.7,
            totalOrders: 890,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { phoneNumber: "+919876543216" },
      update: {},
      create: {
        phoneNumber: "+919876543216",
        fullName: "Dr. Meera Pharmacy",
        email: "meera.pharmacy@townkart.com",
        userRoles: [UserRole.MERCHANT],
        activeRole: UserRole.MERCHANT,
        emailVerified: true,
        phoneVerified: true,
        merchantProfile: {
          create: {
            businessName: "City Pharmacy",
            description:
              "Licensed pharmacy with 24/7 emergency services. All medicines available with prescription upload facility.",
            address: "789 Residency Road, Bangalore, Karnataka 560025",
            latitude: 12.9724,
            longitude: 77.6131,
            category: "Medicine",
            subcategory: "Pharmacy",
            openingHours: "00:00",
            closingHours: "23:59",
            isVerified: true,
            averageRating: 4.8,
            totalOrders: 650,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { phoneNumber: "+919876543217" },
      update: {},
      create: {
        phoneNumber: "+919876543217",
        fullName: "Rahul Electronics",
        email: "rahul.electronics@townkart.com",
        userRoles: [UserRole.MERCHANT],
        activeRole: UserRole.MERCHANT,
        emailVerified: true,
        phoneVerified: true,
        merchantProfile: {
          create: {
            businessName: "TechHub Electronics",
            description:
              "Latest electronics, smartphones, and gadgets with warranty and free installation services.",
            address: "321 Commercial Street, Bangalore, Karnataka 560001",
            latitude: 12.9709,
            longitude: 77.5933,
            category: "Electronics",
            subcategory: "Gadgets",
            openingHours: "10:00",
            closingHours: "20:00",
            isVerified: true,
            averageRating: 4.6,
            totalOrders: 420,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { phoneNumber: "+919876543218" },
      update: {},
      create: {
        phoneNumber: "+919876543218",
        fullName: "Sneha Fashion",
        email: "sneha.fashion@townkart.com",
        userRoles: [UserRole.MERCHANT],
        activeRole: UserRole.MERCHANT,
        emailVerified: true,
        phoneVerified: true,
        merchantProfile: {
          create: {
            businessName: "StyleHub Fashion",
            description:
              "Trendy fashion and lifestyle products. Free shipping on orders above ₹999.",
            address: "654 Mall Road, Bangalore, Karnataka 560001",
            latitude: 12.9721,
            longitude: 77.5942,
            category: "Fashion",
            subcategory: "Clothing",
            openingHours: "11:00",
            closingHours: "21:00",
            isVerified: true,
            averageRating: 4.4,
            totalOrders: 780,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { phoneNumber: "+919876543219" },
      update: {},
      create: {
        phoneNumber: "+919876543219",
        fullName: "Vikram Home",
        email: "vikram.home@townkart.com",
        userRoles: [UserRole.MERCHANT],
        activeRole: UserRole.MERCHANT,
        emailVerified: true,
        phoneVerified: true,
        merchantProfile: {
          create: {
            businessName: "Home Essentials",
            description:
              "Home and kitchen essentials, furniture, and decor items for modern living.",
            address: "987 Industrial Area, Bangalore, Karnataka 560001",
            latitude: 12.9711,
            longitude: 77.5955,
            category: "Household",
            subcategory: "Home Decor",
            openingHours: "09:00",
            closingHours: "19:00",
            isVerified: true,
            averageRating: 4.3,
            totalOrders: 320,
          },
        },
      },
    }),
  ]);

  // Create multiple riders
  const riders = await Promise.all([
    prisma.user.upsert({
      where: { phoneNumber: "+919876543213" },
      update: {},
      create: {
        phoneNumber: "+919876543213",
        fullName: "Amit Singh",
        email: "amit.singh@townkart.com",
        userRoles: [UserRole.RIDER],
        activeRole: UserRole.RIDER,
        emailVerified: true,
        phoneVerified: true,
        riderProfile: {
          create: {
            vehicleType: "bike",
            vehicleNumber: "KA01AB1234",
            licenseNumber: "DL123456789",
            isAvailable: true,
            currentLat: 12.9716,
            currentLng: 77.5946,
            rating: 4.8,
            totalDeliveries: 150,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { phoneNumber: "+919876543214" },
      update: {},
      create: {
        phoneNumber: "+919876543214",
        fullName: "Sneha Patel",
        email: "sneha.patel@townkart.com",
        userRoles: [UserRole.RIDER],
        activeRole: UserRole.RIDER,
        emailVerified: true,
        phoneVerified: true,
        riderProfile: {
          create: {
            vehicleType: "scooter",
            vehicleNumber: "KA02CD5678",
            licenseNumber: "DL987654321",
            isAvailable: true,
            currentLat: 12.9719,
            currentLng: 77.6123,
            rating: 4.9,
            totalDeliveries: 200,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { phoneNumber: "+919876543220" },
      update: {},
      create: {
        phoneNumber: "+919876543220",
        fullName: "Karan Joshi",
        email: "karan.joshi@townkart.com",
        userRoles: [UserRole.RIDER],
        activeRole: UserRole.RIDER,
        emailVerified: true,
        phoneVerified: true,
        riderProfile: {
          create: {
            vehicleType: "bike",
            vehicleNumber: "KA03EF9012",
            licenseNumber: "DL456789123",
            isAvailable: true,
            currentLat: 12.9724,
            currentLng: 77.6131,
            rating: 4.7,
            totalDeliveries: 180,
          },
        },
      },
    }),
  ]);

  // Create multiple customers with addresses
  const customers = await Promise.all([
    prisma.user.upsert({
      where: { phoneNumber: "+919876543215" },
      update: {},
      create: {
        phoneNumber: "+919876543215",
        fullName: "Arun Kumar",
        email: "arun.kumar@email.com",
        userRoles: [UserRole.CUSTOMER],
        activeRole: UserRole.CUSTOMER,
        emailVerified: true,
        phoneVerified: true,
        customerProfile: {
          create: {},
        },
        addresses: {
          create: [
            {
              line1: "789 Park Street, Richmond Town",
              city: "Bangalore",
              state: "Karnataka",
              pincode: "560025",
              latitude: 12.9716,
              longitude: 77.5946,
              addressType: AddressType.HOME,
              isDefault: true,
            },
            {
              line1: "456 Brigade Towers, Brigade Road",
              city: "Bangalore",
              state: "Karnataka",
              pincode: "560025",
              latitude: 12.9719,
              longitude: 77.6123,
              addressType: AddressType.WORK,
              isDefault: false,
            },
          ],
        },
      },
    }),
    prisma.user.upsert({
      where: { phoneNumber: "+919876543221" },
      update: {},
      create: {
        phoneNumber: "+919876543221",
        fullName: "Priya Singh",
        email: "priya.singh@email.com",
        userRoles: [UserRole.CUSTOMER],
        activeRole: UserRole.CUSTOMER,
        emailVerified: true,
        phoneVerified: true,
        customerProfile: {
          create: {},
        },
        addresses: {
          create: [
            {
              line1: "321 MG Road, Near Trinity Circle",
              city: "Bangalore",
              state: "Karnataka",
              pincode: "560001",
              latitude: 12.9721,
              longitude: 77.5942,
              addressType: AddressType.HOME,
              isDefault: true,
            },
          ],
        },
      },
    }),
    prisma.user.upsert({
      where: { phoneNumber: "+919876543222" },
      update: {},
      create: {
        phoneNumber: "+919876543222",
        fullName: "Rohit Sharma",
        email: "rohit.sharma@email.com",
        userRoles: [UserRole.CUSTOMER],
        activeRole: UserRole.CUSTOMER,
        emailVerified: true,
        phoneVerified: true,
        customerProfile: {
          create: {},
        },
        addresses: {
          create: [
            {
              line1: "654 Residency Road, Opposite Bowring Hospital",
              city: "Bangalore",
              state: "Karnataka",
              pincode: "560025",
              latitude: 12.9724,
              longitude: 77.6131,
              addressType: AddressType.HOME,
              isDefault: true,
            },
          ],
        },
      },
    }),
  ]);

  // Create comprehensive products for each merchant
  const products = [];

  // Grocery products
  const groceryProducts = await Promise.all([
    prisma.product.upsert({
      where: { id: "prod-grocery-1" },
      update: {},
      create: {
        id: "prod-grocery-1",
        merchantId: merchants[0].merchantProfile!.id,
        name: "Fresh Organic Tomatoes",
        description:
          "Premium organic red tomatoes, 1kg pack. Grown without pesticides.",
        price: 40.0,
        discountedPrice: 35.0,
        stockQuantity: 50,
        category: "Vegetables",
        subcategory: "Fresh Produce",
        images: [
          "https://images.unsplash.com/photo-1546470427-e9e826abd807?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-grocery-2" },
      update: {},
      create: {
        id: "prod-grocery-2",
        merchantId: merchants[0].merchantProfile!.id,
        name: "Whole Wheat Bread",
        description: "Freshly baked whole wheat bread, 400g. No preservatives.",
        price: 35.0,
        stockQuantity: 30,
        category: "Bakery",
        subcategory: "Bread",
        images: [
          "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-grocery-3" },
      update: {},
      create: {
        id: "prod-grocery-3",
        merchantId: merchants[0].merchantProfile!.id,
        name: "Organic Milk 1L",
        description: "Fresh organic cow milk, pasteurized and homogenized.",
        price: 65.0,
        stockQuantity: 25,
        category: "Dairy",
        subcategory: "Milk",
        images: [
          "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-grocery-4" },
      update: {},
      create: {
        id: "prod-grocery-4",
        merchantId: merchants[0].merchantProfile!.id,
        name: "Premium Basmati Rice 5kg",
        description: "Long grain basmati rice, aged for perfect cooking.",
        price: 450.0,
        discountedPrice: 420.0,
        stockQuantity: 15,
        category: "Grains",
        subcategory: "Rice",
        images: [
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
  ]);

  // Food products
  const foodProducts = await Promise.all([
    prisma.product.upsert({
      where: { id: "prod-food-1" },
      update: {},
      create: {
        id: "prod-food-1",
        merchantId: merchants[1].merchantProfile!.id,
        name: "Grilled Chicken Salad",
        description:
          "Healthy grilled chicken salad with mixed greens, cherry tomatoes, and balsamic dressing.",
        price: 180.0,
        stockQuantity: 20,
        category: "Food",
        subcategory: "Salads",
        images: [
          "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-food-2" },
      update: {},
      create: {
        id: "prod-food-2",
        merchantId: merchants[1].merchantProfile!.id,
        name: "Quinoa Buddha Bowl",
        description:
          "Nutritious bowl with quinoa, roasted vegetables, avocado, and tahini dressing.",
        price: 220.0,
        stockQuantity: 15,
        category: "Food",
        subcategory: "Healthy Bowls",
        images: [
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-food-3" },
      update: {},
      create: {
        id: "prod-food-3",
        merchantId: merchants[1].merchantProfile!.id,
        name: "Green Smoothie Bowl",
        description:
          "Refreshing smoothie bowl with spinach, banana, almond milk, and topped with granola.",
        price: 150.0,
        stockQuantity: 18,
        category: "Food",
        subcategory: "Smoothies",
        images: [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
  ]);

  // Medicine products
  const medicineProducts = await Promise.all([
    prisma.product.upsert({
      where: { id: "prod-medicine-1" },
      update: {},
      create: {
        id: "prod-medicine-1",
        merchantId: merchants[2].merchantProfile!.id,
        name: "Paracetamol Tablets 500mg",
        description: "Pain relief and fever reducer. 10 tablets per strip.",
        price: 25.0,
        stockQuantity: 100,
        category: "Medicine",
        subcategory: "Pain Relief",
        images: [
          "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-medicine-2" },
      update: {},
      create: {
        id: "prod-medicine-2",
        merchantId: merchants[2].merchantProfile!.id,
        name: "Vitamin D3 Supplements",
        description:
          "60 capsules, 1000 IU each. Supports bone health and immunity.",
        price: 450.0,
        discountedPrice: 400.0,
        stockQuantity: 30,
        category: "Medicine",
        subcategory: "Supplements",
        images: [
          "https://images.unsplash.com/photo-1550572017-edd951aa8ca9?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
  ]);

  // Electronics products
  const electronicsProducts = await Promise.all([
    prisma.product.upsert({
      where: { id: "prod-electronics-1" },
      update: {},
      create: {
        id: "prod-electronics-1",
        merchantId: merchants[3].merchantProfile!.id,
        name: "Wireless Bluetooth Headphones",
        description:
          "Premium wireless headphones with noise cancellation and 30-hour battery life.",
        price: 2499.0,
        discountedPrice: 2199.0,
        stockQuantity: 12,
        category: "Electronics",
        subcategory: "Audio",
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-electronics-2" },
      update: {},
      create: {
        id: "prod-electronics-2",
        merchantId: merchants[3].merchantProfile!.id,
        name: "Smart Fitness Watch",
        description:
          "Track your fitness with heart rate monitoring, GPS, and 7-day battery life.",
        price: 5999.0,
        discountedPrice: 5499.0,
        stockQuantity: 8,
        category: "Electronics",
        subcategory: "Wearables",
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
  ]);

  // Fashion products
  const fashionProducts = await Promise.all([
    prisma.product.upsert({
      where: { id: "prod-fashion-1" },
      update: {},
      create: {
        id: "prod-fashion-1",
        merchantId: merchants[4].merchantProfile!.id,
        name: "Cotton Summer Dress",
        description:
          "Light and comfortable cotton dress, perfect for summer. Available in multiple colors.",
        price: 1299.0,
        discountedPrice: 999.0,
        stockQuantity: 15,
        category: "Fashion",
        subcategory: "Dresses",
        images: [
          "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-fashion-2" },
      update: {},
      create: {
        id: "prod-fashion-2",
        merchantId: merchants[4].merchantProfile!.id,
        name: "Running Shoes",
        description:
          "Comfortable running shoes with advanced cushioning and breathable material.",
        price: 2999.0,
        discountedPrice: 2499.0,
        stockQuantity: 20,
        category: "Fashion",
        subcategory: "Footwear",
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
  ]);

  // Household products
  const householdProducts = await Promise.all([
    prisma.product.upsert({
      where: { id: "prod-household-1" },
      update: {},
      create: {
        id: "prod-household-1",
        merchantId: merchants[5].merchantProfile!.id,
        name: "LED Desk Lamp",
        description:
          "Modern LED desk lamp with adjustable brightness and USB charging port.",
        price: 1299.0,
        discountedPrice: 1099.0,
        stockQuantity: 25,
        category: "Household",
        subcategory: "Lighting",
        images: [
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
    prisma.product.upsert({
      where: { id: "prod-household-2" },
      update: {},
      create: {
        id: "prod-household-2",
        merchantId: merchants[5].merchantProfile!.id,
        name: "Yoga Mat Premium",
        description:
          "Non-slip yoga mat with carrying strap, perfect for home workouts.",
        price: 899.0,
        stockQuantity: 30,
        category: "Household",
        subcategory: "Fitness",
        images: [
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop",
        ],
        isAvailable: true,
      },
    }),
  ]);

  // Combine all products
  products.push(
    ...groceryProducts,
    ...foodProducts,
    ...medicineProducts,
    ...electronicsProducts,
    ...fashionProducts,
    ...householdProducts,
  );

  // Create sample orders with different statuses
  const orders = await Promise.all([
    // Order 1: Delivered
    prisma.order.upsert({
      where: { id: "order-1" },
      update: {},
      create: {
        id: "order-1",
        orderNumber: "TK2024001",
        customerId: customers[0].id,
        merchantId: merchants[0].merchantProfile!.id,
        totalAmount: 75.0,
        deliveryFee: 20.0,
        taxAmount: 7.5,
        finalAmount: 102.5,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        paymentStatus: PaymentStatus.COMPLETED,
        orderStatus: OrderStatus.DELIVERED,
        deliveryAddress: {
          line1: "789 Park Street, Richmond Town",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560025",
        },
        deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        orderItems: {
          create: [
            {
              productId: groceryProducts[0].id,
              productSnapshot: {
                name: groceryProducts[0].name,
                price: groceryProducts[0].price,
                description: groceryProducts[0].description,
              },
              quantity: 1,
              unitPrice: 40.0,
              subtotal: 40.0,
            },
            {
              productId: groceryProducts[1].id,
              productSnapshot: {
                name: groceryProducts[1].name,
                price: groceryProducts[1].price,
                description: groceryProducts[1].description,
              },
              quantity: 1,
              unitPrice: 35.0,
              subtotal: 35.0,
            },
          ],
        },
      },
    }),
    // Order 2: In Progress
    prisma.order.upsert({
      where: { id: "order-2" },
      update: {},
      create: {
        id: "order-2",
        orderNumber: "TK2024002",
        customerId: customers[1].id,
        merchantId: merchants[1].merchantProfile!.id,
        totalAmount: 180.0,
        deliveryFee: 20.0,
        taxAmount: 18.0,
        finalAmount: 218.0,
        paymentMethod: PaymentMethod.UPI,
        paymentStatus: PaymentStatus.COMPLETED,
        orderStatus: OrderStatus.OUT_FOR_DELIVERY,
        deliveryAddress: {
          line1: "321 MG Road, Near Trinity Circle",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560001",
        },
        orderItems: {
          create: [
            {
              productId: foodProducts[0].id,
              productSnapshot: {
                name: foodProducts[0].name,
                price: foodProducts[0].price,
                description: foodProducts[0].description,
              },
              quantity: 1,
              unitPrice: 180.0,
              subtotal: 180.0,
            },
          ],
        },
      },
    }),
    // Order 3: Preparing
    prisma.order.upsert({
      where: { id: "order-3" },
      update: {},
      create: {
        id: "order-3",
        orderNumber: "TK2024003",
        customerId: customers[2].id,
        merchantId: merchants[2].merchantProfile!.id,
        totalAmount: 25.0,
        deliveryFee: 20.0,
        taxAmount: 2.5,
        finalAmount: 47.5,
        paymentMethod: PaymentMethod.CARD,
        paymentStatus: PaymentStatus.COMPLETED,
        orderStatus: OrderStatus.PREPARING,
        deliveryAddress: {
          line1: "654 Residency Road, Opposite Bowring Hospital",
          city: "Bangalore",
          state: "Karnataka",
          pincode: "560025",
        },
        orderItems: {
          create: [
            {
              productId: medicineProducts[0].id,
              productSnapshot: {
                name: medicineProducts[0].name,
                price: medicineProducts[0].price,
                description: medicineProducts[0].description,
              },
              quantity: 1,
              unitPrice: 25.0,
              subtotal: 25.0,
            },
          ],
        },
      },
    }),
  ]);

  // Create deliveries for orders
  await Promise.all([
    prisma.delivery.upsert({
      where: { orderId: orders[0].id },
      update: {},
      create: {
        orderId: orders[0].id,
        riderId: riders[0].riderProfile!.id,
        pickupTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
        deliveryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        pickupOtp: "1234",
        deliveryOtp: "5678",
        deliveryStatus: DeliveryStatus.DELIVERED,
        distanceKm: 2.5,
        deliveryFee: 20.0,
      },
    }),
    prisma.delivery.upsert({
      where: { orderId: orders[1].id },
      update: {},
      create: {
        orderId: orders[1].id,
        riderId: riders[1].riderProfile!.id,
        pickupTime: new Date(Date.now() - 30 * 60 * 1000),
        pickupOtp: "9876",
        deliveryOtp: "5432",
        deliveryStatus: DeliveryStatus.OUT_FOR_DELIVERY,
        distanceKm: 1.8,
        deliveryFee: 20.0,
      },
    }),
    prisma.delivery.upsert({
      where: { orderId: orders[2].id },
      update: {},
      create: {
        orderId: orders[2].id,
        riderId: riders[2].riderProfile!.id,
        pickupOtp: "2468",
        deliveryOtp: "1357",
        deliveryStatus: DeliveryStatus.ASSIGNED,
        distanceKm: 3.2,
        deliveryFee: 20.0,
      },
    }),
  ]);

  // Create payments for orders
  await Promise.all([
    prisma.payment.upsert({
      where: { orderId: orders[0].id },
      update: {},
      create: {
        orderId: orders[0].id,
        amount: 102.5,
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        paymentStatus: PaymentStatus.COMPLETED,
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.upsert({
      where: { orderId: orders[1].id },
      update: {},
      create: {
        orderId: orders[1].id,
        amount: 218.0,
        paymentMethod: PaymentMethod.UPI,
        transactionId: "UPI123456789",
        paymentStatus: PaymentStatus.COMPLETED,
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.upsert({
      where: { orderId: orders[2].id },
      update: {},
      create: {
        orderId: orders[2].id,
        amount: 47.5,
        paymentMethod: PaymentMethod.CARD,
        transactionId: "CARD987654321",
        paymentStatus: PaymentStatus.COMPLETED,
        completedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    }),
  ]);

  // Create reviews for completed orders
  await prisma.review.upsert({
    where: { orderId: orders[0].id },
    update: {},
    create: {
      orderId: orders[0].id,
      customerId: customers[0].id,
      merchantId: merchants[0].merchantProfile!.id,
      riderId: riders[0].riderProfile!.id,
      merchantRating: 5,
      riderRating: 5,
      comment: "Excellent service! Fresh products and quick delivery.",
    },
  });

  // Create wallets for merchants and riders
  await Promise.all([
    prisma.wallet.upsert({
      where: { userId: merchants[0].id },
      update: {},
      create: {
        userId: merchants[0].id,
        userType: "merchant",
        currentBalance: 5000.0,
        totalEarned: 5000.0,
      },
    }),
    prisma.wallet.upsert({
      where: { userId: merchants[1].id },
      update: {},
      create: {
        userId: merchants[1].id,
        userType: "merchant",
        currentBalance: 3200.0,
        totalEarned: 3200.0,
      },
    }),
    prisma.wallet.upsert({
      where: { userId: riders[0].id },
      update: {},
      create: {
        userId: riders[0].id,
        userType: "rider",
        currentBalance: 2500.0,
        totalEarned: 2500.0,
      },
    }),
    prisma.wallet.upsert({
      where: { userId: riders[1].id },
      update: {},
      create: {
        userId: riders[1].id,
        userType: "rider",
        currentBalance: 1800.0,
        totalEarned: 1800.0,
      },
    }),
  ]);

  // Create wallet transactions
  await Promise.all([
    prisma.walletTransaction.create({
      data: {
        walletId: merchants[0].wallet!.id,
        orderId: orders[0].id,
        amount: 75.0,
        transactionType: TransactionType.CREDIT,
        description: "Commission from order TK2024001",
        balanceAfter: 5000.0,
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: riders[0].wallet!.id,
        orderId: orders[0].id,
        amount: 20.0,
        transactionType: TransactionType.CREDIT,
        description: "Delivery fee from order TK2024001",
        balanceAfter: 2500.0,
      },
    }),
  ]);

  // Create notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: customers[0].id,
        title: "Order Delivered",
        message: "Your order TK2024001 has been delivered successfully!",
        notificationType: NotificationType.ORDER_DELIVERED,
        referenceId: orders[0].id,
        priority: "high",
      },
    }),
    prisma.notification.create({
      data: {
        userId: customers[1].id,
        title: "Order Out for Delivery",
        message: "Your order TK2024002 is out for delivery. Track it live!",
        notificationType: NotificationType.DELIVERY_OUT,
        referenceId: orders[1].id,
        priority: "medium",
      },
    }),
    prisma.notification.create({
      data: {
        userId: merchants[0].merchantProfile!.id,
        title: "New Order",
        message: "You have received a new order TK2024001",
        notificationType: NotificationType.ORDER_CREATED,
        referenceId: orders[0].id,
        priority: "high",
      },
    }),
  ]);

  console.log("✅ Comprehensive database seeding completed successfully!");
  console.log("📊 Created sample data:");
  console.log(`   - ${adminUser.fullName} (Admin)`);
  console.log(
    `   - ${merchants.length} merchants across ${new Set(merchants.map((m) => m.merchantProfile?.category)).size} categories`,
  );
  console.log(`   - ${riders.length} delivery riders`);
  console.log(`   - ${customers.length} customers with addresses`);
  console.log(`   - ${products.length} products across all categories`);
  console.log(`   - ${orders.length} orders with different statuses`);
  console.log(`   - Complete delivery, payment, and review data`);
  console.log(`   - Wallet transactions and notifications`);
  console.log("");
  console.log("🎯 Ready for testing all features!");
  console.log("   - Customer: +919876543215 (Arun Kumar)");
  console.log("   - Merchant: +919876543211 (Rajesh Kumar)");
  console.log("   - Rider: +919876543213 (Amit Singh)");
  console.log("   - Admin: +919876543210 (TownKart Admin)");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

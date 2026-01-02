import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  generateOrderNumber,
  calculateOrderSummary,
} from "@/lib/orderManagement";
import { prisma } from "@/lib/prisma";
import { findStoreForOrder } from "@/lib/storeAssignment";
import { predictDestinationType } from "@/lib/destinationAnalytics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.orderStatus = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              email: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrls: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      items,
      address,
      paymentMethod,
      deliveryCharge = 0,
      discount = 0,
      specialInstructions,
    } = body;

    // Basic validation
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "Delivery address is required" },
        { status: 400 }
      );
    }

    if (
      !address.fullName ||
      !address.phoneNumber ||
      !address.addressLine1 ||
      !address.city ||
      !address.state ||
      !address.pincode
    ) {
      return NextResponse.json(
        { error: "Complete delivery address is required" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    // Validate that all products exist
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products not found" },
        { status: 400 }
      );
    }

    // Calculate order summary
    const summary = calculateOrderSummary(
      items,
      deliveryCharge,
      0.05, // 5% tax rate
      discount
    );

    // Validate customer location and find nearest store first
    const customerLocation = {
      latitude: address.latitude || 0,
      longitude: address.longitude || 0,
    };

    const assignmentResult = await findStoreForOrder(customerLocation);

    // Predict destination type for analytics
    let destinationPrediction = null;
    try {
      destinationPrediction = await predictDestinationType(
        {
          id: "temp", // Not needed for prediction
          latitude: address.latitude,
          longitude: address.longitude,
          line1: address.addressLine1,
          city: address.city,
          state: address.state,
        },
        customerId
      );
      console.log(
        `Destination prediction for order: ${destinationPrediction.predictedType} (${destinationPrediction.confidence}%)`
      );
    } catch (error) {
      console.error("Failed to predict destination type:", error);
      // Continue with order creation even if prediction fails
    }

    if (!assignmentResult) {
      return NextResponse.json(
        {
          error: "Service not available in your area",
          message:
            "We're currently expanding our services. Service will be available in your location soon!",
          type: "SERVICE_AREA_UNAVAILABLE",
        },
        { status: 400 }
      );
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Create order with valid store assignment
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        storeId: assignmentResult.storeId, // Use valid store ID
        totalAmount: summary.total,
        deliveryFee: summary.deliveryCharge,
        taxAmount: summary.tax,
        discountAmount: summary.discount,
        finalAmount: summary.total,
        paymentMethod,
        paymentStatus:
          paymentMethod === "CASH_ON_DELIVERY" ? "PENDING" : "COMPLETED",
        orderStatus: "STORE_ASSIGNED", // Start with STORE_ASSIGNED status
        deliveryAddress: address, // Store address as JSON
        specialInstructions,
        storeAssignedAt: new Date(), // Set assignment timestamp
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: 0,
            taxAmount: item.unitPrice * item.quantity * 0.05, // 5% tax
            subtotal: item.totalPrice,
            productSnapshot: {
              id: item.productId,
              name: item.productName || "Product",
              price: item.unitPrice,
              description: item.description || "",
            },
          })),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrls: true,
              },
            },
          },
        },
      },
    });

    // Update store order count
    await prisma.store.update({
      where: { id: assignmentResult.storeId },
      data: {
        totalOrders: {
          increment: 1,
        },
      },
    });

    // Create order status history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: null,
        newStatus: "STORE_ASSIGNED",
        changedBy: null, // System
        changeType: "system",
        notes: `Order automatically assigned to store: ${assignmentResult.storeName}`,
        metadata: {
          storeId: assignmentResult.storeId,
          distance: assignmentResult.distance,
          estimatedDeliveryTime: assignmentResult.estimatedDeliveryTime,
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

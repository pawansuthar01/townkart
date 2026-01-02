import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.orderId;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get order with delivery information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        delivery: {
          include: {
            rider: {
              select: {
                id: true,
                vehicleType: true,
                vehicleNumber: true,
                rating: true,
                currentLat: true,
                currentLng: true,
                lastLocationUpdate: true,
                user: {
                  select: {
                    phoneNumber: true,
                    profileImageUrl: true,
                    fullName: true,
                  },
                },
              },
            },
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user has permission to view this order
    const isCustomer = order.customerId === session.user.id;
    const isStoreManager =
      order.storeId === (session.user as any).storeId &&
      (session.user as any).activeRole === "STORE_MANAGER";
    const isAdmin = (session.user as any).activeRole === "ADMIN";
    const isRider =
      (order as any).delivery?.riderId === (session.user as any).riderId;

    if (!isCustomer && !isStoreManager && !isAdmin && !isRider) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!order.delivery) {
      return NextResponse.json(
        { error: "No delivery information available for this order" },
        { status: 404 }
      );
    }

    // Get rider location history for route
    const riderLocations = order.delivery.riderId
      ? await prisma.riderLocation.findMany({
          where: {
            riderId: order.delivery.riderId,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 100, // Limit to prevent too much data
        })
      : [];

    // Calculate distance remaining and time remaining
    let distanceRemaining = 0;
    let timeRemaining = 0;

    if (
      order.delivery.deliveryStatus !== "DELIVERED" &&
      order.delivery.deliveryStatus !== "CANCELLED"
    ) {
      if (
        order.delivery.rider?.currentLat &&
        order.delivery.rider?.currentLng
      ) {
        // Calculate distance from rider to customer
        const deliveryAddress = order.deliveryAddress as any;
        const distance = calculateDistance(
          order.delivery.rider.currentLat,
          order.delivery.rider.currentLng,
          deliveryAddress?.latitude || order.customerLat || 0,
          deliveryAddress?.longitude || order.customerLng || 0
        );
        distanceRemaining = distance;

        // Estimate time based on distance (assuming 25 km/h average speed)
        timeRemaining = Math.ceil((distance / 25) * 60); // minutes
      }
    }

    // Build delivery tracking data
    const deliveryData = {
      delivery: {
        id: order.delivery.id,
        orderId: order.id,
        riderId: order.delivery.riderId,
        status: order.delivery.deliveryStatus.toLowerCase(),
        statusMessage: getStatusMessage(order.delivery.deliveryStatus),
        estimatedDeliveryTime: order.delivery.estimatedDeliveryTime,
        actualDeliveryTime: order.delivery.deliveryTime,
        currentLocation:
          order.delivery.rider?.currentLat && order.delivery.rider?.currentLng
            ? {
                latitude: order.delivery.rider.currentLat,
                longitude: order.delivery.rider.currentLng,
                timestamp: order.delivery.rider.lastLocationUpdate,
                accuracy: null,
                speed: null,
              }
            : null,
        route: riderLocations.map((loc) => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: loc.createdAt,
          accuracy: loc.accuracy,
          speed: loc.speed,
        })),
        distanceRemaining,
        timeRemaining,
        lastUpdated: order.delivery.updatedAt,
      },
      rider: order.delivery.rider
        ? {
            id: order.delivery.rider.id,
            name: order.delivery.rider.user.fullName,
            phone: order.delivery.rider.user.phoneNumber || "",
            vehicleType: order.delivery.rider.vehicleType || "Bike",
            vehicleNumber: order.delivery.rider.vehicleNumber || "",
            rating: order.delivery.rider.rating || 0,
            photo: order.delivery.rider.user.profileImageUrl,
          }
        : null,
      customer: {
        id: order.customer.id,
        name: order.customer.fullName,
        phone: order.customer.phoneNumber || "",
        address: {
          latitude: order.customerLat || 0,
          longitude: order.customerLng || 0,
          fullAddress: (order.deliveryAddress as any)?.fullAddress || "",
        },
      },
      shop: {
        id: order.store.id,
        name: order.store.name,
        address: {
          latitude: order.store.latitude || 0,
          longitude: order.store.longitude || 0,
          fullAddress: order.store.address || "",
        },
      },
    };

    return NextResponse.json(deliveryData);
  } catch (error) {
    console.error("Error fetching delivery tracking:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery tracking data" },
      { status: 500 }
    );
  }
}

// Helper functions
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    ASSIGNED: "Rider has been assigned to your delivery",
    PICKED_UP: "Rider has picked up your order",
    OUT_FOR_DELIVERY: "Your order is on the way",
    DELIVERED: "Your order has been delivered successfully",
    CANCELLED: "Delivery has been cancelled",
    FAILED: "Delivery failed",
  };
  return messages[status] || `Order status: ${status}`;
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

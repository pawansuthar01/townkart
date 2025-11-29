import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export async function assignDeliveryToOrder(orderId: string): Promise<boolean> {
  try {
    // Get order with delivery info and store details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
        store: true, // Use store instead of merchant
      },
    });

    if (!order || !order.delivery) {
      console.error(`No delivery found for order ${orderId}`);
      return false;
    }

    // Get store location
    let storeLat: number;
    let storeLng: number;
    let storeCity: string;

    if (order.store) {
      storeLat = order.store.latitude;
      storeLng = order.store.longitude;
      storeCity = order.store.city;
    } else {
      console.error(`Store location not available for order ${orderId}`);
      return false;
    }

    if (!storeLat || !storeLng) {
      console.error(`Store location not available for order ${orderId}`);
      return false;
    }

    // Find available riders assigned to this store
    const storeRiderAssignments = await prisma.riderStoreAssignment.findMany({
      where: {
        storeId: order.storeId, // Use storeId instead of merchantId
        status: "ACTIVE", // Only active assignments
        rider: {
          isAvailable: true,
          isActive: true,
          isVerified: true,
          maxDailyDeliveries: {
            gt: 0, // Has capacity
          },
        },
      },
      include: {
        rider: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    // Extract riders from assignments
    const availableRiders = storeRiderAssignments.map(
      (assignment) => assignment.rider,
    );

    if (availableRiders.length === 0) {
      console.log(`No available riders for order ${orderId}`);
      return false;
    }

    // Sort riders by distance from store
    const sortedRiders = availableRiders
      .map((rider) => ({
        ...rider,
        distance: calculateDistance(
          storeLat,
          storeLng,
          rider.currentLat || 0,
          rider.currentLng || 0,
        ),
      }))
      .filter((rider) => rider.distance <= 5) // Within 5km of store
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Take top 5 closest riders

    // Try to assign to each rider in order
    for (const rider of sortedRiders) {
      try {
        const success = await assignDeliveryToRider(
          order.delivery.id,
          rider.id,
        );
        if (success) {
          console.log(
            `Assigned delivery ${order.delivery.id} to rider ${rider.id}`,
          );
          return true;
        }
      } catch (error) {
        console.error(`Failed to assign to rider ${rider.id}:`, error);
        continue;
      }
    }

    console.log(`No riders accepted delivery ${order.delivery.id}`);
    return false;
  } catch (error) {
    console.error(`Error assigning delivery for order ${orderId}:`, error);
    return false;
  }
}

export async function assignDeliveryToRider(
  deliveryId: string,
  riderId: string,
): Promise<boolean> {
  // Use database transaction for atomic assignment
  return await prisma.$transaction(async (tx) => {
    // Check if delivery is still unassigned
    const delivery = await tx.delivery.findUnique({
      where: { id: deliveryId },
      select: { riderId: true, deliveryStatus: true },
    });

    if (!delivery || delivery.riderId !== null) {
      return false; // Already assigned
    }

    // Check rider availability and capacity
    const rider = await tx.riderProfile.findUnique({
      where: { id: riderId },
      select: {
        isAvailable: true,
        isActive: true,
        maxDailyDeliveries: true,
      },
    });

    if (!rider || !rider.isAvailable || !rider.isActive) {
      return false;
    }

    // Create assignment lock (30 seconds)
    const lockExpiry = new Date(Date.now() + 30 * 1000);

    // Update delivery with rider assignment
    await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        riderId,
        deliveryStatus: "ASSIGNED",
        assignmentLocked: true,
        assignmentLockExpiresAt: lockExpiry,
        updatedAt: new Date(),
      },
    });

    // Update rider capacity (decrement available slots)
    await tx.riderProfile.update({
      where: { id: riderId },
      data: {
        maxDailyDeliveries: {
          decrement: 1,
        },
      },
    });

    // Create delivery log
    await tx.deliveryLog.create({
      data: {
        deliveryId,
        eventType: "assignment",
        description: `Delivery assigned to rider ${riderId}`,
        actorId: riderId,
        actorType: "rider",
        metadata: {
          assignmentType: "auto",
          lockExpiry: lockExpiry.toISOString(),
        },
      },
    });

    return true;
  });
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// Function to release assignment lock after timeout
export async function releaseExpiredAssignmentLocks(): Promise<void> {
  try {
    const now = new Date();

    const expiredDeliveries = await prisma.delivery.findMany({
      where: {
        assignmentLocked: true,
        assignmentLockExpiresAt: {
          lt: now,
        },
      },
    });

    for (const delivery of expiredDeliveries) {
      await prisma.$transaction(async (tx) => {
        // Release the lock
        await tx.delivery.update({
          where: { id: delivery.id },
          data: {
            assignmentLocked: false,
            assignmentLockExpiresAt: null,
            riderId: null, // Remove assignment
            deliveryStatus: "ASSIGNED", // Reset to unassigned
          },
        });

        // Restore rider capacity if rider was assigned
        if (delivery.riderId) {
          await tx.riderProfile.update({
            where: { id: delivery.riderId },
            data: {
              maxDailyDeliveries: {
                increment: 1,
              },
            },
          });
        }

        // Log the release
        await tx.deliveryLog.create({
          data: {
            deliveryId: delivery.id,
            eventType: "assignment_expired",
            description:
              "Assignment lock expired, delivery released for reassignment",
            actorType: "system",
          },
        });
      });
    }

    if (expiredDeliveries.length > 0) {
      console.log(
        `Released ${expiredDeliveries.length} expired assignment locks`,
      );
    }
  } catch (error) {
    console.error("Error releasing expired assignment locks:", error);
  }
}

// Send delivery offers to available riders
export async function sendDeliveryOffersToRiders(
  orderId: string,
): Promise<boolean> {
  try {
    // Get order with store details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
        store: true, // Use store instead of merchant
      },
    });

    if (!order || !order.delivery) {
      console.error(`No delivery found for order ${orderId}`);
      return false;
    }

    // Get store location
    let storeLat: number;
    let storeLng: number;
    let storeName: string;

    if (order.store) {
      storeLat = order.store.latitude;
      storeLng = order.store.longitude;
      storeName = order.store.name;
    } else {
      console.error(`Store location not available for order ${orderId}`);
      return false;
    }

    // Find available riders assigned to this store
    const storeRiderAssignments = await prisma.riderStoreAssignment.findMany({
      where: {
        storeId: order.storeId,
        status: "ACTIVE",
        rider: {
          isAvailable: true,
          isActive: true,
          isVerified: true,
          maxDailyDeliveries: {
            gt: 0, // Has capacity
          },
        },
      },
      include: {
        rider: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    // Extract riders from assignments
    const availableRiders = storeRiderAssignments.map(
      (assignment) => assignment.rider,
    );

    if (availableRiders.length === 0) {
      console.log(
        `No available riders for delivery offers on order ${orderId}`,
      );
      return false;
    }

    // Sort riders by distance from store and take top 5
    const sortedRiders = availableRiders
      .map((rider) => ({
        ...rider,
        distance: calculateDistance(
          storeLat,
          storeLng,
          rider.currentLat || 0,
          rider.currentLng || 0,
        ),
      }))
      .filter((rider) => rider.distance <= 5) // Within 5km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Top 5 closest riders

    if (sortedRiders.length === 0) {
      console.log(`No riders within range for order ${orderId}`);
      return false;
    }

    // Calculate estimated earnings
    const estimatedEarnings = calculateDeliveryEarnings(
      sortedRiders[0].distance,
    );

    // Send notifications to riders
    const { notificationManager } = await import("./notificationSystem");

    const notificationPromises = sortedRiders.map((rider) =>
      notificationManager.broadcastNotification(
        [
          {
            userId: rider.userId,
            userType: "rider" as const,
          },
        ],
        "rider_delivery_offer",
        {
          orderId: order.orderNumber,
          storeName,
          customerAddress:
            (order.deliveryAddress as any)?.addressLine1 || "Customer Address",
          distance: rider.distance.toFixed(1),
          earnings: estimatedEarnings.toString(),
          pickupTime: "ASAP",
        },
        ["in_app", "push"],
      ),
    );

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter((result) => result.success).length;

    console.log(
      `Sent delivery offers to ${successCount}/${sortedRiders.length} riders for order ${orderId}`,
    );

    // Set up timeout for delivery assignment if no rider accepts
    setTimeout(
      async () => {
        await assignDeliveryToOrder(orderId);
      },
      2 * 60 * 1000,
    ); // 2 minutes timeout

    return successCount > 0;
  } catch (error) {
    console.error(`Error sending delivery offers for order ${orderId}:`, error);
    return false;
  }
}

// Process rider payment when delivery is completed
export async function processRiderPayment(deliveryId: string): Promise<void> {
  try {
    const { walletManager } = await import("./walletManagement");
    await walletManager.processDeliveryPayment(deliveryId);
    console.log(`Processed rider payment for delivery ${deliveryId}`);
  } catch (error) {
    console.error(
      `Failed to process rider payment for delivery ${deliveryId}:`,
      error,
    );
  }
}

// Calculate delivery earnings (simplified)
function calculateDeliveryEarnings(distanceKm: number): number {
  const baseFee = 20;
  const perKmFee = 5;
  return baseFee + Math.ceil(distanceKm) * perKmFee;
}

// Run cleanup every 30 seconds
if (typeof globalThis !== "undefined") {
  setInterval(releaseExpiredAssignmentLocks, 30000);
}

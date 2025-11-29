import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      !session.user.activeRole ||
      !["ADMIN", "STORE_MANAGER"].includes(session.user.activeRole)
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get("hours") || "24");
    const alertType = searchParams.get("type") || "all"; // all, missing, delayed, spoofing

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get all active riders
    const riders = await prisma.riderProfile.findMany({
      where: {
        isActive: true,
        user: {
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            phoneNumber: true,
            fullName: true,
          },
        },
        deliveries: {
          where: {
            deliveryStatus: {
              in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"],
            },
          },
          select: {
            id: true,
            deliveryStatus: true,
            orderId: true,
          },
        },
        _count: {
          select: {
            locationHistory: {
              where: {
                createdAt: {
                  gte: cutoffTime,
                },
              },
            },
          },
        },
      },
    });

    const alerts = [];

    for (const rider of riders) {
      const hasActiveDelivery = rider.deliveries.length > 0;
      const recentLocationCount = rider._count.locationHistory;
      const lastLocationUpdate = rider.lastLocationUpdate;

      let alertLevel = "none";
      let alertMessage = "";
      let alertType = "info";

      // Check for missing location updates
      if (hasActiveDelivery) {
        // Rider has active delivery but no recent location updates
        if (!lastLocationUpdate || lastLocationUpdate < cutoffTime) {
          alertLevel = "critical";
          alertMessage = `Rider has active delivery but no location updates in ${hours} hours`;
          alertType = "missing_location";
        } else if (recentLocationCount === 0) {
          alertLevel = "high";
          alertMessage = `Rider has active delivery but no location history in ${hours} hours`;
          alertType = "no_location_history";
        }
      } else if (rider.isAvailable) {
        // Rider is available but not sending location updates
        if (!lastLocationUpdate || lastLocationUpdate < cutoffTime) {
          alertLevel = "medium";
          alertMessage = `Available rider has not sent location updates in ${hours} hours`;
          alertType = "available_no_updates";
        }
      }

      // Check for location spoofing indicators
      const recentLogs = await prisma.riderLog.findMany({
        where: {
          riderId: rider.id,
          eventType: {
            in: ["location_accuracy_warning", "location_spoofing_detected"],
          },
          createdAt: {
            gte: cutoffTime,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });

      if (recentLogs.length > 0) {
        alertLevel = "high";
        alertMessage = `Location issues detected: ${recentLogs.length} accuracy/spoofing warnings`;
        alertType = "location_quality_issues";
      }

      if (alertLevel !== "none") {
        alerts.push({
          riderId: rider.id,
          riderName: rider.user.fullName || `Rider ${rider.id.slice(-4)}`,
          riderPhone: rider.user.phoneNumber,
          alertLevel,
          alertType,
          alertMessage,
          lastLocationUpdate,
          activeDeliveries: rider.deliveries.length,
          recentLocationCount,
          locationIssues: recentLogs.length,
          isAvailable: rider.isAvailable,
        });
      }
    }

    // Sort alerts by severity
    const severityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    alerts.sort(
      (a, b) => severityOrder[a.alertLevel] - severityOrder[b.alertLevel],
    );

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        summary: {
          total: alerts.length,
          critical: alerts.filter((a) => a.alertLevel === "critical").length,
          high: alerts.filter((a) => a.alertLevel === "high").length,
          medium: alerts.filter((a) => a.alertLevel === "medium").length,
          checkedHours: hours,
          totalRiders: riders.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching rider location alerts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      !session.user.activeRole ||
      !["ADMIN", "STORE_MANAGER"].includes(session.user.activeRole)
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { riderId, alertType, message, action } = body;

    if (!riderId || !alertType) {
      return NextResponse.json(
        { success: false, message: "Rider ID and alert type are required" },
        { status: 400 },
      );
    }

    // Log the alert action
    await prisma.riderLog.create({
      data: {
        riderId,
        eventType: `admin_alert_${alertType}`,
        description: `Admin ${action || "alerted"}: ${message || "Location issue detected"}`,
        metadata: {
          adminId: session.user.id,
          adminAction: action,
          alertType,
          message,
        },
      },
    });

    // If action is to suspend rider, update rider status
    if (action === "suspend") {
      await prisma.riderProfile.update({
        where: { id: riderId },
        data: {
          isActive: false,
          suspensionReason:
            message || "Suspended due to location tracking issues",
          suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });
    }

    // Create notification for the rider
    const rider = await prisma.riderProfile.findUnique({
      where: { id: riderId },
      include: { user: true },
    });

    if (rider) {
      await prisma.notification.create({
        data: {
          userId: rider.userId,
          title: "Location Tracking Alert",
          message:
            message ||
            "Please check your location permissions and GPS settings",
          notificationType: "GENERAL",
          priority: "high",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Alert processed successfully",
    });
  } catch (error) {
    console.error("Error processing rider location alert:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

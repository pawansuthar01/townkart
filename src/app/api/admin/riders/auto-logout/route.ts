import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { maxInactiveMinutes = 10 } = await request.json();

    // Find riders who haven't updated their location in the specified time
    const cutoffTime = new Date(Date.now() - maxInactiveMinutes * 60 * 1000);

    const inactiveRiders = await prisma.riderProfile.findMany({
      where: {
        isActive: true,
        OR: [
          {
            lastLocationUpdate: {
              lt: cutoffTime,
            },
          },
          {
            lastLocationUpdate: null,
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    const loggedOutRiders = [];

    // Auto-logout inactive riders
    for (const rider of inactiveRiders) {
      try {
        // Invalidate all sessions for this rider
        await prisma.session.updateMany({
          where: {
            userId: rider.userId,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        // Mark devices as inactive
        await prisma.device.updateMany({
          where: {
            userId: rider.userId,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        // Update rider status
        await prisma.riderProfile.update({
          where: { id: rider.id },
          data: {
            isAvailable: false,
            isActive: false,
          },
        });

        // Log the auto-logout event
        await prisma.riderLog.create({
          data: {
            riderId: rider.id,
            eventType: "AUTO_LOGOUT_INACTIVE",
            description: `Auto-logged out due to ${maxInactiveMinutes} minutes of GPS inactivity`,
            metadata: {
              reason: "gps_inactivity",
              maxInactiveMinutes,
              lastLocationUpdate: rider.lastLocationUpdate,
              autoLogoutTime: new Date().toISOString(),
            },
          },
        });

        loggedOutRiders.push({
          riderId: rider.id,
          userId: rider.userId,
          name: rider.user.fullName,
          phone: rider.user.phoneNumber,
          lastLocationUpdate: rider.lastLocationUpdate,
        });
      } catch (riderError: any) {
        console.error(`Error auto-logging out rider ${rider.id}:`, riderError);
        // Continue with other riders even if one fails
      }
    }

    // Create admin notification
    if (loggedOutRiders.length > 0) {
      try {
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            title: `🚨 Auto-Logout Alert: ${loggedOutRiders.length} riders logged out`,
            message: `${loggedOutRiders.length} riders were automatically logged out due to ${maxInactiveMinutes} minutes of GPS inactivity. Riders: ${loggedOutRiders.map((r) => r.name).join(", ")}`,
            notificationType: "SYSTEM_NOTIFICATION",
            priority: "high",
            referenceId: loggedOutRiders[0]?.riderId, // Reference first rider
          },
        });
      } catch (notificationError: any) {
        console.error("Error creating admin notification:", notificationError);
        // Don't fail the entire operation if notification creation fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        loggedOutCount: loggedOutRiders.length,
        loggedOutRiders,
        maxInactiveMinutes,
        cutoffTime: cutoffTime.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Auto-logout riders error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check which riders would be logged out (dry run)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const maxInactiveMinutes = parseInt(
      searchParams.get("maxInactiveMinutes") || "10"
    );

    const cutoffTime = new Date(Date.now() - maxInactiveMinutes * 60 * 1000);

    const inactiveRiders = await prisma.riderProfile.findMany({
      where: {
        isActive: true,
        OR: [
          {
            lastLocationUpdate: {
              lt: cutoffTime,
            },
          },
          {
            lastLocationUpdate: null,
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        wouldLogoutCount: inactiveRiders.length,
        wouldLogoutRiders: inactiveRiders.map((rider) => ({
          riderId: rider.id,
          userId: rider.userId,
          name: rider.user.fullName,
          phone: rider.user.phoneNumber,
          lastLocationUpdate: rider.lastLocationUpdate,
          minutesInactive: rider.lastLocationUpdate
            ? Math.floor(
                (Date.now() - rider.lastLocationUpdate.getTime()) / (1000 * 60)
              )
            : null,
        })),
        maxInactiveMinutes,
        cutoffTime: cutoffTime.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Check auto-logout riders error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

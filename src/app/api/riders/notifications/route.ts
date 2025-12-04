import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch real notifications from database
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to recent 50 notifications
    });

    // Transform to the expected format
    const formattedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: getNotificationType(notification.notificationType),
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt.toISOString(),
      read: notification.isRead,
      priority: notification.priority || "medium",
      actionUrl: getActionUrl(notification),
      metadata: {
        referenceId: notification.referenceId,
        notificationType: notification.notificationType,
      },
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
    });
  } catch (error) {
    console.error("Error fetching rider notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark all notifications as read
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to map notification types
function getNotificationType(notificationType: string): string {
  switch (notificationType) {
    case "DELIVERY_ASSIGNED":
    case "DELIVERY_PICKED_UP":
    case "DELIVERY_OUT":
    case "ORDER_DELIVERED":
      return "delivery";
    case "PAYMENT_SUCCESS":
    case "PAYMENT_FAILED":
      return "payment";
    case "SYSTEM_NOTIFICATION":
    case "LOGIN_ALERT":
    case "DEVICE_CHANGE":
    case "SECURITY_ALERT":
      return "system";
    default:
      return "alert";
  }
}

// Helper function to get action URL based on notification type
function getActionUrl(notification: any): string | undefined {
  switch (notification.notificationType) {
    case "DELIVERY_ASSIGNED":
    case "DELIVERY_PICKED_UP":
    case "DELIVERY_OUT":
      return `/rider/deliveries/active`;
    case "ORDER_DELIVERED":
      return `/rider/history`;
    case "PAYMENT_SUCCESS":
    case "PAYMENT_FAILED":
      return `/rider/earnings`;
    default:
      return undefined;
  }
}

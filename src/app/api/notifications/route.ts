import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notificationManager } from "@/lib/notificationSystem";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const isRead = searchParams.get("isRead");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const where: any = { userId };

    if (isRead !== null) {
      where.isRead = isRead === "true";
    }

    if (type) {
      where.notificationType = type;
    }

    // Use notificationManager to get user notifications
    const notifications = notificationManager.getUserNotifications(userId, {
      unreadOnly:
        isRead === "false" ? false : isRead === "true" ? true : undefined,
      type: type as any,
      limit,
      offset: (page - 1) * limit,
    });

    // For pagination, we need to get total count
    const allNotifications = notificationManager.getUserNotifications(userId);
    const filteredNotifications = type
      ? allNotifications.filter((n) => n.type === type)
      : allNotifications;
    const total = filteredNotifications.length;

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, message, notificationType, referenceId, priority } =
      body;

    if (!userId || !title || !message || !notificationType) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use the notification manager to send notification
    const result = await notificationManager.sendNotification(
      userId,
      notificationType as any,
      {
        title,
        message,
        referenceId,
      }
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Notification sent successfully",
        data: { notificationId: result.notificationId },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send notification",
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const count = notificationManager.markAllAsRead(userId);

    return NextResponse.json({
      success: true,
      message: `${count} notifications marked as read`,
    });
  } catch (error: any) {
    console.error("Mark notifications as read error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

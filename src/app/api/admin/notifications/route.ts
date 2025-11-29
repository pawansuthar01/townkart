import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notificationManager } from "@/lib/notificationSystem";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can access this
    if (!(session.user as any).userRoles?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // For now, return empty array since we're using the notification system
    // In a real implementation, you'd track sent notifications separately
    const transformedNotifications: any[] = [];

    return NextResponse.json({
      success: true,
      notifications: transformedNotifications,
    });
  } catch (error) {
    console.error("Admin notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin can send notifications
    if (!(session.user as any).userRoles?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      message,
      type,
      targetAudience,
      channels,
      recipientUserIds,
      actions,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 },
      );
    }

    // Get target users based on audience
    let targetUsers: Array<{
      userId: string;
      userType: "customer" | "store_manager" | "rider" | "admin";
    }> = [];

    if (targetAudience === "selected_users" && recipientUserIds) {
      // Get specific users
      const users = await prisma.user.findMany({
        where: {
          id: { in: recipientUserIds },
        },
        select: {
          id: true,
          userRoles: true,
        },
      });

      targetUsers = users.map((user) => ({
        userId: user.id,
        userType: user.userRoles.includes("ADMIN")
          ? "admin"
          : user.userRoles.includes("STORE_MANAGER")
            ? "store_manager"
            : user.userRoles.includes("RIDER")
              ? "rider"
              : "customer",
      }));
    } else {
      // Get users based on audience filter
      let whereClause: any = {};

      switch (targetAudience) {
        case "customers_only":
          whereClause.userRoles = { has: "CUSTOMER" };
          break;
        case "store_managers_only":
          whereClause.userRoles = { has: "STORE_MANAGER" };
          break;
        case "riders_only":
          whereClause.userRoles = { has: "RIDER" };
          break;
        case "all_users":
        default:
          // All users
          break;
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          userRoles: true,
        },
      });

      targetUsers = users.map((user) => ({
        userId: user.id,
        userType: user.userRoles.includes("ADMIN")
          ? "admin"
          : user.userRoles.includes("STORE_MANAGER")
            ? "store_manager"
            : user.userRoles.includes("RIDER")
              ? "rider"
              : "customer",
      }));
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: "No users found for the selected audience" },
        { status: 400 },
      );
    }

    // Send notifications using the notification manager
    const result = await notificationManager.broadcastNotification(
      targetUsers,
      type as any,
      {
        title,
        message,
        sentBy: session.user.name || "Admin",
        adminId: session.user.id,
      },
      channels,
    );

    // Store notification records in database for tracking
    const notificationRecords = targetUsers.map((target) => ({
      userId: target.userId,
      notificationType: type as any,
      title: title,
      message: message,
      priority: "medium",
      referenceId: null,
    }));

    await prisma.notification.createMany({
      data: notificationRecords,
    });

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${targetUsers.length} users`,
      results: result.results,
      totalSent: result.success
        ? targetUsers.length
        : result.results.filter((r) => r.success).length,
    });
  } catch (error) {
    console.error("Send admin notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

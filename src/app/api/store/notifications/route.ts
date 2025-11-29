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

    // Get store manager's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
      include: {
        store: true,
      },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
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
    console.error("Store notifications error:", error);
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

    // Get store manager's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
      include: {
        store: true,
      },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
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

    // Get target customers based on audience
    let targetUsers: Array<{
      userId: string;
      userType: "customer" | "store_manager" | "rider" | "admin";
    }> = [];

    if (targetAudience === "selected_customers" && recipientUserIds) {
      // Get specific customers
      const users = await prisma.user.findMany({
        where: {
          id: { in: recipientUserIds },
          userRoles: { has: "CUSTOMER" },
        },
        select: {
          id: true,
          userRoles: true,
        },
      });

      targetUsers = users.map((user) => ({
        userId: user.id,
        userType: "customer",
      }));
    } else {
      // Get customers who have ordered from this store
      const orders = await prisma.order.findMany({
        where: {
          storeId: storeStaff.storeId,
        },
        select: {
          customerId: true,
        },
        distinct: ["customerId"],
      });

      const customerIds = orders.map((order) => order.customerId);

      if (customerIds.length === 0) {
        return NextResponse.json(
          { error: "No customers found for this store" },
          { status: 400 },
        );
      }

      targetUsers = customerIds.map((customerId) => ({
        userId: customerId,
        userType: "customer" as const,
      }));
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { error: "No customers found for the selected audience" },
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
        sentBy: session.user.name || "Store Manager",
        storeId: storeStaff.storeId,
        storeName: storeStaff.store.name,
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
      referenceId: storeStaff.storeId,
    }));

    await prisma.notification.createMany({
      data: notificationRecords,
    });

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${targetUsers.length} customers`,
      results: result.results,
      totalSent: result.success
        ? targetUsers.length
        : result.results.filter((r) => r.success).length,
    });
  } catch (error) {
    console.error("Send store notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

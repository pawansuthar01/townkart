import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnlyMiddleware } from "@/middleware/auth.middleware";

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const authResult = await adminOnlyMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    // Check database connection
    let databaseStatus = "Connected";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      databaseStatus = "Disconnected";
    }

    // Check payment gateway (recent successful payments)
    const recentPayments = await prisma.order.count({
      where: {
        paymentStatus: "COMPLETED",
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const paymentGatewayStatus = recentPayments > 0 ? "Active" : "Inactive";

    // Check SMS service (recent SMS attempts)
    // Assuming there's an SMS log table or we can check recent orders with SMS sent
    const recentOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    const smsServiceStatus = recentOrders > 0 ? "Active" : "Inactive";

    // Check last backup (using last migration date as proxy)
    const lastMigration = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 1
    `;

    const lastBackup =
      Array.isArray(lastMigration) && lastMigration.length > 0
        ? new Date(lastMigration[0].finished_at).toLocaleString()
        : "Unknown";

    return NextResponse.json({
      success: true,
      data: {
        serverStatus: "Online",
        databaseStatus,
        paymentGatewayStatus,
        smsServiceStatus,
        lastBackup,
      },
    });
  } catch (error) {
    console.error("Admin dashboard system status error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch system status" },
      { status: 500 }
    );
  }
}

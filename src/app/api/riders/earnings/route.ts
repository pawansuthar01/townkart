import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // day, week, month, all
    const riderId = searchParams.get("riderId") || session.user.id;

    // Check permissions - riders can only see their own earnings, admins can see all
    const isAdmin = session.user.roles?.includes("ADMIN");
    if (!isAdmin && riderId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to view other riders' earnings" },
        { status: 403 },
      );
    }

    const rider = await prisma.riderProfile.findUnique({
      where: { userId: riderId },
      include: {
        earningsHistory: {
          orderBy: { earningsDate: "desc" },
          take: period === "all" ? undefined : 30,
        },
      },
    });

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    // Calculate earnings based on period
    let earnings = [];
    let totalEarnings = 0;
    let totalDeliveries = 0;

    if (period === "all") {
      earnings = rider.earningsHistory;
      totalEarnings = rider.totalEarnings;
      totalDeliveries = rider.totalDeliveries;
    } else {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "day":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }

      earnings = rider.earningsHistory.filter(
        (e) => e.earningsDate >= startDate,
      );
      totalEarnings = earnings.reduce((sum, e) => sum + e.totalEarnings, 0);
      totalDeliveries = earnings.length; // Approximate
    }

    // Calculate additional metrics
    const completedDeliveries = await prisma.delivery.count({
      where: {
        riderId: rider.id,
        deliveryStatus: "DELIVERED",
        ...(period !== "all" && {
          deliveryTime: {
            gte:
              period === "day"
                ? new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    new Date().getDate(),
                  )
                : period === "week"
                  ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  : new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1,
                    ),
          },
        }),
      },
    });

    const averageRating = rider.rating;
    const onTimeRate = rider.onTimeDeliveryRate;

    return NextResponse.json({
      success: true,
      data: {
        riderId: rider.id,
        period,
        totalEarnings,
        totalDeliveries: completedDeliveries,
        averageRating,
        onTimeRate,
        earnings: earnings.map((e) => ({
          date: e.earningsDate,
          baseEarnings: e.baseEarnings,
          bonusEarnings: e.bonusEarnings,
          penaltyAmount: e.penaltyAmount,
          totalEarnings: e.totalEarnings,
          isPaid: e.isPaid,
          paidAt: e.paidAt,
        })),
      },
    });
  } catch (error: any) {
    console.error("Get rider earnings error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
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

    const { deliveryId, amount, description } = await request.json();

    if (!deliveryId || !amount) {
      return NextResponse.json(
        { error: "Delivery ID and amount are required" },
        { status: 400 },
      );
    }

    // Only admins can manually add earnings
    const isAdmin = session.user.roles?.includes("ADMIN");
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized to add earnings" },
        { status: 403 },
      );
    }

    // Get delivery and rider info
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { rider: true, order: true },
    });

    if (!delivery || !delivery.rider) {
      return NextResponse.json(
        { error: "Delivery or rider not found" },
        { status: 404 },
      );
    }

    // Create earnings record
    const earningsRecord = await prisma.riderEarnings.create({
      data: {
        riderId: delivery.rider.id,
        deliveryId: delivery.id,
        baseEarnings: amount,
        bonusEarnings: 0,
        penaltyAmount: 0,
        totalEarnings: amount,
        earningsDate: new Date(),
      },
    });

    // Update rider's total earnings
    await prisma.riderProfile.update({
      where: { id: delivery.rider.id },
      data: {
        totalEarnings: {
          increment: amount,
        },
        totalDeliveries: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: earningsRecord,
      message: "Earnings added successfully",
    });
  } catch (error: any) {
    console.error("Add earnings error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

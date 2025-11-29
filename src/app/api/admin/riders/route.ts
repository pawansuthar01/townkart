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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userRoles: true },
    });

    if (!user?.userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get all riders with their profiles
    const riders = await prisma.riderProfile.findMany({
      where: status ? { isActive: status === "active" } : {},
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
        deliveries: {
          select: {
            deliveryFee: true,
            riderEarnings: true,
          },
        },
        reviews: {
          select: {
            riderRating: true,
          },
        },
        earningsHistory: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Transform data for frontend
    const transformedRiders = riders.map((rider) => {
      const totalDeliveries = rider.deliveries.length;
      const totalEarnings = rider.earningsHistory.reduce(
        (sum, earning) => sum + earning.totalEarnings,
        0,
      );
      const averageRating =
        rider.reviews.length > 0
          ? rider.reviews.reduce(
              (sum, review) => sum + (review.riderRating || 0),
              0,
            ) / rider.reviews.length
          : 0;

      return {
        id: rider.id,
        userId: rider.user.id,
        name: rider.user.fullName,
        phone: rider.user.phoneNumber,
        email: rider.user.email,
        rating: parseFloat(averageRating.toFixed(1)),
        totalDeliveries,
        earnings: totalEarnings,
        status: rider.isAvailable
          ? "AVAILABLE"
          : rider.isActive
            ? "BUSY"
            : "INACTIVE",
        location: rider.city,
        vehicle: rider.vehicleType,
        isVerified: rider.isVerified,
        isActive: rider.isActive,
        createdAt: rider.createdAt.toISOString(),
      };
    });

    // Get pending rider applications (users with rider role but no rider profile or unverified profiles)
    const pendingApplications = await prisma.user.findMany({
      where: {
        userRoles: { has: "RIDER" },
        OR: [{ riderProfile: null }, { riderProfile: { isVerified: false } }],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const transformedPending = pendingApplications.map((user) => ({
      id: user.id,
      name: user.fullName,
      email: user.email,
      phone: user.phoneNumber,
      status: "WAITING_FOR_APPROVAL",
      appliedDate: user.createdAt.toISOString().split("T")[0],
      documents: [], // Would need to check uploaded documents
    }));

    return NextResponse.json({
      success: true,
      riders: transformedRiders,
      pendingApplications: transformedPending,
      stats: {
        totalRiders: transformedRiders.length,
        activeRiders: transformedRiders.filter((r) => r.status === "AVAILABLE")
          .length,
        totalDeliveries: transformedRiders.reduce(
          (sum, r) => sum + r.totalDeliveries,
          0,
        ),
        totalEarnings: transformedRiders.reduce(
          (sum, r) => sum + r.earnings,
          0,
        ),
      },
    });
  } catch (error) {
    console.error("Admin riders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userRoles: true },
    });

    if (!user?.userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { riderId, action, reason } = body;

    if (!riderId || !action) {
      return NextResponse.json(
        { error: "Rider ID and action are required" },
        { status: 400 },
      );
    }

    switch (action) {
      case "approve":
        await prisma.riderProfile.update({
          where: { userId: riderId },
          data: {
            isVerified: true,
            isActive: true,
            isAvailable: true,
          },
        });
        break;

      case "reject":
        await prisma.riderProfile.update({
          where: { userId: riderId },
          data: {
            isVerified: false,
            isActive: false,
            suspensionReason: reason || "Application rejected",
          },
        });
        break;

      case "suspend":
        await prisma.riderProfile.update({
          where: { userId: riderId },
          data: {
            isActive: false,
            suspensionReason: reason || "Suspended by admin",
          },
        });
        break;

      case "activate":
        await prisma.riderProfile.update({
          where: { userId: riderId },
          data: {
            isActive: true,
            isAvailable: true,
            suspensionReason: null,
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Rider ${action} successful`,
    });
  } catch (error) {
    console.error("Admin rider action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

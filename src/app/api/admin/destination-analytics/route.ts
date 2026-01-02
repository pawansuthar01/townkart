import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDestinationAnalytics } from "@/lib/destinationAnalytics";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/destination-analytics - Get destination analytics for all users
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.activeRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For admin, get analytics for all users (this could be paginated in production)
    // For now, return a summary
    const users = await prisma.user.findMany({
      where: { userRoles: { has: "CUSTOMER" } },
      select: { id: true, fullName: true, phoneNumber: true },
      take: 100, // Limit for performance
    });

    const allAnalytics = await Promise.all(
      users.map(async (user) => {
        try {
          const analytics = await getDestinationAnalytics(user.id);
          return {
            userId: user.id,
            userName: user.fullName || user.phoneNumber,
            ...analytics,
          };
        } catch (error) {
          console.error(`Error getting analytics for user ${user.id}:`, error);
          return {
            userId: user.id,
            userName: user.fullName || user.phoneNumber,
            totalAddresses: 0,
            analytics: [],
            summary: { home: 0, work: 0, other: 0 },
          };
        }
      })
    );

    // Aggregate summary
    const totalSummary = allAnalytics.reduce(
      (acc, user) => {
        acc.home += user.summary.home;
        acc.work += user.summary.work;
        acc.other += user.summary.other;
        return acc;
      },
      { home: 0, work: 0, other: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        users: allAnalytics,
        summary: totalSummary,
        totalUsers: users.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching destination analytics:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

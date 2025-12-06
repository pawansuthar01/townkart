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

    // Get top products
    const topProducts = await prisma.product
      .findMany({
        take: 5,
        orderBy: {
          totalSales: "desc",
        },
        select: {
          name: true,
          totalSales: true,
          price: true,
        },
      })
      .catch(() => []);

    return NextResponse.json({
      success: true,
      data: topProducts.map((product) => ({
        name: product.name,
        sales: product.totalSales,
        revenue: product.totalSales * product.price,
      })),
    });
  } catch (error) {
    console.error("Admin dashboard top products error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch top products" },
      { status: 500 }
    );
  }
}

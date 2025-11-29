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

    // Get customers who have ordered from this store
    const orders = await prisma.order.findMany({
      where: {
        storeId: storeStaff.storeId,
      },
      select: {
        customerId: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
            createdAt: true,
          },
        },
      },
      distinct: ["customerId"],
      orderBy: {
        createdAt: "desc",
      },
    });

    // Extract unique customers
    const customers = orders
      .map((order) => order.customer)
      .filter((customer) => customer !== null);

    return NextResponse.json({
      success: true,
      customers: customers,
    });
  } catch (error) {
    console.error("Store customers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

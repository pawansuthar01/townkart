import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let store;
    store = await prisma.store.findFirst({
      where: { managerId: session.user.id },
      select: {
        applicationStatus: true,
      },
    });
    if (!store) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 }
      );
    } else if (store.applicationStatus !== "APPROVED") {
      return NextResponse.json(
        {
          applicationStatus: store.applicationStatus,
          error: store.applicationStatus.includes("REJECTED")
            ? "your application  rejected contact support !"
            : "Store not approved yet",
        },
        { status: 403 }
      );
    }
    // Get store manager's store
    store = await prisma.store.findFirst({
      where: { managerId: session.user.id },

      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        latitude: true,
        longitude: true,
        category: true,
        subcategory: true,
        phoneNumber: true,
        email: true,
        isActive: true,
        isVerified: true,
        operatingHours: true,
        createdAt: true,
        updatedAt: true,
        manager: true,
        serviceArea: true,
        averageRating: true,
        totalOrders: true,
        totalRevenue: true,
        applicationStatus: true,
      },
    });
    if (!store) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 }
      );
    } else if (!store.manager) {
      return NextResponse.json(
        { error: "manager access not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        applicationStatus: store.applicationStatus,
        id: store.id,
        name: store.name,
        code: store.code,
        description: store.description,
        address: store.address,
        city: store.city,
        state: store.state,
        pincode: store.pincode,
        latitude: store.latitude,
        longitude: store.longitude,
        category: store.category,
        subcategory: store.subcategory,
        phoneNumber: store.phoneNumber,
        email: store.email,
        isActive: store.isActive,
        isVerified: store.isVerified,
        operatingHours: store.operatingHours,
        serviceArea: store.serviceArea,
        manager: {
          id: store.manager.id,
          name: store.manager.fullName,
          phoneNumber: store.manager.phoneNumber,
          email: store.manager.email,
        },
        performance: {
          averageRating: store.averageRating,
          totalOrders: store.totalOrders,
          totalRevenue: store.totalRevenue,
        },
        createdAt: store.createdAt.toISOString(),
        updatedAt: store.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Store profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

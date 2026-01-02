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
        user: true,
        store: {
          include: {
            serviceArea: true,
          },
        },
      },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 }
      );
    }

    const store = storeStaff.store;

    return NextResponse.json({
      success: true,
      profile: {
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
          id: storeStaff.user.id,
          name: storeStaff.user.fullName,
          phoneNumber: storeStaff.user.phoneNumber,
          email: storeStaff.user.email,
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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get store manager's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, address, phoneNumber, email, operatingHours } =
      body;

    const updatedStore = await prisma.store.update({
      where: { id: storeStaff.storeId },
      data: {
        name,
        description,
        address,
        phoneNumber,
        email,
        operatingHours,
      },
    });

    return NextResponse.json({
      success: true,
      store: updatedStore,
    });
  } catch (error) {
    console.error("Update store profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

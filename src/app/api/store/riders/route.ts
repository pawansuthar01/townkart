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

    // Get store staff's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ACTIVE";

    // Get riders assigned to this store
    const riderAssignments = await prisma.riderStoreAssignment.findMany({
      where: {
        storeId: storeStaff.storeId,
        status: status,
      },
      include: {
        rider: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for frontend
    const riders = riderAssignments.map((assignment) => ({
      id: assignment.id,
      riderId: assignment.riderId,
      rider: {
        id: assignment.rider.user.id,
        name: assignment.rider.user.fullName,
        phone: assignment.rider.user.phoneNumber,
        email: assignment.rider.user.email,
        vehicleType: assignment.rider.vehicleType,
        rating: assignment.rider.rating,
        totalDeliveries: assignment.rider.totalDeliveries,
        isVerified: assignment.rider.isVerified,
        isAvailable: assignment.rider.isAvailable,
      },
      status: assignment.status,
      totalDeliveries: assignment.totalDeliveries,
      rating: assignment.rating,
      isPreferred: assignment.isPreferred,
      commissionRate: assignment.commissionRate,
      assignedAt: assignment.assignedAt.toISOString(),
      assignedBy: assignment.assignedBy,
    }));

    return NextResponse.json({
      success: true,
      riders,
    });
  } catch (error) {
    console.error("Store riders error:", error);
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

    // Get store staff's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { riderId, commissionRate, isPreferred } = body;

    if (!riderId) {
      return NextResponse.json(
        { error: "Rider ID is required" },
        { status: 400 },
      );
    }

    // Check if rider exists and is a verified rider
    const riderProfile = await prisma.riderProfile.findUnique({
      where: { userId: riderId },
      include: { user: true },
    });

    if (!riderProfile) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    if (!riderProfile.isVerified) {
      return NextResponse.json(
        { error: "Rider is not verified" },
        { status: 400 },
      );
    }

    // Check if rider is already assigned to this store
    const existingAssignment = await prisma.riderStoreAssignment.findUnique({
      where: {
        riderId_storeId: {
          riderId: riderProfile.id,
          storeId: storeStaff.storeId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Rider is already assigned to this store" },
        { status: 400 },
      );
    }

    // Create new assignment
    const assignment = await prisma.riderStoreAssignment.create({
      data: {
        riderId: riderProfile.id,
        storeId: storeStaff.storeId,
        status: "PENDING", // Requires approval
        assignedBy: session.user.id,
        commissionRate: commissionRate || null,
        isPreferred: isPreferred || false,
      },
      include: {
        rider: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        riderId: assignment.riderId,
        rider: {
          id: assignment.rider.user.id,
          name: assignment.rider.user.fullName,
          phone: assignment.rider.user.phoneNumber,
          email: assignment.rider.user.email,
          vehicleType: assignment.rider.vehicleType,
          rating: assignment.rider.rating,
          totalDeliveries: assignment.rider.totalDeliveries,
          isVerified: assignment.rider.isVerified,
          isAvailable: assignment.rider.isAvailable,
        },
        status: assignment.status,
        totalDeliveries: assignment.totalDeliveries,
        rating: assignment.rating,
        isPreferred: assignment.isPreferred,
        commissionRate: assignment.commissionRate,
        assignedAt: assignment.assignedAt.toISOString(),
        assignedBy: assignment.assignedBy,
      },
    });
  } catch (error) {
    console.error("Add store rider error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

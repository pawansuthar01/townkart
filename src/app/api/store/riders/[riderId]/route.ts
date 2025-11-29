import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { riderId: string } },
) {
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

    const { riderId } = params;
    const body = await request.json();
    const { status, commissionRate, isPreferred } = body;

    // Find the assignment
    const assignment = await prisma.riderStoreAssignment.findFirst({
      where: {
        riderId: riderId,
        storeId: storeStaff.storeId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Rider assignment not found" },
        { status: 404 },
      );
    }

    // Update the assignment
    const updatedAssignment = await prisma.riderStoreAssignment.update({
      where: { id: assignment.id },
      data: {
        status: status || assignment.status,
        commissionRate:
          commissionRate !== undefined
            ? commissionRate
            : assignment.commissionRate,
        isPreferred:
          isPreferred !== undefined ? isPreferred : assignment.isPreferred,
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
        id: updatedAssignment.id,
        riderId: updatedAssignment.riderId,
        rider: {
          id: updatedAssignment.rider.user.id,
          name: updatedAssignment.rider.user.fullName,
          phone: updatedAssignment.rider.user.phoneNumber,
          email: updatedAssignment.rider.user.email,
          vehicleType: updatedAssignment.rider.vehicleType,
          rating: updatedAssignment.rider.rating,
          totalDeliveries: updatedAssignment.rider.totalDeliveries,
          isVerified: updatedAssignment.rider.isVerified,
          isAvailable: updatedAssignment.rider.isAvailable,
        },
        status: updatedAssignment.status,
        totalDeliveries: updatedAssignment.totalDeliveries,
        rating: updatedAssignment.rating,
        isPreferred: updatedAssignment.isPreferred,
        commissionRate: updatedAssignment.commissionRate,
        assignedAt: updatedAssignment.assignedAt.toISOString(),
        assignedBy: updatedAssignment.assignedBy,
      },
    });
  } catch (error) {
    console.error("Update store rider error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { riderId: string } },
) {
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

    const { riderId } = params;

    // Find and delete the assignment
    const assignment = await prisma.riderStoreAssignment.findFirst({
      where: {
        riderId: riderId,
        storeId: storeStaff.storeId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Rider assignment not found" },
        { status: 404 },
      );
    }

    await prisma.riderStoreAssignment.delete({
      where: { id: assignment.id },
    });

    return NextResponse.json({
      success: true,
      message: "Rider assignment removed successfully",
    });
  } catch (error) {
    console.error("Delete store rider error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

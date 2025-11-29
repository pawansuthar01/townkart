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

    // Get rider profile
    const riderProfile = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            profileImageUrl: true,
          },
        },
        deliveries: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!riderProfile) {
      return NextResponse.json(
        { error: "Rider profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: riderProfile.id,
        user: riderProfile.user,
        vehicleType: riderProfile.vehicleType,
        vehicleNumber: riderProfile.vehicleNumber,
        licenseNumber: riderProfile.licenseNumber,
        emergencyContact: riderProfile.emergencyContact,
        emergencyPhone: riderProfile.emergencyPhone,
        city: riderProfile.city,
        isAvailable: riderProfile.isAvailable,
        rating: riderProfile.rating,
        totalDeliveries: riderProfile.totalDeliveries,
        totalEarnings: riderProfile.totalEarnings,
        onTimeDeliveryRate: riderProfile.onTimeDeliveryRate,
        isVerified: riderProfile.isVerified,
        isActive: riderProfile.isActive,
        createdAt: riderProfile.createdAt,
        deliveryCount: riderProfile.deliveries.length,
      },
    });
  } catch (error) {
    console.error("Get rider profile error:", error);
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

    const body = await request.json();
    const {
      vehicleType,
      vehicleNumber,
      licenseNumber,
      emergencyContact,
      emergencyPhone,
      city,
    } = body;

    // Update rider profile
    const updatedProfile = await prisma.riderProfile.update({
      where: { userId: session.user.id },
      data: {
        vehicleType,
        vehicleNumber,
        licenseNumber,
        emergencyContact,
        emergencyPhone,
        city,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update rider profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

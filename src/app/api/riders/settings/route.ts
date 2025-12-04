import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find rider profile
    const riderProfile = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!riderProfile) {
      return NextResponse.json(
        { error: "Rider profile not found" },
        { status: 404 }
      );
    }

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: true,
      },
    });

    // Get rider settings based on actual database schema
    const settings = {
      // Notifications (from user global preferences)
      emailNotifications: user?.emailNotifications ?? true,
      pushNotifications: user?.pushNotifications ?? true,
      smsNotifications: user?.smsNotifications ?? false,

      // Rider Profile Settings (from rider profile)
      vehicleType: riderProfile.vehicleType,
      vehicleNumber: riderProfile.vehicleNumber,
      licenseNumber: riderProfile.licenseNumber,
      emergencyContact: riderProfile.emergencyContact,
      emergencyPhone: riderProfile.emergencyPhone,
      city: riderProfile.city,
      isAvailable: riderProfile.isAvailable,
      maxDailyDeliveries: riderProfile.maxDailyDeliveries,
      preferredZones: riderProfile.preferredZones,
      skills: riderProfile.skills,

      // Availability Schedule
      availabilitySchedule: riderProfile.availabilitySchedule,

      // Status Information (read-only)
      isVerified: riderProfile.isVerified,
      isActive: riderProfile.isActive,
      suspensionReason: riderProfile.suspensionReason,
      suspendedUntil: riderProfile.suspendedUntil,

      // Performance Metrics (read-only)
      rating: riderProfile.rating,
      totalDeliveries: riderProfile.totalDeliveries,
      totalEarnings: riderProfile.totalEarnings,
      onTimeDeliveryRate: riderProfile.onTimeDeliveryRate,
      averageDeliveryTime: riderProfile.averageDeliveryTime,
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error fetching rider settings:", error);
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

    const body = await request.json();

    // Find rider profile
    const riderProfile = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: true,
      },
    });

    if (!riderProfile) {
      return NextResponse.json(
        { error: "Rider profile not found" },
        { status: 404 }
      );
    }

    // Update rider profile settings
    const riderUpdateData: any = {};

    // Rider profile updatable fields
    if (body.vehicleType !== undefined)
      riderUpdateData.vehicleType = body.vehicleType;
    if (body.vehicleNumber !== undefined)
      riderUpdateData.vehicleNumber = body.vehicleNumber;
    if (body.licenseNumber !== undefined)
      riderUpdateData.licenseNumber = body.licenseNumber;
    if (body.emergencyContact !== undefined)
      riderUpdateData.emergencyContact = body.emergencyContact;
    if (body.emergencyPhone !== undefined)
      riderUpdateData.emergencyPhone = body.emergencyPhone;
    if (body.city !== undefined) riderUpdateData.city = body.city;
    if (body.isAvailable !== undefined)
      riderUpdateData.isAvailable = body.isAvailable;
    if (body.maxDailyDeliveries !== undefined)
      riderUpdateData.maxDailyDeliveries = body.maxDailyDeliveries;
    if (body.preferredZones !== undefined)
      riderUpdateData.preferredZones = body.preferredZones;
    if (body.skills !== undefined) riderUpdateData.skills = body.skills;
    if (body.availabilitySchedule !== undefined)
      riderUpdateData.availabilitySchedule = body.availabilitySchedule;

    if (Object.keys(riderUpdateData).length > 0) {
      await prisma.riderProfile.update({
        where: { id: riderProfile.id },
        data: riderUpdateData,
      });
    }

    // Update user notification preferences
    const userUpdateData: any = {};

    if (body.emailNotifications !== undefined)
      userUpdateData.emailNotifications = body.emailNotifications;
    if (body.pushNotifications !== undefined)
      userUpdateData.pushNotifications = body.pushNotifications;
    if (body.smsNotifications !== undefined)
      userUpdateData.smsNotifications = body.smsNotifications;

    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdateData,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating rider settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

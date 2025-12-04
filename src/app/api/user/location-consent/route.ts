import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, purpose, location, method, consentGiven } = body;

    // Log location usage in user device logs (simplified approach)
    await prisma.deviceLoginLog.create({
      data: {
        userId: session.user.id,
        deviceId: "location_consent", // Placeholder
        deviceType: "mobile",
        loginType: "LOCATION_CONSENT",
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        location: location
          ? {
              country: "IN", // Simplified
              city: "Unknown",
              region: "Unknown",
              lat: location.latitude,
              lng: location.longitude,
            }
          : undefined,
        riskLevel: "LOW",
        locationMatch: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Location usage logged successfully",
    });
  } catch (error) {
    console.error("Error logging location usage:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

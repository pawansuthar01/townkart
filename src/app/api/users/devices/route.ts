import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeviceManager } from "@/lib/deviceManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const devices = await DeviceManager.getUserDevices(session.user.id);

    return NextResponse.json({
      success: true,
      data: { devices },
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json(
        { success: false, message: "Device ID is required" },
        { status: 400 },
      );
    }

    await DeviceManager.deactivateDevice(session.user.id, deviceId);

    return NextResponse.json({
      success: true,
      message: "Device deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating device:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

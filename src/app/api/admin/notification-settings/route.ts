import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all notification settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        category: "notifications",
      },
    });

    // Get OTP settings
    const otpSettings = await prisma.systemSetting.findMany({
      where: {
        category: "otp",
      },
    });

    // Convert to key-value pairs
    const notificationSettings: Record<string, any> = {};
    const otpSettingsObj: Record<string, any> = {};

    settings.forEach((setting) => {
      try {
        notificationSettings[setting.key] = JSON.parse(setting.value);
      } catch {
        notificationSettings[setting.key] = setting.value;
      }
    });

    otpSettings.forEach((setting) => {
      try {
        otpSettingsObj[setting.key] = JSON.parse(setting.value);
      } catch {
        otpSettingsObj[setting.key] = setting.value;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications: notificationSettings,
        otp: otpSettingsObj,
      },
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { category, settings } = await request.json();

    if (!category || !settings) {
      return NextResponse.json(
        { success: false, message: "Category and settings are required" },
        { status: 400 }
      );
    }

    // Update settings
    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      updates.push(
        prisma.systemSetting.upsert({
          where: {
            category_key: {
              category,
              key,
            },
          },
          update: {
            value: JSON.stringify(value),
            updatedAt: new Date(),
          },
          create: {
            category,
            key,
            value: JSON.stringify(value),
            description: `${category} setting: ${key}`,
            isPublic: false,
          },
        })
      );
    }

    await prisma.$transaction(updates);

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

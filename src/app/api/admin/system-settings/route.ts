import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Get system settings from database
    const settings = await prisma.systemSetting.findMany({
      orderBy: { category: "asc" },
    });

    // Transform settings into categorized object
    const categorizedSettings: any = {};

    settings.forEach((setting) => {
      if (!categorizedSettings[setting.category]) {
        categorizedSettings[setting.category] = {};
      }
      categorizedSettings[setting.category][setting.key] = setting.value;
    });

    return NextResponse.json({
      success: true,
      data: categorizedSettings,
    });
  } catch (error: any) {
    console.error("Get system settings error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, key, value } = body;

    if (!category || !key) {
      return NextResponse.json(
        { success: false, message: "Category and key are required" },
        { status: 400 },
      );
    }

    // Update or create system setting
    const setting = await prisma.systemSetting.upsert({
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
      },
    });

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error: any) {
    console.error("Update system settings error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = body.updates;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, message: "Updates array is required" },
        { status: 400 },
      );
    }

    // Bulk update settings
    const results = [];

    for (const update of updates) {
      const { category, key, value } = update;

      if (!category || !key) continue;

      const setting = await prisma.systemSetting.upsert({
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
        },
      });

      results.push(setting);
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error("Bulk update system settings error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

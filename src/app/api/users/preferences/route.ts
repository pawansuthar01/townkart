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

    // Get customer profile preferences
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id },
      select: { preferences: true },
    });

    const preferences = (customerProfile?.preferences as any) || {};
    const rememberLogin = preferences?.rememberLogin || false;

    return NextResponse.json({
      success: true,
      data: { rememberLogin },
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get preferences" },
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
    const { rememberLogin } = body;

    // Get current preferences
    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id },
      select: { preferences: true },
    });

    const currentPreferences = (customerProfile?.preferences as any) || {};

    // Update preferences
    const updatedPreferences = {
      ...currentPreferences,
      rememberLogin: rememberLogin || false,
    };

    // Upsert customer profile with new preferences
    await prisma.customerProfile.upsert({
      where: { userId: session.user.id },
      update: { preferences: updatedPreferences },
      create: {
        userId: session.user.id,
        preferences: updatedPreferences,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isAvailable, currentLat, currentLng } = await request.json();

    if (typeof isAvailable !== "boolean") {
      return NextResponse.json(
        { error: "isAvailable must be a boolean" },
        { status: 400 },
      );
    }

    // Update rider availability and location
    const updatedRider = await prisma.riderProfile.update({
      where: { userId: session.user.id },
      data: {
        isAvailable,
        currentLat: currentLat || null,
        currentLng: currentLng || null,
        // lastLocationUpdate: new Date(), // TODO: Add to schema
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
      },
    });

    // TODO: Create rider log for availability change
    // await prisma.riderLog.create({ ... });

    return NextResponse.json({
      success: true,
      data: {
        riderId: updatedRider.id,
        isAvailable: updatedRider.isAvailable,
        currentLat: updatedRider.currentLat,
        currentLng: updatedRider.currentLng,
        // lastLocationUpdate: updatedRider.lastLocationUpdate, // TODO: Add to schema
      },
    });
  } catch (error: any) {
    console.error("Update rider availability error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rider = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        isAvailable: true,
        currentLat: true,
        currentLng: true,
        // lastLocationUpdate: true, // TODO: Add to schema
        totalDeliveries: true,
        rating: true,
      },
    });

    if (!rider) {
      return NextResponse.json(
        { error: "Rider profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: rider,
    });
  } catch (error: any) {
    console.error("Get rider availability error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

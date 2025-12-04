import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId, status, reason } = await request.json();

    // Verify the user is updating their own status or is admin
    if (
      session.user.id !== userId &&
      !session.user.userRoles?.includes("ADMIN")
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Update rider status
    const updatedRider = await prisma.riderProfile.update({
      where: { userId },
      data: {
        isActive: status === "ACTIVE",
        suspensionReason: reason,
        ...(reason && { statusReason: reason }),
        lastStatusUpdate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRider,
      message: "Rider status updated successfully",
    });
  } catch (error) {
    console.error("Error updating rider status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

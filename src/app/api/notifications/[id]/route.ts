import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error: any) {
    console.error("Mark notification as read error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

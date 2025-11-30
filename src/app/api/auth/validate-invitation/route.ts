import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Token is required" },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { valid: false, message: "Invalid invitation token" },
        { status: 400 }
      );
    }

    if (invitation.status !== "APPROVED") {
      return NextResponse.json(
        {
          valid: false,
          message:
            invitation.status === "PENDING"
              ? "Invitation is pending approval"
              : invitation.status === "REJECTED"
                ? "Invitation has been rejected"
                : "Invitation is no longer valid",
        },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, message: "Invitation has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        role: invitation.role,
        invitedEmail: invitation.invitedEmail,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { valid: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

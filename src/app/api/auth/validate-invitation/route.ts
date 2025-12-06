import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check if invitation is already used
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation has already been used" },
        { status: 400 }
      );
    }

    // Return invitation data (without sensitive info)
    const invitationData = {
      id: invitation.id,
      invitedEmail: invitation.invitedEmail,
      invitedPhone: invitation.invitedPhone,
      role: invitation.role,
      serviceAreas: invitation.serviceAreas,
      stores: invitation.stores,
      message: invitation.message,
      expiresAt: invitation.expiresAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      invitation: invitationData,
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

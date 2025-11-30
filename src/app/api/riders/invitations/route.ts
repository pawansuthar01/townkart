import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { notificationManager } from "@/lib/notificationSystem";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("RIDER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, phone, message, expiresInHours = 24 } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if invitation already exists for this email
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        invitedEmail: email,
        status: { in: ["PENDING", "APPROVED"] },
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An active invitation already exists for this email" },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const invitation = await prisma.invitation.create({
      data: {
        invitedBy: session.user.id,
        invitedEmail: email,
        invitedPhone: phone,
        role: "STORE_MANAGER",
        invitationType: "RIDER_TO_STORE",
        token,
        expiresAt,
        message,
      },
    });

    // Send email with invitation link
    const invitationUrl = `${process.env.NEXTAUTH_URL}/auth/register?token=${token}`;
    const subject = "Invitation to join TownKart as Store Manager";
    const emailMessage = `You've been invited to join TownKart as a store manager. Click the button below to complete your registration.

${message ? `Message: ${message}` : ""}

This invitation expires on ${expiresAt.toLocaleDateString()}.`;

    const emailSent = await notificationManager.sendExternalEmail(
      email,
      subject,
      emailMessage,
      undefined, // Use default HTML template
      [{ label: "Accept Invitation", url: invitationUrl }]
    );

    if (!emailSent) {
      console.warn(
        "Failed to send invitation email, but invitation was created"
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.invitedEmail,
        expiresAt: invitation.expiresAt,
        invitationUrl,
      },
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("RIDER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where: {
          invitedBy: session.user.id,
          invitationType: "RIDER_TO_STORE",
        },
        include: {
          usedByUser: {
            select: { fullName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invitation.count({
        where: {
          invitedBy: session.user.id,
          invitationType: "RIDER_TO_STORE",
        },
      }),
    ]);

    return NextResponse.json({
      invitations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

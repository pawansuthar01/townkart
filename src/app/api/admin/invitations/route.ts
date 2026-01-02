import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { notificationManager } from "@/lib/notificationSystem";
import { string } from "zod";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      email,
      phone,
      role,
      message,
      expiresInHours = 24,
      storeId, // For STORE_MANAGER invitations
      serviceAreas, // For RIDER invitations - array of service area IDs
      stores, // For RIDER invitations - array of store IDs
      notificationChannels = ["EMAIL"], // Default to email only
    } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    if (!["RIDER", "STORE_MANAGER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be RIDER or STORE_MANAGER" },
        { status: 400 }
      );
    }

    // Validate role-specific fields
    if (role === "STORE_MANAGER") {
      if (!storeId) {
        return NextResponse.json(
          { error: "storeId is required for STORE_MANAGER invitations" },
          { status: 400 }
        );
      }
      // Verify store exists
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });
      if (!store) {
        return NextResponse.json(
          { error: "Invalid storeId. Store not found." },
          { status: 400 }
        );
      }
    } else if (role === "RIDER") {
      // For riders, serviceAreas and stores are optional but should be validated if provided
      if (serviceAreas && !Array.isArray(serviceAreas)) {
        return NextResponse.json(
          { error: "serviceAreas must be an array of service area IDs" },
          { status: 400 }
        );
      }
      if (stores && !Array.isArray(stores)) {
        return NextResponse.json(
          { error: "stores must be an array of store IDs" },
          { status: 400 }
        );
      }

      // Validate service areas exist
      if (serviceAreas && serviceAreas.length > 0) {
        const existingServiceAreas = await prisma.serviceArea.findMany({
          where: { id: { in: serviceAreas } },
        });
        if (existingServiceAreas.length !== serviceAreas.length) {
          return NextResponse.json(
            { error: "One or more service area IDs are invalid" },
            { status: 400 }
          );
        }
      }

      // Validate stores exist
      if (stores && stores.length > 0) {
        const existingStores = await prisma.store.findMany({
          where: { id: { in: stores } },
        });
        if (existingStores.length !== stores.length) {
          return NextResponse.json(
            { error: "One or more store IDs are invalid" },
            { status: 400 }
          );
        }
      }
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

    const invitationType =
      role === "RIDER" ? "ADMIN_TO_RIDER" : "ADMIN_TO_STORE";

    // Verify that the inviting user exists in the database
    console.log("Session user ID:", session.user.id);
    console.log("Session user roles:", session.user.roles);
    console.log("Session user activeRole:", (session.user as any).activeRole);

    const invitingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        userRoles: true,
        activeRole: true,
      },
    });

    console.log("Found inviting user:", invitingUser);

    let finalInvitingUser = invitingUser as {
      id: string;
      fullName: string | null;
      email: string | null;
    };

    if (!invitingUser) {
      // Try to find admin users to see what's available
      const adminUsers = await prisma.user.findMany({
        where: { userRoles: { has: "ADMIN" } },
        select: { id: true, fullName: true, email: true, phoneNumber: true },
      });
      console.log("Available admin users:", adminUsers);

      // For development: use the first available admin user as fallback
      if (adminUsers.length > 0) {
        console.log("Using fallback admin user:", adminUsers[0].id);
        finalInvitingUser = {
          id: adminUsers[0].id,
          fullName: adminUsers[0].fullName,
          email: adminUsers[0].email,
        };
      } else {
        return NextResponse.json(
          {
            error:
              "No admin users found in database. Please run the seeder first.",
            sessionUserId: session.user.id,
          },
          { status: 400 }
        );
      }
    }

    const invitation = await prisma.invitation.create({
      data: {
        invitedBy: finalInvitingUser!.id,
        invitedEmail: email,
        invitedPhone: phone,
        role: role as "RIDER" | "STORE_MANAGER",
        invitationType: invitationType as "ADMIN_TO_RIDER" | "ADMIN_TO_STORE",
        token,
        expiresAt,
        message,
        storeId: role === "STORE_MANAGER" ? storeId : null,
        serviceAreas: role === "RIDER" ? serviceAreas : null,
        stores: role === "RIDER" ? stores : null,
        notificationChannels,
      } as any, // Type assertion due to schema changes
    });

    // Send external notifications directly (bypassing subscription system)
    const invitationUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/invitation?token=${token}`;

    // Map our channels to notification system channels
    const channelMap: Record<string, "email" | "whatsapp" | "sms"> = {
      EMAIL: "email",
      WHATSAPP: "whatsapp",
      SMS: "sms",
    };

    const notificationSystemChannels = notificationChannels
      .map((channel: string) => channelMap[channel as keyof typeof channelMap])
      .filter(Boolean);

    // Send invitation notifications using the new external method
    const notificationResults =
      await notificationManager.sendExternalInvitation(
        email,
        phone,
        notificationSystemChannels,
        {
          role: role.toLowerCase(),
          invitationUrl,
          expiresAt: expiresAt.toLocaleDateString(),
          message: message || "",
        }
      );

    // Log notification results
    const failedNotifications = notificationResults.filter((r) => !r.success);
    if (failedNotifications.length > 0) {
      console.warn(
        "Some invitation notifications failed:",
        failedNotifications.map((r) => `${r.channel}: ${r.error}`).join(", ")
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.invitedEmail,
        role: invitation.role,
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
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const role = searchParams.get("role");

    const where: any = {};
    if (status) where.status = status;
    if (role) where.role = role;

    const [invitations, total] = await Promise.all([
      prisma.invitation.findMany({
        where,
        select: {
          id: true,
          token: true,
          invitedEmail: true,
          invitedPhone: true,
          role: true,
          invitationType: true,
          status: true,
          expiresAt: true,
          usedAt: true,
          message: true,
          storeId: true,
          serviceAreas: true,
          stores: true,
          notificationChannels: true,
          invitedByUser: {
            select: { fullName: true, email: true },
          },
          usedByUser: {
            select: { fullName: true, email: true },
          },
          // Notification logs are handled by the notification system
          // No need to include them here as they are tracked separately
        } as any, // Type assertion due to schema changes
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.invitation.count({ where }),
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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, action } = await request.json();

    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request. Provide id and action (approve/reject)" },
        { status: 400 }
      );
    }

    const status = action === "approve" ? "APPROVED" : "REJECTED";

    const invitation = await prisma.invitation.update({
      where: { id },
      data: { status: status as "APPROVED" | "REJECTED" },
      include: {
        invitedByUser: {
          select: { fullName: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      invitation,
    });
  } catch (error) {
    console.error("Error updating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

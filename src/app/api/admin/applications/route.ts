import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { notificationManager } from "@/lib/notificationSystem";

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
    if (status && status !== "ALL") where.status = status;
    if (role && role !== "ALL") where.role = role;

    const [applications, total] = await Promise.all([
      (prisma as any).application.findMany({
        where,
        include: {
          invitation: {
            select: {
              serviceAreas: true,
              stores: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).application.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
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

    const { applicationId, action, notes } = await request.json();

    if (!applicationId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          error:
            "Invalid request. Provide applicationId and action (approve/reject)",
        },
        { status: 400 }
      );
    }

    // Get the application with invitation details
    const application = await (prisma as any).application.findUnique({
      where: { id: applicationId },
      include: {
        invitation: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "PENDING") {
      return NextResponse.json(
        { error: "Application has already been reviewed" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

    if (action === "approve") {
      // Create the user account
      const user = await prisma.user.create({
        data: {
          fullName: application.fullName,
          email: application.email,
          phoneNumber: application.phoneNumber,
          password: application.password, // Already hashed
          userRoles: [application.role],
          activeRole: application.role as
            | "RIDER"
            | "STORE_MANAGER"
            | "CUSTOMER"
            | "ADMIN",
          emailVerified: true, // Since they verified via invitation
          phoneVerified: true, // Since they provided phone in application
          isActive: true,
        },
      });

      // Create role-specific profile
      if (application.role === "RIDER") {
        await prisma.riderProfile.create({
          data: {
            userId: user.id,
            vehicleType: application.vehicleType || "bike",
            vehicleNumber: application.vehicleNumber,
            licenseNumber: application.licenseNumber,
            emergencyContact: application.emergencyContact,
            emergencyPhone: application.emergencyPhone,
            city: "Hanumangarh", // Default, can be updated later
            isAvailable: false, // Will be activated after document verification
            isVerified: false, // Needs document verification
            isActive: true,
          },
        });

        // Assign service areas to rider
        if (application.invitation.serviceAreas?.length) {
          await (prisma as any).riderZoneAssignment.create({
            data: {
              riderId: user.id,
              serviceAreaId: application.invitation.serviceAreas[0], // Primary service area
              assignedZones: application.invitation.serviceAreas,
              isCurrentlyValid: true,
            },
          });
        }
      } else if (application.role === "STORE_MANAGER") {
        // Create store staff entry
        if (application.storeId) {
          await prisma.storeStaff.create({
            data: {
              storeId: application.storeId,
              userId: user.id,
              role: "manager",
              isActive: true,
            },
          });
        }
      }

      // Update application with user ID and approval details
      await (prisma as any).application.update({
        where: { id: applicationId },
        data: {
          status: newStatus,
          userId: user.id,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes,
          approvedAt: new Date(),
        },
      });

      // Send approval notification
      try {
        await notificationManager.sendNotification(
          user.id,
          "admin_manual",
          {
            title: "Application Approved!",
            message: `Congratulations! Your application to join TownKart as a ${application.role === "STORE_MANAGER" ? "Store Manager" : "Rider"} has been approved. You can now log in to your account.`,
            applicationId: application.id,
          },
          ["in_app", "email"]
        );
      } catch (notificationError) {
        console.error(
          "Failed to send approval notification:",
          notificationError
        );
      }
    } else {
      // Reject application
      await (prisma as any).application.update({
        where: { id: applicationId },
        data: {
          status: newStatus,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes,
        },
      });

      // Send rejection notification via email
      try {
        await notificationManager.sendExternalEmail(
          application.email,
          "Application Status Update",
          `We regret to inform you that your application to join TownKart as a ${application.role === "STORE_MANAGER" ? "Store Manager" : "Rider"} has been rejected.${notes ? ` Reason: ${notes}` : ""}`,
          undefined,
          []
        );
      } catch (notificationError) {
        console.error(
          "Failed to send rejection notification:",
          notificationError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${action}d successfully`,
      applicationId,
    });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

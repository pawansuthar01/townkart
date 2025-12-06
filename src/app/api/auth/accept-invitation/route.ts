import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { notificationManager } from "@/lib/notificationSystem";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get("token") as string;
    const fullName = formData.get("fullName") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    if (!token || !fullName || !phoneNumber || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        invitedByUser: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 400 }
      );
    }

    if (invitation.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Invitation is not approved" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    if (invitation.usedAt) {
      return NextResponse.json(
        { error: "Invitation has already been used" },
        { status: 400 }
      );
    }

    // Check if email/phone is already taken by active users
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: invitation.invitedEmail }, { phoneNumber: phoneNumber }],
        isActive: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or phone number is already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Handle document uploads for riders
    let documentUrls: string[] = [];
    if (role === "RIDER") {
      const documents = formData.getAll("documents") as File[];
      if (documents.length > 0) {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          "rider-documents"
        );
        try {
          await mkdir(uploadsDir, { recursive: true });
        } catch (error) {
          // Directory might already exist
        }

        for (const doc of documents) {
          const fileName = `${Date.now()}-${doc.name}`;
          const filePath = path.join(uploadsDir, fileName);
          const buffer = Buffer.from(await doc.arrayBuffer());
          await writeFile(filePath, buffer);
          documentUrls.push(`/uploads/rider-documents/${fileName}`);
        }
      }
    }

    // Create user account with pending status
    const user = await prisma.user.create({
      data: {
        fullName,
        email: invitation.invitedEmail,
        phoneNumber,
        password: hashedPassword,
        userRoles: [role as "RIDER" | "STORE_MANAGER"],
        activeRole: role as "RIDER" | "STORE_MANAGER",
        emailVerified: false,
        phoneVerified: false,
        isActive: false, // Account is pending approval
      },
    });

    // Create role-specific profile
    if (role === "RIDER") {
      const vehicleType = formData.get("vehicleType") as string;
      const vehicleNumber = formData.get("vehicleNumber") as string;
      const licenseNumber = formData.get("licenseNumber") as string;
      const emergencyContact = formData.get("emergencyContact") as string;
      const emergencyPhone = formData.get("emergencyPhone") as string;

      await prisma.riderProfile.create({
        data: {
          userId: user.id,
          city: "Pending", // Will be updated during approval process
          vehicleType: vehicleType || "bike",
          vehicleNumber,
          licenseNumber,
          emergencyContact,
          emergencyPhone,
          isVerified: false,
          isActive: false, // Pending approval
        },
      });

      // Store document URLs (you might want to create a separate RiderDocument table)
      if (documentUrls.length > 0) {
        await prisma.riderProfile.update({
          where: { userId: user.id },
          data: {
            // Using licenseNumber field to store document URLs for now
            // In production, create a proper RiderDocument model
            licenseNumber: licenseNumber + "|" + JSON.stringify(documentUrls),
          },
        });
      }
    } else if (role === "STORE_MANAGER") {
      const storeId = formData.get("storeId") as string;

      if (!storeId) {
        return NextResponse.json(
          { error: "Store ID is required for store managers" },
          { status: 400 }
        );
      }

      // Assign store manager to store
      await prisma.store.update({
        where: { id: storeId },
        data: { managerId: user.id },
      });
    }

    // Mark invitation as used
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        usedAt: new Date(),
        usedBy: user.id,
        status: "USED",
      },
    });

    // Send notifications to all admins
    await notifyAdmins(user, invitation, role);

    return NextResponse.json({
      success: true,
      message:
        "Account created successfully. Your application is pending approval.",
      userId: user.id,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function notifyAdmins(user: any, invitation: any, role: string) {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: {
        userRoles: { has: "ADMIN" },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    const roleDisplay = role === "STORE_MANAGER" ? "Store Manager" : "Rider";
    const subject = `New ${roleDisplay} Application Pending Approval`;
    const message = `
A new ${roleDisplay.toLowerCase()} has applied for registration and is pending approval.

Applicant Details:
- Name: ${user.fullName}
- Email: ${user.email}
- Phone: ${user.phoneNumber}
- Invited by: ${invitation.invitedByUser?.fullName || "System"}

Please review and approve/reject the application in the admin panel.
    `;

    // Send email notifications to all admins
    for (const admin of admins) {
      if (admin.email) {
        await notificationManager.sendExternalEmail(
          admin.email,
          subject,
          message,
          undefined,
          [
            {
              label: "Review Application",
              url: `${process.env.NEXTAUTH_URL}/admin/users`,
            },
          ]
        );
      }

      // Send in-app notification
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: subject,
          message: `New ${roleDisplay.toLowerCase()} application from ${user.fullName} is pending approval.`,
          notificationType: "SYSTEM_NOTIFICATION",
          referenceId: user.id,
        },
      });
    }
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { notificationManager } from "@/lib/notificationSystem";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    // Validate invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation has already been used" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: formData.get("email") as string },
          { phoneNumber: formData.get("phoneNumber") as string },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email or phone number already exists" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads", "applications");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create uploads directory:", error);
    }

    // Handle file uploads with duplicate prevention
    const uploadedFiles: Record<string, string> = {};

    const fileFields = [
      "aadharCard",
      "panCard",
      "drivingLicense",
      "vehicleRegistration",
      "bankDetails",
      "profilePhoto",
    ];

    for (const field of fileFields) {
      const file = formData.get(field) as File | null;
      if (file && file.size > 0) {
        // Generate unique filename to prevent duplicates
        const fileExtension = file.name.split(".").pop();
        const uniqueFilename = `${field}_${Date.now()}_${randomUUID()}.${fileExtension}`;
        const filePath = join(uploadsDir, uniqueFilename);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        uploadedFiles[field] = uniqueFilename;
      }
    }

    // Hash password
    const password = formData.get("password") as string;
    const hashedPassword = await hashPassword(password);

    // Create application record
    const applicationData = {
      invitationId: invitation.id,
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      password: hashedPassword,
      role: invitation.role,

      // Rider specific data
      vehicleType: (formData.get("vehicleType") as string) || null,
      vehicleNumber: (formData.get("vehicleNumber") as string) || null,
      licenseNumber: (formData.get("licenseNumber") as string) || null,
      emergencyContact: (formData.get("emergencyContact") as string) || null,
      emergencyPhone: (formData.get("emergencyPhone") as string) || null,

      // Store manager specific data
      storeId: (formData.get("storeId") as string) || null,

      // Documents
      documents: uploadedFiles,

      // Status
      status: "PENDING",
      submittedAt: new Date(),
    };

    // Use type assertion for now until Prisma client is regenerated
    const application = await (prisma as any).application.create({
      data: applicationData,
    });

    // Update invitation status
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "USED" },
    });

    // Notify admin about new application
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          userRoles: { has: "ADMIN" },
          isActive: true,
        },
      });

      for (const admin of adminUsers) {
        await notificationManager.sendNotification(
          admin.id,
          "admin_manual",
          {
            title: `New ${invitation.role.toLowerCase()} application submitted`,
            message: `${formData.get("fullName")} has submitted an application to join as ${invitation.role === "STORE_MANAGER" ? "Store Manager" : "Rider"}.`,
            applicationId: application.id,
            applicantName: formData.get("fullName"),
            role: invitation.role,
          },
          ["in_app", "email"]
        );
      }
    } catch (notificationError) {
      console.error("Failed to send admin notification:", notificationError);
      // Don't fail the application submission if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId: application.id,
    });
  } catch (error: any) {
    console.error("Error submitting application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

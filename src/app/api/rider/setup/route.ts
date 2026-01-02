import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { notificationManager } from "@/lib/notificationSystem";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    // Extract form data
    const riderData = {
      fullName: formData.get("fullName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      email: formData.get("email") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      vehicleType: formData.get("vehicleType") as string,
      vehicleNumber: formData.get("vehicleNumber") as string,
      vehicleModel: formData.get("vehicleModel") as string,
      vehicleColor: formData.get("vehicleColor") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
      currentAddress: formData.get("currentAddress") as string,
      emergencyContactName: formData.get("emergencyContactName") as string,
      emergencyContactPhone: formData.get("emergencyContactPhone") as string,
      emergencyContactRelation: formData.get(
        "emergencyContactRelation"
      ) as string,
    };

    // Validate required fields
    if (
      !riderData.fullName ||
      !riderData.phoneNumber ||
      !riderData.email ||
      !riderData.dateOfBirth ||
      !riderData.vehicleType ||
      !riderData.vehicleNumber ||
      !riderData.vehicleModel ||
      !riderData.city ||
      !riderData.state ||
      !riderData.pincode ||
      !riderData.currentAddress ||
      !riderData.emergencyContactName ||
      !riderData.emergencyContactPhone ||
      !riderData.emergencyContactRelation
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already has an application or rider profile
    const existingApplication = await prisma.application.findFirst({
      where: { userId: session.user.id, role: "RIDER" },
    });

    const existingRider = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingApplication || existingRider) {
      return NextResponse.json(
        { error: "User already has a rider application or profile" },
        { status: 400 }
      );
    }

    // Handle file uploads
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "rider-documents"
    );
    await mkdir(uploadDir, { recursive: true });

    const documentUrls: { [key: string]: string } = {};

    const documentFields = [
      "drivingLicense",
      "vehicleRegistration",
      "aadharCard",
      "panCard",
      "photo",
      "addressProof",
    ];

    for (const field of documentFields) {
      const file = formData.get(field) as File;
      if (file && file.size > 0) {
        const fileName = `${Date.now()}-${field}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        documentUrls[field] = `/uploads/rider-documents/${fileName}`;
      } else if (
        [
          "drivingLicense",
          "vehicleRegistration",
          "aadharCard",
          "photo",
          "addressProof",
        ].includes(field)
      ) {
        return NextResponse.json(
          { error: `Missing required document: ${field}` },
          { status: 400 }
        );
      }
    }

    // Hash a dummy password for the application (user will set real password after approval)
    const dummyPassword = await bcrypt.hash("temp_password_" + Date.now(), 12);

    // Create application record
    const application = await prisma.application.create({
      data: {
        fullName: riderData.fullName,
        email: riderData.email,
        phoneNumber: riderData.phoneNumber,
        password: dummyPassword, // Will be updated after approval
        role: "RIDER",
        vehicleType: riderData.vehicleType,
        vehicleNumber: riderData.vehicleNumber,
        licenseNumber: "", // Not collected in setup
        emergencyContact: riderData.emergencyContactName,
        emergencyPhone: riderData.emergencyContactPhone,
        city: riderData.city,
        documents: documentUrls,
        userId: session.user.id, // Link to existing user
        status: "PENDING",
      },
    });

    // Send notification to admins
    try {
      const admins = await prisma.user.findMany({
        where: {
          userRoles: { has: "ADMIN" },
          isActive: true,
        },
        select: {
          id: true,
          email: true,
        },
      });

      const subject = "New Rider Application Pending Approval";
      const message = `
A new rider has applied for registration and is pending approval.

Applicant Details:
- Name: ${riderData.fullName}
- Email: ${riderData.email}
- Phone: ${riderData.phoneNumber}
- Vehicle: ${riderData.vehicleType} - ${riderData.vehicleNumber}

Please review and approve/reject the application in the admin panel.
      `;

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
                url: `${process.env.NEXTAUTH_URL}/admin/applications`,
              },
            ]
          );
        }

        // Send in-app notification
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: subject,
            message: `New rider application from ${riderData.fullName} is pending approval.`,
            notificationType: "SYSTEM_NOTIFICATION",
            referenceId: application.id,
          },
        });
      }
    } catch (error) {
      console.error("Error notifying admins:", error);
    }

    return NextResponse.json({
      success: true,
      message:
        "Rider application submitted successfully. Please wait for admin approval.",
      applicationId: application.id,
    });
  } catch (error) {
    console.error("Rider setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

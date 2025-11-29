import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
        "emergencyContactRelation",
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
        { status: 400 },
      );
    }

    // Check if user already has a rider profile
    const existingRider = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingRider) {
      return NextResponse.json(
        { error: "User already has a rider profile" },
        { status: 400 },
      );
    }

    // Handle file uploads
    const uploadDir = path.join(process.cwd(), "uploads", "riders");
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
        documentUrls[field] = `/uploads/riders/${fileName}`;
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
          { status: 400 },
        );
      }
    }

    // Get default service area
    const defaultServiceArea = await prisma.serviceArea.findFirst({
      where: { isActive: true },
    });

    if (!defaultServiceArea) {
      return NextResponse.json(
        { error: "No active service area found" },
        { status: 400 },
      );
    }

    // Create rider profile with pending status
    const riderProfile = await prisma.riderProfile.create({
      data: {
        userId: session.user.id,
        vehicleType: riderData.vehicleType,
        vehicleNumber: riderData.vehicleNumber,
        emergencyContact: riderData.emergencyContactName,
        emergencyPhone: riderData.emergencyContactPhone,
        city: riderData.city,
        isAvailable: false, // Not available until approved
        isVerified: false, // Pending verification
        isActive: false, // Pending approval
      },
    });

    // Create rider zone assignment for the default service area
    await prisma.riderZoneAssignment.create({
      data: {
        riderId: riderProfile.id,
        serviceAreaId: defaultServiceArea.id,
        assignedZones: [defaultServiceArea.name], // Default to service area
        lastValidation: new Date(),
        isCurrentlyValid: false, // Not valid until approved
        validationErrors: ["Pending approval"],
      },
    });

    // TODO: Send notification to admin for approval
    // TODO: Store document URLs in appropriate table
    // TODO: Update user profile with additional information

    return NextResponse.json({
      success: true,
      message: "Rider application submitted successfully",
      riderId: riderProfile.id,
    });
  } catch (error) {
    console.error("Rider setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

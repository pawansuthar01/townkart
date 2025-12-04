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
    const storeData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      subcategory: formData.get("subcategory") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      pincode: formData.get("pincode") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      email: formData.get("email") as string,
      operatingHours: JSON.parse(formData.get("operatingHours") as string),
    };

    // Validate required fields
    if (
      !storeData.name ||
      !storeData.description ||
      !storeData.category ||
      !storeData.address ||
      !storeData.city ||
      !storeData.state ||
      !storeData.pincode ||
      !storeData.phoneNumber ||
      !storeData.email
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already has a store
    const existingStore = await prisma.store.findFirst({
      where: { managerId: session.user.id },
    });

    if (existingStore) {
      return NextResponse.json(
        { error: "User already has a store" },
        { status: 400 }
      );
    }

    // Handle file uploads
    const uploadDir = path.join(process.cwd(), "uploads", "stores");
    await mkdir(uploadDir, { recursive: true });

    const documentUrls: { [key: string]: string } = {};

    const documentFields = [
      "businessLicense",
      "gstCertificate",
      "addressProof",
      "ownerId",
    ];

    for (const field of documentFields) {
      const file = formData.get(field) as File;
      if (file && file.size > 0) {
        const fileName = `${Date.now()}-${field}-${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);
        documentUrls[field] = `/uploads/stores/${fileName}`;
      } else if (field !== "gstCertificate") {
        // GST is optional
        return NextResponse.json(
          { error: `Missing required document: ${field}` },
          { status: 400 }
        );
      }
    }

    // Get default service area (you might want to determine this based on location)
    const defaultServiceArea = await prisma.serviceArea.findFirst({
      where: { isActive: true },
    });

    if (!defaultServiceArea) {
      return NextResponse.json(
        { error: "No active service area found" },
        { status: 400 }
      );
    }

    // Create store with pending status
    const store = await prisma.store.create({
      data: {
        name: storeData.name,
        code: `ST${Date.now()}`, // Generate unique code
        description: storeData.description,
        address: storeData.address,
        city: storeData.city,
        state: storeData.state,
        pincode: storeData.pincode,
        latitude: 0, // Will be updated with geocoding
        longitude: 0, // Will be updated with geocoding
        category: storeData.category,
        subcategory: storeData.subcategory || null,
        phoneNumber: storeData.phoneNumber,
        email: storeData.email,
        operatingHours: storeData.operatingHours,
        managerId: session.user.id,
        isActive: false, // Pending approval
        isVerified: false,
        // applicationStatus: "PENDING", // TODO: Uncomment after Prisma client regeneration
        serviceAreaId: defaultServiceArea.id,

        // Store document URLs (you might want to create a separate documents table)
        // For now, we'll store them as JSON in a custom field or extend the model
      },
    });

    // Create store staff entry for the manager
    await prisma.storeStaff.create({
      data: {
        storeId: store.id,
        userId: session.user.id,
        role: "manager",
        isActive: true,
      },
    });

    // TODO: Send notification to admin for approval
    // TODO: Store document URLs in appropriate table

    return NextResponse.json({
      success: true,
      message: "Store application submitted successfully",
      storeId: store.id,
    });
  } catch (error) {
    console.error("Store setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

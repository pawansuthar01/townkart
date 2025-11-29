import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];
    const productId = formData.get("productId") as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No image files provided" },
        { status: 400 },
      );
    }

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 },
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    // Validate files
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB per file
    const uploadedImages: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid file type for ${file.name}. Only JPEG, PNG, WebP, and GIF are allowed.`,
          },
          { status: 400 },
        );
      }

      // Validate file size
      if (file.size > maxSize) {
        return NextResponse.json(
          {
            success: false,
            message: `File ${file.name} is too large. Maximum 5MB allowed.`,
          },
          { status: 400 },
        );
      }

      // Generate unique filename
      const fileExtension = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), "public", "uploads", "products");
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Directory might already exist, continue
      }

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      // Save to database
      const imageUrl = `/uploads/products/${fileName}`;
      const productImage = await prisma.productImage.create({
        data: {
          productId,
          url: imageUrl,
          alt: file.name,
          sortOrder: i,
          isPrimary: i === 0, // First image is primary
          fileSize: file.size,
        },
      });

      uploadedImages.push({
        id: productImage.id,
        url: imageUrl,
        fileName,
        originalName: file.name,
        size: file.size,
        type: file.type,
        isPrimary: productImage.isPrimary,
        sortOrder: productImage.sortOrder,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedImages.length} product images uploaded successfully`,
      data: uploadedImages,
    });
  } catch (error: any) {
    console.error("Product images upload error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

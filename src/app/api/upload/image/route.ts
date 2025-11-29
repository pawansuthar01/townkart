import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No image file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
        },
        { status: 400 },
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "File size too large. Maximum 5MB allowed.",
        },
        { status: 400 },
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads", folder);
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

    // Return the public URL
    const imageUrl = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: imageUrl,
        fileName,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

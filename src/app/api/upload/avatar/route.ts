import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { uploadFileSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `avatar-${session.user.id}-${Date.now()}.${fileExtension}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    const filePath = join(uploadDir, fileName);
    const publicUrl = `/uploads/avatars/${fileName}`;

    // Ensure upload directory exists (create if needed)
    try {
      // For development, we'll just save to public/uploads/avatars
      const fs = require("fs");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch (error) {
      console.error("Failed to create upload directory:", error);
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Get current user to check if they have an existing avatar
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileImageUrl: true },
    });

    // Delete old avatar if it exists and is from our local storage
    if (
      user?.profileImageUrl &&
      user.profileImageUrl.startsWith("/uploads/avatars/")
    ) {
      try {
        const oldFilePath = join(process.cwd(), "public", user.profileImageUrl);
        await unlink(oldFilePath);
      } catch (error) {
        console.error("Failed to delete old avatar:", error);
        // Don't fail the request if old avatar deletion fails
      }
    }

    // Update user profile with new avatar URL
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profileImageUrl: publicUrl,
      },
      select: {
        id: true,
        profileImageUrl: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Avatar uploaded successfully",
      avatarUrl: publicUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user avatar
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileImageUrl: true },
    });

    if (!user?.profileImageUrl) {
      return NextResponse.json(
        { error: "No avatar to delete" },
        { status: 400 },
      );
    }

    // Delete from local storage if it's from our storage
    if (user.profileImageUrl.startsWith("/uploads/avatars/")) {
      try {
        const filePath = join(process.cwd(), "public", user.profileImageUrl);
        await unlink(filePath);
      } catch (error) {
        console.error("Failed to delete avatar from storage:", error);
        // Don't fail the request if storage deletion fails
      }
    }

    // Remove avatar URL from user profile
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        profileImageUrl: null,
      },
    });

    return NextResponse.json({
      message: "Avatar deleted successfully",
    });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

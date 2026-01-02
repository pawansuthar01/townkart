import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    // Check if user exists with the same email or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email: email.toLowerCase() }] : []),
          ...(phone ? [{ phoneNumber: phone }] : []),
        ],
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userRoles: true,
      },
    });

    if (existingUser) {
      return NextResponse.json({
        exists: true,
        user: existingUser,
      });
    }

    return NextResponse.json({
      exists: false,
    });
  } catch (error) {
    console.error("Error checking existing user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

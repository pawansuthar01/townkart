import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { OTPService } from "@/lib/otpService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, phoneNumber, role, token } =
      registerSchema.parse(body);

    // Check for invitation token if role is not CUSTOMER
    let invitation = null;
    if (role !== "CUSTOMER") {
      if (!token) {
        return NextResponse.json(
          {
            success: false,
            message: "Invitation token is required for this role",
          },
          { status: 400 }
        );
      }

      invitation = await prisma.invitation.findUnique({
        where: { token },
      });

      if (!invitation) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid invitation token",
          },
          { status: 400 }
        );
      }

      if (invitation.status !== "APPROVED") {
        return NextResponse.json(
          {
            success: false,
            message: "Invitation is not approved yet",
          },
          { status: 400 }
        );
      }

      if (invitation.expiresAt < new Date()) {
        return NextResponse.json(
          {
            success: false,
            message: "Invitation has expired",
          },
          { status: 400 }
        );
      }

      if (invitation.invitedEmail !== email) {
        return NextResponse.json(
          {
            success: false,
            message: "Email does not match the invitation",
          },
          { status: 400 }
        );
      }

      if (invitation.role !== role) {
        return NextResponse.json(
          {
            success: false,
            message: "Role does not match the invitation",
          },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      const conflictField =
        existingUser.email === email ? "email" : "phone number";
      return NextResponse.json(
        {
          success: false,
          message: `User with this ${conflictField} already exists. Please use a different ${conflictField} or try logging in.`,
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (inactive until OTP verification)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword, // Add the hashed password
        fullName,
        phoneNumber,
        userRoles: [role.toUpperCase() as any],
        activeRole: role.toUpperCase() as any,
        phoneVerified: false,
        emailVerified: false,
        isActive: false, // Will be activated after OTP verification
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        userRoles: true,
        activeRole: true,
      },
    });

    // Mark invitation as used if it exists
    if (invitation) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "USED",
          usedAt: new Date(),
          usedBy: user.id,
        },
      });
    }

    // Send OTP using the new service
    const result = await OTPService.sendOTP(phoneNumber, email, "REGISTER");

    if (!result.success) {
      // Delete the created user if OTP sending failed
      await prisma.user.delete({
        where: { id: user.id },
      });

      return NextResponse.json(
        { success: false, message: result.message },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        userId: user.id,
        phoneNumber,
        otpSent: true,
        channels: result.channels,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input data",
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

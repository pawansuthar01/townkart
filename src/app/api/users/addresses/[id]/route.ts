import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for address update
const updateAddressSchema = z.object({
  type: z.enum(["home", "work", "other"]).optional(),
  name: z.string().optional(), // Not stored in DB, just for UI
  line1: z.string().min(1, "Address line 1 is required").optional(),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(1, "City is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  pincode: z.string().min(1, "Pincode is required").optional(),
  isDefault: z.boolean().optional(),
});

// PUT /api/users/addresses/[id] - Update address
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = updateAddressSchema.parse(body);

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If setting as default, unset other default addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          id: { not: params.id }, // Exclude current address
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Update address
    const address = await prisma.address.update({
      where: { id: params.id },
      data: {
        ...(validatedData.line1 && { line1: validatedData.line1 }),
        ...(validatedData.line2 !== undefined && {
          line2: validatedData.line2,
        }),
        ...(validatedData.landmark !== undefined && {
          landmark: validatedData.landmark,
        }),
        ...(validatedData.city && { city: validatedData.city }),
        ...(validatedData.state && { state: validatedData.state }),
        ...(validatedData.pincode && { pincode: validatedData.pincode }),
        ...(validatedData.type && {
          addressType: validatedData.type.toUpperCase() as
            | "HOME"
            | "WORK"
            | "OTHER",
        }),
        ...(validatedData.isDefault !== undefined && {
          isDefault: validatedData.isDefault,
        }),
      },
    });

    // Transform response to match frontend interface
    const transformedAddress = {
      id: address.id,
      type: address.addressType.toLowerCase() as "home" | "work" | "other",
      name: validatedData.name || address.line1.split(",")[0] || "Address",
      line1: address.line1,
      line2: address.line2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    };

    return NextResponse.json({
      address: transformedAddress,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/users/addresses/[id] - Delete address
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if address exists and belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // Delete address
    await prisma.address.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

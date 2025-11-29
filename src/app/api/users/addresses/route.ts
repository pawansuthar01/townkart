import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for address creation
const addressSchema = z.object({
  type: z.enum(["home", "work", "other"]).default("home"),
  name: z.string().optional(), // Not stored in DB, just for UI
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(1, "Pincode is required"),
});

// GET /api/users/addresses - Get user's addresses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { isDefault: "desc" }, // Default addresses first
        { createdAt: "desc" }, // Then by creation date
      ],
    });

    // Transform to match checkout page interface
    const transformedAddresses = addresses.map((addr) => ({
      id: addr.id,
      type: addr.addressType.toLowerCase() as "home" | "work" | "other",
      name: addr.line1.split(",")[0] || "Address", // Use first part of line1 as name
      line1: addr.line1,
      line2: addr.line2,
      landmark: addr.landmark,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    }));

    return NextResponse.json({
      addresses: transformedAddresses,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/users/addresses - Create new address
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = addressSchema.parse(body);

    // If this is set as default, unset other default addresses
    if (validatedData.type === "home") {
      // Assuming home addresses are default
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create new address
    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        line1: validatedData.line1,
        line2: validatedData.line2,
        landmark: validatedData.landmark,
        city: validatedData.city,
        state: validatedData.state,
        pincode: validatedData.pincode,
        addressType: validatedData.type.toUpperCase() as
          | "HOME"
          | "WORK"
          | "OTHER",
        isDefault: validatedData.type === "home", // Home addresses are default
      },
    });

    // Transform response to match checkout page interface
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

    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

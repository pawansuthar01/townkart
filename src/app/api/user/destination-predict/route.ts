import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { predictDestinationType } from "@/lib/destinationAnalytics";

/**
 * POST /api/user/destination-predict - Predict destination type for an address
 */
export async function POST(request: NextRequest) {
  try {
    // Check user authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { address } = body;

    if (!address || typeof address !== "object") {
      return NextResponse.json(
        { error: "Address object is required" },
        { status: 400 }
      );
    }

    if (!address.line1 || !address.city || !address.state) {
      return NextResponse.json(
        { error: "Address with line1, city, and state is required" },
        { status: 400 }
      );
    }

    const prediction = await predictDestinationType(address, session.user.id);

    return NextResponse.json({
      success: true,
      data: prediction,
    });
  } catch (error: any) {
    console.error("Error predicting destination type:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

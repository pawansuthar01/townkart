import { NextRequest, NextResponse } from "next/server";
import { deliveryService } from "@/lib/deliveryService";
import { getServerSession } from "next-auth";

/**
 * POST /api/deliveries/[deliveryId]/confirm - Rider confirms delivery
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { deliveryId: string } },
) {
  try {
    // Authenticate rider
    const session = await getServerSession();
    if (!session?.user?.id || !(session.user as any).roles?.includes("RIDER")) {
      return NextResponse.json(
        { error: "Unauthorized. Only riders can confirm deliveries." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { riderLocation, proofPhotoUrl, customerOtp } = body;

    // Validate required fields
    if (!riderLocation?.latitude || !riderLocation?.longitude) {
      return NextResponse.json(
        { error: "Rider location (latitude, longitude) is required" },
        { status: 400 },
      );
    }

    if (!riderLocation.accuracy) {
      riderLocation.accuracy = 10; // Default accuracy
    }

    // Prepare delivery confirmation request
    const confirmationRequest = {
      deliveryId: params.deliveryId,
      riderId: session.user.id,
      riderLocation: {
        latitude: parseFloat(riderLocation.latitude),
        longitude: parseFloat(riderLocation.longitude),
        accuracy: parseFloat(riderLocation.accuracy),
      },
      proofPhotoUrl: proofPhotoUrl || undefined,
      customerOtp: customerOtp || undefined,
    };

    // Confirm delivery using the service
    const result = await deliveryService.confirmDelivery(confirmationRequest);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          requiresCustomerConfirmation: result.requiresCustomerConfirmation,
          autoConfirmTime: result.autoConfirmTime,
          verificationMethod: result.verificationMethod,
        },
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Delivery confirmation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

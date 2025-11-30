import { NextRequest, NextResponse } from "next/server";
import {
  getDeliveryTracking,
  generateMockDeliveryData,
} from "@/lib/deliveryTracking";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Try to get real delivery data
    try {
      const deliveryData = await getDeliveryTracking(orderId);
      return NextResponse.json(deliveryData);
    } catch (error) {
      console.warn(
        `Real delivery data not available for order ${orderId}, using mock data`
      );
      // Fallback to mock data for development/demo
      const mockData = generateMockDeliveryData(orderId);
      return NextResponse.json(mockData);
    }
  } catch (error) {
    console.error("Error fetching delivery tracking:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery tracking data" },
      { status: 500 }
    );
  }
}

// WebSocket upgrade for real-time tracking would be handled separately
// This endpoint only supports GET for HTTP requests

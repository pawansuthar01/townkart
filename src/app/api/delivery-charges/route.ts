import { NextRequest, NextResponse } from "next/server";
import {
  calculateDeliveryCharge,
  deliveryChargeManager,
} from "@/lib/deliveryCharges";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pickupLocation,
      deliveryLocation,
      orderValue,
      weight,
      priority,
      currentTime,
    } = body;

    // Validate required fields
    if (
      !pickupLocation ||
      !deliveryLocation ||
      typeof orderValue !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: pickupLocation, deliveryLocation, orderValue",
        },
        { status: 400 },
      );
    }

    // Calculate delivery charges
    const result = calculateDeliveryCharge({
      pickupLocation,
      deliveryLocation,
      orderValue,
      weight,
      priority: priority || "standard",
      currentTime: currentTime ? new Date(currentTime) : new Date(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating delivery charges:", error);
    return NextResponse.json(
      { error: "Failed to calculate delivery charges" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "config":
        return NextResponse.json(deliveryChargeManager.getConfig());

      case "analytics":
        return NextResponse.json({
          zoneStats: deliveryChargeManager.getZoneStats(),
          surgeAnalytics: deliveryChargeManager.getSurgeAnalytics(),
        });

      default:
        return NextResponse.json(
          { error: "Invalid action parameter" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error fetching delivery charge data:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery charge data" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "update_config":
        deliveryChargeManager.updateConfig(data);
        return NextResponse.json({ success: true });

      case "add_zone":
        deliveryChargeManager.addZone(data);
        return NextResponse.json({ success: true });

      case "update_zone":
        const { zoneId, updates } = data;
        deliveryChargeManager.updateZone(zoneId, updates);
        return NextResponse.json({ success: true });

      case "delete_zone":
        const { zoneId: deleteZoneId } = data;
        deliveryChargeManager.removeZone(deleteZoneId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: "Invalid action parameter" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error updating delivery charge configuration:", error);
    return NextResponse.json(
      { error: "Failed to update delivery charge configuration" },
      { status: 500 },
    );
  }
}

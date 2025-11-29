import { NextRequest, NextResponse } from "next/server";
import { orderStatusManager, OrderStatus } from "@/lib/orderStatusManagement";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, newStatus, actor, metadata, notes } = body;

    // Validate required fields
    if (!orderId || !newStatus || !actor) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, newStatus, actor" },
        { status: 400 },
      );
    }

    // Validate status
    const validStatuses: OrderStatus[] = [
      "pending",
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "picked_up",
      "in_transit",
      "delivered",
      "cancelled",
      "refunded",
      "failed",
    ];

    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 },
      );
    }

    // Transition status
    const result = await orderStatusManager.transitionStatus(
      orderId,
      newStatus,
      actor,
      metadata || {},
      notes,
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        event: result.event,
        message: `Order status updated to ${newStatus}`,
      });
    } else {
      return NextResponse.json(
        {
          error: "Status transition failed",
          details: result.errors,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const action = searchParams.get("action");

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId parameter is required" },
        { status: 400 },
      );
    }

    switch (action) {
      case "timeline":
        const timeline = orderStatusManager.getOrderTimeline(orderId);
        return NextResponse.json(timeline);

      case "current":
        const currentStatus = orderStatusManager.getCurrentStatus(orderId);
        const config = orderStatusManager.getStatusConfig(currentStatus);
        return NextResponse.json({
          status: currentStatus,
          config,
          allowedTransitions:
            orderStatusManager.getAllowedTransitions(currentStatus),
        });

      case "events":
        const events = orderStatusManager.getOrderEvents(orderId);
        return NextResponse.json(events);

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action parameter. Use 'timeline', 'current', or 'events'",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error fetching order status data:", error);
    return NextResponse.json(
      { error: "Failed to fetch order status data" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, action, ...params } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    switch (action) {
      case "bulk_update":
        const { orders, newStatus, actor, notes } = params;
        const results = [];

        for (const order of orders) {
          try {
            const result = await orderStatusManager.transitionStatus(
              order,
              newStatus,
              actor,
              {},
              notes,
            );
            results.push({
              orderId: order,
              success: result.success,
              errors: result.errors,
            });
          } catch (error) {
            results.push({
              orderId: order,
              success: false,
              errors: ["Internal error"],
            });
          }
        }

        return NextResponse.json({
          success: true,
          results,
          message: `Bulk update completed for ${orders.length} orders`,
        });

      default:
        return NextResponse.json(
          { error: "Invalid action parameter" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error performing bulk status update:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk status update" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;

    // Build date filter
    const dateFilter =
      dateFrom && dateTo
        ? {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          }
        : {};

    // Get store performance metrics
    const storeMetrics = await prisma.$queryRaw`
      SELECT
        s.id,
        s.name,
        s.city,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.final_amount), 0) as total_revenue,
        COALESCE(AVG(o.final_amount), 0) as avg_order_value,
        COUNT(CASE WHEN o.order_status = 'DELIVERED' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN o.order_status = 'CANCELLED' THEN 1 END) as cancelled_orders,
        COALESCE(AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at))/3600), 0) as avg_delivery_time_hours
      FROM stores s
      LEFT JOIN orders o ON s.id = o.store_id AND ${dateFilter}
      WHERE s.is_active = true ${storeId ? `AND s.id = ${storeId}` : ""}
      GROUP BY s.id, s.name, s.city
      ORDER BY total_revenue DESC
    `;

    // Get hourly order distribution
    const hourlyOrders = await prisma.$queryRaw`
      SELECT
        EXTRACT(HOUR FROM o.created_at) as hour,
        COUNT(*) as order_count
      FROM orders o
      ${storeId ? `JOIN stores s ON o.store_id = s.id AND s.id = ${storeId}` : ""}
      WHERE ${dateFilter}
      GROUP BY EXTRACT(HOUR FROM o.created_at)
      ORDER BY hour
    `;

    // Get top selling products
    const topProducts = await prisma.$queryRaw`
      SELECT
        p.name as product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.subtotal) as total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      ${storeId ? `WHERE o.store_id = ${storeId} AND` : "WHERE"} ${dateFilter}
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC
      LIMIT 10
    `;

    // Get rider performance for this store
    const riderPerformance = await prisma.$queryRaw`
      SELECT
        r.id,
        u.full_name as rider_name,
        COUNT(d.id) as total_deliveries,
        COUNT(CASE WHEN d.delivery_status = 'DELIVERED' THEN 1 END) as completed_deliveries,
        COALESCE(AVG(EXTRACT(EPOCH FROM (d.delivery_time - d.pickup_time))/60), 0) as avg_delivery_time_minutes,
        COALESCE(AVG(d.delivery_fee), 0) as avg_earnings
      FROM rider_profiles r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN deliveries d ON r.id = d.rider_id
      LEFT JOIN orders o ON d.order_id = o.id ${storeId ? `AND o.store_id = ${storeId}` : ""}
      WHERE ${dateFilter}
      GROUP BY r.id, u.full_name
      ORDER BY total_deliveries DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        storeMetrics,
        hourlyOrders,
        topProducts,
        riderPerformance,
      },
    });
  } catch (error) {
    console.error("Store analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // System overview metrics
    const systemOverview: any[] = await prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT s.id) as total_stores,
        COUNT(DISTINCT r.id) as total_riders,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT CASE WHEN o.order_status = 'DELIVERED' THEN o.id END) as completed_orders,
        COALESCE(SUM(o.final_amount), 0) as total_revenue,
        COALESCE(AVG(o.final_amount), 0) as avg_order_value,
        COUNT(DISTINCT CASE WHEN o.created_at >= CURRENT_DATE THEN o.id END) as orders_today,
        COUNT(DISTINCT CASE WHEN d.delivery_status = 'DELIVERED' AND d.created_at >= CURRENT_DATE THEN d.id END) as deliveries_today
      FROM stores s
      CROSS JOIN rider_profiles r
      LEFT JOIN orders o ON ${dateFilter}
      LEFT JOIN deliveries d ON d.order_id = o.id
    `;

    // City-wise performance
    const cityPerformance = await prisma.$queryRaw`
      SELECT
        COALESCE(s.city, r.city) as city,
        COUNT(DISTINCT s.id) as stores_in_city,
        COUNT(DISTINCT r.id) as riders_in_city,
        COUNT(DISTINCT o.id) as orders_in_city,
        COUNT(DISTINCT CASE WHEN o.order_status = 'DELIVERED' THEN o.id END) as completed_orders_in_city,
        COALESCE(SUM(o.final_amount), 0) as revenue_in_city
      FROM stores s
      FULL OUTER JOIN rider_profiles r ON s.city = r.city
      LEFT JOIN orders o ON (s.id = o.store_id OR r.city = s.city) AND ${dateFilter}
      WHERE COALESCE(s.city, r.city) IS NOT NULL
      GROUP BY COALESCE(s.city, r.city)
      ORDER BY revenue_in_city DESC
    `;

    // Revenue trends (daily)
    const revenueTrends = await prisma.$queryRaw`
      SELECT
        DATE(o.created_at) as date,
        COUNT(o.id) as orders,
        COALESCE(SUM(o.final_amount), 0) as revenue,
        COUNT(CASE WHEN o.order_status = 'DELIVERED' THEN 1 END) as completed_orders
      FROM orders o
      WHERE ${dateFilter}
      GROUP BY DATE(o.created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Order status distribution
    const orderStatusDistribution = await prisma.$queryRaw`
      SELECT
        o.order_status,
        COUNT(*) as count,
        ROUND(CAST(COUNT(*) AS DECIMAL) / SUM(COUNT(*)) OVER() * 100, 2) as percentage
      FROM orders o
      WHERE ${dateFilter}
      GROUP BY o.order_status
      ORDER BY count DESC
    `;

    // Top performing stores
    const topStores = await prisma.$queryRaw`
      SELECT
        s.name as store_name,
        s.city,
        COUNT(o.id) as total_orders,
        COUNT(CASE WHEN o.order_status = 'DELIVERED' THEN 1 END) as completed_orders,
        COALESCE(SUM(o.final_amount), 0) as total_revenue,
        COALESCE(AVG(o.final_amount), 0) as avg_order_value
      FROM stores s
      LEFT JOIN orders o ON s.id = o.store_id AND ${dateFilter}
      GROUP BY s.id, s.name, s.city
      ORDER BY total_revenue DESC
      LIMIT 10
    `;

    // Top performing riders
    const topRiders = await prisma.$queryRaw`
      SELECT
        u.full_name as rider_name,
        r.city,
        COUNT(d.id) as total_deliveries,
        COUNT(CASE WHEN d.delivery_status = 'DELIVERED' THEN 1 END) as completed_deliveries,
        COALESCE(SUM(d.delivery_fee), 0) as total_earnings,
        COALESCE(AVG(EXTRACT(EPOCH FROM (d.delivery_time - d.pickup_time))/60), 0) as avg_delivery_time
      FROM rider_profiles r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN deliveries d ON r.id = d.rider_id AND ${dateFilter}
      GROUP BY r.id, u.full_name, r.city
      ORDER BY total_deliveries DESC
      LIMIT 10
    `;

    // System health metrics
    const systemHealth = await prisma.$queryRaw`
      SELECT
        'active_stores' as metric,
        COUNT(CASE WHEN s.is_active = true THEN 1 END) as value
      FROM stores s
      UNION ALL
      SELECT
        'active_riders' as metric,
        COUNT(CASE WHEN r.is_available = true AND r.is_active = true THEN 1 END) as value
      FROM rider_profiles r
      UNION ALL
      SELECT
        'pending_orders' as metric,
        COUNT(CASE WHEN o.order_status IN ('ORDER_PLACED', 'STORE_ASSIGNED', 'BEING_PREPARED') THEN 1 END) as value
      FROM orders o
      WHERE ${dateFilter}
      UNION ALL
      SELECT
        'avg_order_processing_time' as metric,
        COALESCE(AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at))/60), 0) as value
      FROM orders o
      WHERE o.order_status = 'DELIVERED' AND ${dateFilter}
    `;

    return NextResponse.json({
      success: true,
      data: {
        systemOverview: systemOverview[0] as any,
        cityPerformance,
        revenueTrends,
        orderStatusDistribution,
        topStores,
        topRiders,
        systemHealth,
      },
    });
  } catch (error) {
    console.error("System analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

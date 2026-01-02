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
    const riderId = searchParams.get("riderId");
    const city = searchParams.get("city");
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;

    // Build filters
    const dateFilter =
      dateFrom && dateTo
        ? {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          }
        : {};

    const cityFilter = city ? { city } : {};

    // Get rider performance metrics
    const riderMetrics = await prisma.$queryRaw`
      SELECT
        r.id,
        u.full_name as rider_name,
        r.city,
        r.rating,
        COUNT(d.id) as total_deliveries,
        COUNT(CASE WHEN d.delivery_status = 'DELIVERED' THEN 1 END) as completed_deliveries,
        COUNT(CASE WHEN d.delivery_status = 'CANCELLED' THEN 1 END) as cancelled_deliveries,
        COALESCE(SUM(d.delivery_fee), 0) as total_earnings,
        COALESCE(AVG(d.delivery_fee), 0) as avg_earning_per_delivery,
        COALESCE(AVG(EXTRACT(EPOCH FROM (d.delivery_time - d.pickup_time))/60), 0) as avg_delivery_time_minutes,
        COALESCE(AVG(d.distance_km), 0) as avg_distance_km,
        CASE
          WHEN COUNT(d.id) > 0 THEN
            ROUND(CAST(COUNT(CASE WHEN d.delivery_status = 'DELIVERED' THEN 1 END) AS DECIMAL) / COUNT(d.id) * 100, 2)
          ELSE 0
        END as completion_rate_percentage
      FROM rider_profiles r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN deliveries d ON r.id = d.rider_id AND ${dateFilter}
      WHERE r.is_active = true ${riderId ? `AND r.id = ${riderId}` : ""} ${city ? `AND r.city = '${city}'` : ""}
      GROUP BY r.id, u.full_name, r.city, r.rating
      ORDER BY total_deliveries DESC
    `;

    // Get daily earnings trend
    const dailyEarnings = await prisma.$queryRaw`
      SELECT
        DATE(d.created_at) as date,
        COUNT(d.id) as deliveries,
        COALESCE(SUM(d.delivery_fee), 0) as earnings
      FROM deliveries d
      JOIN rider_profiles r ON d.rider_id = r.id
      WHERE d.delivery_status = 'DELIVERED' AND ${dateFilter} ${riderId ? `AND r.id = ${riderId}` : ""} ${city ? `AND r.city = '${city}'` : ""}
      GROUP BY DATE(d.created_at)
      ORDER BY date
    `;

    // Get hourly delivery distribution
    const hourlyDeliveries = await prisma.$queryRaw`
      SELECT
        EXTRACT(HOUR FROM d.created_at) as hour,
        COUNT(*) as delivery_count
      FROM deliveries d
      JOIN rider_profiles r ON d.rider_id = r.id
      WHERE ${dateFilter} ${riderId ? `AND r.id = ${riderId}` : ""} ${city ? `AND r.city = '${city}'` : ""}
      GROUP BY EXTRACT(HOUR FROM d.created_at)
      ORDER BY hour
    `;

    // Get rider efficiency scores
    const efficiencyMetrics = await prisma.$queryRaw`
      SELECT
        r.id,
        u.full_name as rider_name,
        AVG(d.distance_km) as avg_distance,
        AVG(EXTRACT(EPOCH FROM (d.delivery_time - d.pickup_time))/60) as avg_time,
        COUNT(d.id) as total_deliveries,
        SUM(d.delivery_fee) as total_earnings,
        -- Efficiency score: earnings per km per hour
        CASE
          WHEN AVG(d.distance_km) > 0 AND AVG(EXTRACT(EPOCH FROM (d.delivery_time - d.pickup_time))/3600) > 0 THEN
            ROUND(CAST(SUM(d.delivery_fee) AS DECIMAL) / (AVG(d.distance_km) * AVG(EXTRACT(EPOCH FROM (d.delivery_time - d.pickup_time))/3600)), 2)
          ELSE 0
        END as efficiency_score
      FROM rider_profiles r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN deliveries d ON r.id = d.rider_id AND d.delivery_status = 'DELIVERED' AND ${dateFilter}
      WHERE r.is_active = true ${riderId ? `AND r.id = ${riderId}` : ""} ${city ? `AND r.city = '${city}'` : ""}
      GROUP BY r.id, u.full_name
      HAVING COUNT(d.id) > 0
      ORDER BY efficiency_score DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        riderMetrics,
        dailyEarnings,
        hourlyDeliveries,
        efficiencyMetrics,
      },
    });
  } catch (error) {
    console.error("Rider analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

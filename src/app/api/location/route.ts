import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LocationService from "@/lib/locationService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "delivery-zones":
        const zones = await LocationService.getActiveDeliveryZones();
        return NextResponse.json({
          success: true,
          data: zones,
        });

      case "service-areas":
        const city = searchParams.get("city");
        const areas = await LocationService.getServiceAreas(city || undefined);
        return NextResponse.json({
          success: true,
          data: areas,
        });

      case "check-service":
        const lat = parseFloat(searchParams.get("lat") || "0");
        const lng = parseFloat(searchParams.get("lng") || "0");

        if (!lat || !lng) {
          return NextResponse.json(
            {
              success: false,
              message: "Latitude and longitude are required",
            },
            { status: 400 }
          );
        }

        const isServiced = await LocationService.isLocationServiced(lat, lng);
        const bestZone = await LocationService.findBestDeliveryZone(lat, lng);

        return NextResponse.json({
          success: true,
          data: {
            isServiced,
            deliveryZone: bestZone,
          },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            message: "Invalid action parameter",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Location API error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, latitude, longitude } = body;

    switch (action) {
      case "reverse-geocode":
        if (!latitude || !longitude) {
          return NextResponse.json(
            {
              success: false,
              message: "Latitude and longitude are required",
            },
            { status: 400 }
          );
        }

        const locationData = await LocationService.reverseGeocode(
          latitude,
          longitude
        );
        return NextResponse.json({
          success: true,
          data: locationData,
        });

      case "calculate-delivery-fee":
        const { userLat, userLng, storeLat, storeLng } = body;

        if (!userLat || !userLng || !storeLat || !storeLng) {
          return NextResponse.json(
            {
              success: false,
              message: "All coordinates are required",
            },
            { status: 400 }
          );
        }

        const deliveryFee = LocationService.calculateDeliveryFee(
          userLat,
          userLng,
          storeLat,
          storeLng
        );

        return NextResponse.json({
          success: true,
          data: { deliveryFee },
        });

      default:
        return NextResponse.json(
          {
            success: false,
            message: "Invalid action parameter",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Location API POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

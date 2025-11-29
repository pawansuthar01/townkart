import { prisma } from "./prisma";

export async function isWithinServiceArea(
  lat: number,
  lng: number
): Promise<boolean> {
  try {
    // Get all active service areas
    const serviceAreas = await (prisma as any).serviceArea.findMany({
      where: { isActive: true },
      select: {
        id: true,
        centerLat: true,
        centerLng: true,
        radiusKm: true,
        bounds: true,
      },
    });

    // Check if location is within any service area
    for (const area of serviceAreas) {
      // Distance from center check
      const distance = calculateDistance(
        area.centerLat,
        area.centerLng,
        lat,
        lng
      );

      if (distance <= area.radiusKm) {
        // Optional: Check bounding box if available
        if (area.bounds) {
          const bounds = area.bounds as any;
          const withinBounds =
            lat >= bounds.south &&
            lat <= bounds.north &&
            lng >= bounds.west &&
            lng <= bounds.east;

          if (withinBounds) {
            return true;
          }
        } else {
          // If no bounds defined, just check distance
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking service area:", error);
    return false;
  }
}

/**
 * Google Maps API integration for enhanced geolocation services
 */
export class GoogleMapsService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || "";
  }

  /**
   * Calculate distance using Google Maps Distance Matrix API
   */
  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: "driving" | "walking" | "bicycling" = "driving"
  ): Promise<{
    distance: number; // in meters
    duration: number; // in seconds
    status: string;
  }> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&mode=${mode}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status !== "OK" || data.rows[0].elements[0].status !== "OK") {
        throw new Error(`Google Maps API error: ${data.status}`);
      }

      const element = data.rows[0].elements[0];
      return {
        distance: element.distance.value, // meters
        duration: element.duration.value, // seconds
        status: "OK",
      };
    } catch (error) {
      console.error("Google Maps distance calculation error:", error);
      // Fallback to Haversine formula
      const haversineDistance = calculateDistance(
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng
      );
      return {
        distance: haversineDistance * 1000, // convert to meters
        duration: (haversineDistance / 25) * 3600, // estimate based on 25 km/h average speed
        status: "FALLBACK",
      };
    }
  }

  /**
   * Get optimized route for multiple destinations
   */
  async getOptimizedRoute(
    origin: { lat: number; lng: number },
    destinations: Array<{ lat: number; lng: number }>
  ): Promise<{
    waypoints: Array<{ lat: number; lng: number }>;
    totalDistance: number;
    totalDuration: number;
  }> {
    try {
      const waypoints = destinations.map((d) => `${d.lat},${d.lng}`).join("|");
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${origin.lat},${origin.lng}&waypoints=optimize:true|${waypoints}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Google Maps Directions API error: ${data.status}`);
      }

      const route = data.routes[0];
      const legs = route.legs;

      return {
        waypoints: route.waypoint_order.map(
          (index: number) => destinations[index]
        ),
        totalDistance: legs.reduce(
          (sum: number, leg: any) => sum + leg.distance.value,
          0
        ),
        totalDuration: legs.reduce(
          (sum: number, leg: any) => sum + leg.duration.value,
          0
        ),
      };
    } catch (error) {
      console.error("Google Maps route optimization error:", error);
      return {
        waypoints: destinations,
        totalDistance: 0,
        totalDuration: 0,
      };
    }
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<{
    lat: number;
    lng: number;
    formattedAddress: string;
  } | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status !== "OK" || data.results.length === 0) {
        throw new Error(`Geocoding failed: ${data.status}`);
      }

      const result = data.results[0];
      const location = result.geometry.location;

      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
      };
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`
      );

      const data = await response.json();

      if (data.status !== "OK" || data.results.length === 0) {
        throw new Error(`Reverse geocoding failed: ${data.status}`);
      }

      return data.results[0].formatted_address;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  }
}

// Global instance
export const googleMapsService = new GoogleMapsService();

export interface StoreAssignmentResult {
  storeId: string;
  storeName: string;
  distance: number;
  estimatedDeliveryTime: number;
}

export interface CustomerLocation {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

/**
 * Find the nearest available store to customer location (Hanumangarh restricted)
 */
export async function findNearestStore(
  customerLocation: CustomerLocation,
  maxDistance: number = 5, // 5km max distance for Hanumangarh
  useGoogleMaps: boolean = false
): Promise<StoreAssignmentResult | null> {
  try {
    // First verify customer is in service area
    if (
      !(await isWithinServiceArea(
        customerLocation.latitude,
        customerLocation.longitude
      ))
    ) {
      console.error("Customer location is outside service area");
      return null;
    }

    // Build where clause for active stores only
    // Note: Service area validation is done separately in isWithinServiceArea
    const where: any = {
      isActive: true,
      isVerified: true,
    };

    // Use the new Store model
    const stores = await (prisma as any).store.findMany({
      where,
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        operatingHours: true,
        totalOrders: true,
        averageRating: true,
        city: true,
      },
    });

    if (stores.length === 0) {
      console.error("No active stores found");
      return null;
    }

    // Calculate distances and filter by max distance
    const storesWithDistance = await Promise.all(
      stores
        .filter((store: any) => store.latitude && store.longitude)
        .map(async (store: any) => {
          let distance: number;
          let duration: number;

          if (useGoogleMaps && googleMapsService) {
            const result = await googleMapsService.calculateDistance(
              {
                lat: customerLocation.latitude,
                lng: customerLocation.longitude,
              },
              { lat: store.latitude!, lng: store.longitude! }
            );
            distance = result.distance / 1000; // Convert meters to km
            duration = result.duration / 60; // Convert seconds to minutes
          } else {
            distance = calculateDistance(
              customerLocation.latitude,
              customerLocation.longitude,
              store.latitude!,
              store.longitude!
            );
            duration = Math.max(15, 15 + Math.ceil(distance) * 2); // Estimate
          }

          return {
            ...store,
            distance,
            estimatedDuration: duration,
          };
        })
    );

    const filteredStores = storesWithDistance
      .filter((store: any) => store.distance <= maxDistance)
      .sort((a: any, b: any) => a.distance - b.distance);

    if (filteredStores.length === 0) {
      console.error(
        `No stores found within ${maxDistance}km of customer location`
      );
      return null;
    }

    const nearestStore = filteredStores[0];

    return {
      storeId: nearestStore.id,
      storeName: nearestStore.name,
      distance: nearestStore.distance,
      estimatedDeliveryTime: Math.ceil(nearestStore.estimatedDuration),
    };
  } catch (error) {
    console.error("Error finding nearest store:", error);
    return null;
  }
}

/**
 * Find and return the nearest store assignment for customer location
 * (Used during order creation - doesn't update any orders)
 */
export async function findStoreForOrder(
  customerLocation: CustomerLocation
): Promise<StoreAssignmentResult | null> {
  try {
    // Find nearest store
    const assignment = await findNearestStore(customerLocation);

    if (!assignment) {
      console.error("No suitable store found for customer location");
      return null;
    }

    console.log(
      `Found store ${assignment.storeId} (${assignment.distance.toFixed(2)}km away) for customer location`
    );

    return assignment;
  } catch (error) {
    console.error("Error finding store for order:", error);
    return null;
  }
}

/**
 * Assign order to a specific store and update order status
 * (Used after order creation for store assignment)
 */
export async function assignOrderToStore(
  orderId: string,
  storeId: string,
  assignment: StoreAssignmentResult
): Promise<boolean> {
  try {
    // Update order with store assignment
    await (prisma as any).order.update({
      where: { id: orderId },
      data: {
        storeId: storeId,
        orderStatus: "STORE_ASSIGNED",
        storeAssignedAt: new Date(),
      },
    });

    // Create order status history entry
    await (prisma as any).orderStatusHistory.create({
      data: {
        orderId,
        oldStatus: null,
        newStatus: "STORE_ASSIGNED",
        changedBy: null, // System
        changeType: "system",
        notes: `Order automatically assigned to store: ${assignment.storeName}`,
        metadata: {
          storeId: assignment.storeId,
          distance: assignment.distance,
          estimatedDeliveryTime: assignment.estimatedDeliveryTime,
        },
      },
    });

    // Update store order count
    await (prisma as any).store.update({
      where: { id: storeId },
      data: {
        totalOrders: {
          increment: 1,
        },
      },
    });

    console.log(
      `Order ${orderId} assigned to store ${storeId} (${assignment.distance.toFixed(2)}km away)`
    );

    return true;
  } catch (error) {
    console.error(`Error assigning order ${orderId} to store:`, error);
    return false;
  }
}

/**
 * Get store availability and capacity information
 */
export async function getStoreAvailability(storeId: string): Promise<{
  isAvailable: boolean;
  currentOrders: number;
  capacity: number;
  operatingHours: any;
}> {
  try {
    const store = await (prisma as any).store.findUnique({
      where: { id: storeId },
      select: {
        isActive: true,
        isVerified: true,
        operatingHours: true,
        _count: {
          select: {
            orders: {
              where: {
                orderStatus: {
                  in: [
                    "BEING_PREPARED",
                    "READY_FOR_PICKUP",
                    "RIDER_ASSIGNED",
                    "EN_ROUTE",
                  ],
                },
              },
            },
          },
        },
      },
    });

    if (!store) {
      return {
        isAvailable: false,
        currentOrders: 0,
        capacity: 0,
        operatingHours: null,
      };
    }

    // Check if store is currently open
    const isCurrentlyOpen = checkStoreOperatingHours(store.openingHours);

    // Assume capacity of 50 active orders per store
    const capacity = 50;
    const currentOrders = store._count.orders;
    const isAvailable =
      store.isActive &&
      store.isVerified &&
      isCurrentlyOpen &&
      currentOrders < capacity;

    return {
      isAvailable,
      currentOrders,
      capacity,
      operatingHours: store.openingHours,
    };
  } catch (error) {
    console.error(`Error checking store availability for ${storeId}:`, error);
    return {
      isAvailable: false,
      currentOrders: 0,
      capacity: 0,
      operatingHours: null,
    };
  }
}

/**
 * Check if store is currently operating based on hours
 */
function checkStoreOperatingHours(operatingHours: any): boolean {
  if (!operatingHours) return true; // Assume 24/7 if no hours specified

  try {
    const now = new Date();
    const dayOfWeek = now
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayHours = operatingHours[dayOfWeek];
    if (!todayHours || !todayHours.open || !todayHours.close) return false;

    const [openHour, openMinute] = todayHours.open.split(":").map(Number);
    const [closeHour, closeMinute] = todayHours.close.split(":").map(Number);

    const openTime = openHour * 60 + openMinute;
    const closeTime = closeHour * 60 + closeMinute;

    return currentTime >= openTime && currentTime <= closeTime;
  } catch (error) {
    console.error("Error checking operating hours:", error);
    return true; // Default to open on error
  }
}

/**
 * Get all stores in a city with their availability
 */
export async function getStoresByCity(city: string): Promise<
  Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    isAvailable: boolean;
    currentOrders: number;
    averageRating: number;
  }>
> {
  try {
    const stores = await (prisma as any).store.findMany({
      where: {
        city: city,
        isActive: true,
        isVerified: true,
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        averageRating: true,
        _count: {
          select: {
            orders: {
              where: {
                orderStatus: {
                  in: [
                    "BEING_PREPARED",
                    "READY_FOR_PICKUP",
                    "RIDER_ASSIGNED",
                    "EN_ROUTE",
                  ],
                },
              },
            },
          },
        },
      },
    });

    const storesWithAvailability = await Promise.all(
      stores.map(async (store: any) => {
        const availability = await getStoreAvailability(store.id);
        return {
          id: store.id,
          name: store.businessName,
          latitude: store.latitude,
          longitude: store.longitude,
          isAvailable: availability.isAvailable,
          currentOrders: availability.currentOrders,
          averageRating: store.averageRating,
        };
      })
    );

    return storesWithAvailability;
  } catch (error) {
    console.error(`Error getting stores for city ${city}:`, error);
    return [];
  }
}

/**
 * Rider geolocation tracking functions
 */
export interface RiderLocationUpdate {
  riderId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  activity?: "moving" | "stopped" | "idle";
}

/**
 * Update rider location
 */
export async function updateRiderLocation(
  update: RiderLocationUpdate
): Promise<void> {
  try {
    await (prisma as any).riderProfile.update({
      where: { id: update.riderId },
      data: {
        currentLat: update.latitude,
        currentLng: update.longitude,
        lastLocationUpdate: new Date(),
      },
    });

    // Log location update
    await (prisma as any).riderLocation.create({
      data: {
        riderId: update.riderId,
        latitude: update.latitude,
        longitude: update.longitude,
        accuracy: update.accuracy,
        speed: update.speed,
        heading: update.heading,
        activity: update.activity,
        batteryLevel: update.batteryLevel,
      },
    });

    console.log(`Updated location for rider ${update.riderId}`);
  } catch (error) {
    console.error(
      `Error updating rider location for ${update.riderId}:`,
      error
    );
    throw error;
  }
}

/**
 * Get rider locations for tracking
 */
export async function getRiderLocations(riderIds: string[]): Promise<
  Array<{
    riderId: string;
    latitude: number;
    longitude: number;
    lastUpdate: Date;
    activity: string;
  }>
> {
  try {
    const riders = await (prisma as any).riderProfile.findMany({
      where: {
        id: { in: riderIds },
        isActive: true,
      },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        lastLocationUpdate: true,
        _count: {
          select: {
            locationHistory: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                },
              },
            },
          },
        },
      },
    });

    return riders
      .filter((rider: any) => rider.currentLat && rider.currentLng)
      .map((rider: any) => ({
        riderId: rider.id,
        latitude: rider.currentLat,
        longitude: rider.currentLng,
        lastUpdate: rider.lastLocationUpdate,
        activity: rider._count.locationHistory > 0 ? "active" : "inactive",
      }));
  } catch (error) {
    console.error("Error getting rider locations:", error);
    return [];
  }
}

/**
 * Calculate distance from rider to store
 */
export async function getRiderDistanceToStore(
  riderId: string,
  storeId: string
): Promise<number | null> {
  try {
    const [rider, store] = await Promise.all([
      (prisma as any).riderProfile.findUnique({
        where: { id: riderId },
        select: { currentLat: true, currentLng: true },
      }),
      (prisma as any).store.findUnique({
        where: { id: storeId },
        select: { latitude: true, longitude: true },
      }),
    ]);

    if (
      !rider?.currentLat ||
      !rider?.currentLng ||
      !store?.latitude ||
      !store?.longitude
    ) {
      return null;
    }

    return calculateDistance(
      rider.currentLat,
      rider.currentLng,
      store.latitude,
      store.longitude
    );
  } catch (error) {
    console.error(
      `Error calculating distance from rider ${riderId} to store ${storeId}:`,
      error
    );
    return null;
  }
}

/**
 * Get nearby riders for a store
 */
export async function getNearbyRiders(
  storeId: string,
  maxDistance: number = 2, // 2km radius
  limit: number = 10
): Promise<
  Array<{
    riderId: string;
    distance: number;
    isAvailable: boolean;
    rating: number;
    vehicleType: string;
  }>
> {
  try {
    const store = await (prisma as any).store.findUnique({
      where: { id: storeId },
      select: { latitude: true, longitude: true },
    });

    if (!store?.latitude || !store?.longitude) {
      return [];
    }

    const riders = await (prisma as any).riderProfile.findMany({
      where: {
        city: store.city, // Same city as store
        isActive: true,
        isVerified: true,
        currentLat: { not: null },
        currentLng: { not: null },
      },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        isAvailable: true,
        rating: true,
        vehicleType: true,
      },
      take: limit * 2, // Get more to filter by distance
    });

    const nearbyRiders = riders
      .filter((rider: any) => {
        const distance = calculateDistance(
          store.latitude,
          store.longitude,
          rider.currentLat,
          rider.currentLng
        );
        return distance <= maxDistance;
      })
      .map((rider: any) => ({
        riderId: rider.id,
        distance: calculateDistance(
          store.latitude,
          store.longitude,
          rider.currentLat,
          rider.currentLng
        ),
        isAvailable: rider.isAvailable,
        rating: rider.rating,
        vehicleType: rider.vehicleType,
      }))
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, limit);

    return nearbyRiders;
  } catch (error) {
    console.error(`Error getting nearby riders for store ${storeId}:`, error);
    return [];
  }
}

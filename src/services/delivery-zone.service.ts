import { locationService, LocationData } from "./location.service";
import { DeliveryZone, ServiceArea } from "@/types/api.types";

export interface ZoneValidationResult {
  isValid: boolean;
  zone?: DeliveryZone;
  serviceArea?: ServiceArea;
  distanceFromZone?: number;
  distanceFromServiceArea?: number;
  warnings: string[];
  errors: string[];
}

export interface RiderZoneAssignment {
  riderId: string;
  assignedZones: DeliveryZone[];
  serviceArea: ServiceArea;
  lastValidation: Date;
  isCurrentlyValid: boolean;
}

export class DeliveryZoneService {
  private static instance: DeliveryZoneService;
  private zoneCache: Map<string, DeliveryZone[]> = new Map();
  private serviceAreaCache: Map<string, ServiceArea> = new Map();
  private cacheExpiry: Map<string, Date> = new Map();

  private constructor() {}

  static getInstance(): DeliveryZoneService {
    if (!DeliveryZoneService.instance) {
      DeliveryZoneService.instance = new DeliveryZoneService();
    }
    return DeliveryZoneService.instance;
  }

  // Validate if a location is within any delivery zone
  async validateLocationInZones(
    location: LocationData,
    riderId?: string,
  ): Promise<ZoneValidationResult> {
    const result: ZoneValidationResult = {
      isValid: false,
      warnings: [],
      errors: [],
    };

    try {
      // Get delivery zones for the area
      const zones = await this.getNearbyDeliveryZones(location);

      // Get service area
      const serviceArea = await this.getServiceAreaForLocation(location);

      if (serviceArea) {
        result.serviceArea = serviceArea;
        const inServiceArea = await locationService.isWithinServiceArea(
          location,
          serviceArea,
        );
        result.distanceFromServiceArea = locationService.calculateDistance(
          location.latitude,
          location.longitude,
          serviceArea.centerLat,
          serviceArea.centerLng,
        );

        if (!inServiceArea) {
          result.errors.push(
            `Location is outside service area (${Math.round(result.distanceFromServiceArea)}km away)`,
          );
        }
      } else {
        result.warnings.push("No service area found for this location");
      }

      // Check delivery zones
      for (const zone of zones) {
        const inZone = await locationService.isWithinDeliveryZone(
          location,
          zone,
        );
        const distance = locationService.calculateDistance(
          location.latitude,
          location.longitude,
          zone.centerLat,
          zone.centerLng,
        );

        if (inZone) {
          result.isValid = true;
          result.zone = zone;
          result.distanceFromZone = distance;
          break;
        } else if (distance <= zone.maxRadius) {
          result.distanceFromZone = distance;
          result.warnings.push(
            `Near delivery zone "${zone.name}" (${Math.round(distance)}km away)`,
          );
        }
      }

      if (!result.isValid && zones.length > 0) {
        result.errors.push("Location is not within any assigned delivery zone");
      }

      // Accuracy warnings
      if (location.accuracy && location.accuracy > 100) {
        result.warnings.push(
          `Location accuracy is low (${Math.round(location.accuracy)}m). Zone validation may be inaccurate.`,
        );
      }
    } catch (error) {
      result.errors.push(
        `Zone validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }

    return result;
  }

  // Get optimal delivery zone for a pickup/delivery location
  async findOptimalZoneForLocation(
    pickupLocation: LocationData,
    deliveryLocation: LocationData,
  ): Promise<{
    pickupZone?: DeliveryZone;
    deliveryZone?: DeliveryZone;
    sharedZone?: DeliveryZone;
    distance: number;
    estimatedTime: number;
  }> {
    const pickupZones = await this.getNearbyDeliveryZones(pickupLocation);
    const deliveryZones = await this.getNearbyDeliveryZones(deliveryLocation);

    let bestPickupZone: DeliveryZone | undefined;
    let bestDeliveryZone: DeliveryZone | undefined;
    let sharedZone: DeliveryZone | undefined;
    let minDistance = Infinity;

    // Find zones that cover both locations
    for (const pickupZone of pickupZones) {
      const pickupInZone = await locationService.isWithinDeliveryZone(
        pickupLocation,
        pickupZone,
      );

      for (const deliveryZone of deliveryZones) {
        const deliveryInZone = await locationService.isWithinDeliveryZone(
          deliveryLocation,
          deliveryZone,
        );

        if (pickupInZone && deliveryInZone) {
          // Both locations in same zone
          if (pickupZone.id === deliveryZone.id) {
            sharedZone = pickupZone;
            minDistance = 0; // Same zone
            break;
          }

          // Different zones - calculate zone-to-zone distance
          const zoneDistance = locationService.calculateDistance(
            pickupZone.centerLat,
            pickupZone.centerLng,
            deliveryZone.centerLat,
            deliveryZone.centerLng,
          );

          if (zoneDistance < minDistance) {
            minDistance = zoneDistance;
            bestPickupZone = pickupZone;
            bestDeliveryZone = deliveryZone;
          }
        }
      }

      if (sharedZone) break;
    }

    // Calculate actual distance between locations
    const actualDistance = locationService.calculateDistance(
      pickupLocation.latitude,
      pickupLocation.longitude,
      deliveryLocation.latitude,
      deliveryLocation.longitude,
    );

    // Estimate delivery time (rough calculation: 30 km/h average speed + 10 min buffer)
    const estimatedTime = (actualDistance / 30) * 60 + 10; // in minutes

    return {
      pickupZone: sharedZone || bestPickupZone,
      deliveryZone: sharedZone || bestDeliveryZone,
      sharedZone,
      distance: actualDistance,
      estimatedTime: Math.round(estimatedTime),
    };
  }

  // Assign rider to optimal zones based on their location history
  async assignRiderToZones(riderId: string): Promise<RiderZoneAssignment> {
    try {
      // Get rider's recent location history (mock implementation)
      const recentLocations = await this.getRiderRecentLocations(riderId);

      if (recentLocations.length === 0) {
        throw new Error("No recent location data available for rider");
      }

      // Find most common service area from location history
      const serviceArea =
        await this.determineServiceAreaFromHistory(recentLocations);

      // Find zones that cover the rider's operating area
      const candidateZones = await this.getNearbyDeliveryZones(
        recentLocations[0],
      );

      // Filter zones based on coverage of rider's locations
      const assignedZones: DeliveryZone[] = [];
      for (const zone of candidateZones) {
        let coverageCount = 0;
        for (const location of recentLocations) {
          const inZone = await locationService.isWithinDeliveryZone(
            location,
            zone,
          );
          if (inZone) coverageCount++;
        }

        // Assign if zone covers at least 70% of recent locations
        if (coverageCount >= recentLocations.length * 0.7) {
          assignedZones.push(zone);
        }
      }

      const assignment: RiderZoneAssignment = {
        riderId,
        assignedZones,
        serviceArea,
        lastValidation: new Date(),
        isCurrentlyValid: assignedZones.length > 0,
      };

      // Cache the assignment
      this.cacheRiderAssignment(assignment);

      return assignment;
    } catch (error) {
      console.error(`Failed to assign zones for rider ${riderId}:`, error);
      throw error;
    }
  }

  // Validate rider's current assignment
  async validateRiderAssignment(
    riderId: string,
    currentLocation: LocationData,
  ): Promise<boolean> {
    const assignment = await this.getRiderAssignment(riderId);

    if (!assignment || !assignment.isCurrentlyValid) {
      return false;
    }

    // Check if current location is in any assigned zone
    for (const zone of assignment.assignedZones) {
      const inZone = await locationService.isWithinDeliveryZone(
        currentLocation,
        zone,
      );
      if (inZone) {
        return true;
      }
    }

    return false;
  }

  // Get nearby delivery zones for a location
  private async getNearbyDeliveryZones(
    location: LocationData,
  ): Promise<DeliveryZone[]> {
    // Mock implementation - in real app, this would query database
    // For now, return zones within 10km
    const mockZones: DeliveryZone[] = [
      {
        id: "zone_1",
        name: "Downtown Zone",
        code: "DT001",
        boundaries: {},
        centerLat: location.latitude + 0.01,
        centerLng: location.longitude + 0.01,
        radiusKm: 5,
        baseDeliveryFee: 20,
        perKmFee: 5,
        maxRadius: 10,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "zone_2",
        name: "Suburb Zone",
        code: "SB001",
        boundaries: {},
        centerLat: location.latitude - 0.02,
        centerLng: location.longitude - 0.02,
        radiusKm: 8,
        baseDeliveryFee: 25,
        perKmFee: 6,
        maxRadius: 15,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    return mockZones.filter((zone) => {
      const distance = locationService.calculateDistance(
        location.latitude,
        location.longitude,
        zone.centerLat,
        zone.centerLng,
      );
      return distance <= zone.maxRadius;
    });
  }

  // Get service area for a location
  private async getServiceAreaForLocation(
    location: LocationData,
  ): Promise<ServiceArea | null> {
    // Mock implementation
    return {
      id: "area_1",
      name: "Hanumangarh Service Area",
      city: "Hanumangarh",
      state: "Rajasthan",
      centerLat: 29.5818,
      centerLng: 74.3294,
      radiusKm: 15,
      bounds: {
        north: 29.7,
        south: 29.5,
        east: 74.4,
        west: 74.2,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Get rider's recent locations (mock implementation)
  private async getRiderRecentLocations(
    riderId: string,
  ): Promise<LocationData[]> {
    // In real implementation, query RiderLocation table
    return [
      {
        latitude: 29.5818,
        longitude: 74.3294,
        accuracy: 10,
        timestamp: Date.now(),
      },
      {
        latitude: 29.582,
        longitude: 74.33,
        accuracy: 15,
        timestamp: Date.now() - 60000,
      },
    ];
  }

  // Determine service area from location history
  private async determineServiceAreaFromHistory(
    locations: LocationData[],
  ): Promise<ServiceArea> {
    // Simple implementation - use first location to determine area
    return (await this.getServiceAreaForLocation(locations[0])) as ServiceArea;
  }

  // Cache rider assignment
  private cacheRiderAssignment(assignment: RiderZoneAssignment): void {
    const key = `rider_assignment_${assignment.riderId}`;
    localStorage.setItem(key, JSON.stringify(assignment));
  }

  // Get cached rider assignment
  private async getRiderAssignment(
    riderId: string,
  ): Promise<RiderZoneAssignment | null> {
    const key = `rider_assignment_${riderId}`;
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  }

  // Calculate delivery fee based on zone and distance
  calculateDeliveryFee(zone: DeliveryZone, distance: number): number {
    const baseFee = zone.baseDeliveryFee;
    const additionalFee = Math.max(0, distance - zone.radiusKm) * zone.perKmFee;
    return Math.round((baseFee + additionalFee) * 100) / 100; // Round to 2 decimal places
  }

  // Get zone performance metrics
  async getZonePerformanceMetrics(zoneId: string): Promise<{
    totalDeliveries: number;
    averageDeliveryTime: number;
    riderUtilization: number;
    customerSatisfaction: number;
  }> {
    // Mock implementation
    return {
      totalDeliveries: 150,
      averageDeliveryTime: 28, // minutes
      riderUtilization: 0.85, // 85%
      customerSatisfaction: 4.2, // out of 5
    };
  }
}

// Export singleton instance
export const deliveryZoneService = DeliveryZoneService.getInstance();

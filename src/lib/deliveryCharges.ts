// Delivery Charge Calculation System

export interface DeliveryZone {
  id: string;
  name: string;
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  baseCharge: number;
  perKmCharge: number;
  minimumCharge: number;
  maximumCharge?: number;
  freeDeliveryThreshold?: number;
  estimatedDeliveryTime: number; // in minutes
  isActive: boolean;
}

export interface DeliveryChargeConfig {
  zones: DeliveryZone[];
  defaultBaseCharge: number;
  defaultPerKmCharge: number;
  defaultMinimumCharge: number;
  defaultMaximumCharge?: number;
  freeDeliveryThreshold: number;
  surgePricingEnabled: boolean;
  surgeMultiplier: number;
  peakHours: Array<{
    start: string; // HH:MM format
    end: string; // HH:MM format
    multiplier: number;
  }>;
  specialDays: Array<{
    date: string; // YYYY-MM-DD format
    multiplier: number;
    description: string;
  }>;
}

export interface DeliveryCalculationInput {
  pickupLocation: {
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    latitude: number;
    longitude: number;
  };
  orderValue: number;
  weight?: number; // in kg
  priority?: "standard" | "express" | "same_day";
  specialInstructions?: string;
  currentTime?: Date;
}

export interface DeliveryChargeResult {
  baseCharge: number;
  distanceCharge: number;
  weightCharge: number;
  priorityCharge: number;
  surgeCharge: number;
  discount: number;
  totalCharge: number;
  estimatedDistance: number; // in km
  estimatedTime: number; // in minutes
  zone?: DeliveryZone | null;
  breakdown: Array<{
    label: string;
    amount: number;
    description?: string;
  }>;
  appliedDiscounts: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
}

// Default delivery charge configuration
export const DEFAULT_DELIVERY_CONFIG: DeliveryChargeConfig = {
  zones: [
    {
      id: "zone_1",
      name: "Downtown Bangalore",
      coordinates: [
        { latitude: 12.9716, longitude: 77.5946 },
        { latitude: 12.9816, longitude: 77.6046 },
        { latitude: 12.9616, longitude: 77.5846 },
      ],
      baseCharge: 30,
      perKmCharge: 8,
      minimumCharge: 40,
      maximumCharge: 200,
      freeDeliveryThreshold: 500,
      estimatedDeliveryTime: 30,
      isActive: true,
    },
    {
      id: "zone_2",
      name: "North Bangalore",
      coordinates: [
        { latitude: 13.0827, longitude: 77.5866 },
        { latitude: 13.0927, longitude: 77.5966 },
        { latitude: 13.0727, longitude: 77.5766 },
      ],
      baseCharge: 35,
      perKmCharge: 10,
      minimumCharge: 45,
      maximumCharge: 250,
      freeDeliveryThreshold: 600,
      estimatedDeliveryTime: 45,
      isActive: true,
    },
    {
      id: "zone_3",
      name: "South Bangalore",
      coordinates: [
        { latitude: 12.8656, longitude: 77.5846 },
        { latitude: 12.8756, longitude: 77.5946 },
        { latitude: 12.8556, longitude: 77.5746 },
      ],
      baseCharge: 40,
      perKmCharge: 12,
      minimumCharge: 50,
      maximumCharge: 300,
      freeDeliveryThreshold: 700,
      estimatedDeliveryTime: 50,
      isActive: true,
    },
  ],
  defaultBaseCharge: 50,
  defaultPerKmCharge: 15,
  defaultMinimumCharge: 60,
  defaultMaximumCharge: 500,
  freeDeliveryThreshold: 1000,
  surgePricingEnabled: true,
  surgeMultiplier: 1.5,
  peakHours: [
    { start: "08:00", end: "10:00", multiplier: 1.2 }, // Morning peak
    { start: "12:00", end: "14:00", multiplier: 1.3 }, // Lunch time
    { start: "18:00", end: "21:00", multiplier: 1.5 }, // Evening peak
  ],
  specialDays: [
    {
      date: "2024-12-25",
      multiplier: 2.0,
      description: "Christmas Day",
    },
    {
      date: "2024-12-31",
      multiplier: 1.8,
      description: "New Year's Eve",
    },
  ],
};

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Determine delivery zone based on coordinates
export function determineDeliveryZone(
  latitude: number,
  longitude: number,
  zones: DeliveryZone[],
): DeliveryZone | null {
  // Simple distance-based zone determination
  // In production, use proper polygon containment algorithms
  for (const zone of zones) {
    if (zone.coordinates.length > 0) {
      const zoneLat = zone.coordinates[0].latitude;
      const zoneLng = zone.coordinates[0].longitude;
      const distance = calculateDistance(latitude, longitude, zoneLat, zoneLng);

      // If within 5km of zone center, consider it in zone
      if (distance <= 5 && zone.isActive) {
        return zone;
      }
    }
  }
  return null;
}

// Calculate surge multiplier based on time and special days
export function calculateSurgeMultiplier(
  currentTime: Date,
  config: DeliveryChargeConfig,
): number {
  if (!config.surgePricingEnabled) return 1;

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

  // Check peak hours
  for (const peakHour of config.peakHours) {
    if (
      currentTimeString >= peakHour.start &&
      currentTimeString <= peakHour.end
    ) {
      return peakHour.multiplier;
    }
  }

  // Check special days
  const currentDate = currentTime.toISOString().split("T")[0];
  const specialDay = config.specialDays.find((day) => day.date === currentDate);
  if (specialDay) {
    return specialDay.multiplier;
  }

  return 1;
}

// Calculate weight-based charges
export function calculateWeightCharge(weight: number): number {
  if (!weight || weight <= 1) return 0; // Free for up to 1kg

  const extraWeight = weight - 1;
  return Math.ceil(extraWeight * 20); // ₹20 per extra kg
}

// Calculate priority charges
export function calculatePriorityCharge(
  priority: "standard" | "express" | "same_day",
  baseCharge: number,
): number {
  switch (priority) {
    case "express":
      return Math.ceil(baseCharge * 0.5); // 50% extra for express
    case "same_day":
      return Math.ceil(baseCharge * 1.0); // 100% extra for same day
    default:
      return 0;
  }
}

// Calculate delivery charges
export function calculateDeliveryCharge(
  input: DeliveryCalculationInput,
  config: DeliveryChargeConfig = DEFAULT_DELIVERY_CONFIG,
): DeliveryChargeResult {
  const {
    pickupLocation,
    deliveryLocation,
    orderValue,
    weight = 0,
    priority = "standard",
    currentTime = new Date(),
  } = input;

  // Calculate distance
  const distance = calculateDistance(
    pickupLocation.latitude,
    pickupLocation.longitude,
    deliveryLocation.latitude,
    deliveryLocation.longitude,
  );

  // Determine zone
  const zone = determineDeliveryZone(
    deliveryLocation.latitude,
    deliveryLocation.longitude,
    config.zones,
  );

  // Get zone-specific or default charges
  const baseCharge = zone?.baseCharge || config.defaultBaseCharge;
  const perKmCharge = zone?.perKmCharge || config.defaultPerKmCharge;
  const minimumCharge = zone?.minimumCharge || config.defaultMinimumCharge;
  const maximumCharge = zone?.maximumCharge || config.defaultMaximumCharge;
  const freeDeliveryThreshold =
    zone?.freeDeliveryThreshold || config.freeDeliveryThreshold;
  const estimatedTime = zone?.estimatedDeliveryTime || 60;

  // Calculate base charges
  const distanceCharge = Math.ceil(distance * perKmCharge);
  const weightCharge = calculateWeightCharge(weight);
  const priorityCharge = calculatePriorityCharge(priority, baseCharge);

  // Calculate surge multiplier
  const surgeMultiplier = calculateSurgeMultiplier(currentTime, config);

  // Apply surge pricing
  const surgedBaseCharge = Math.ceil(baseCharge * surgeMultiplier);
  const surgedDistanceCharge = Math.ceil(distanceCharge * surgeMultiplier);
  const surgedWeightCharge = Math.ceil(weightCharge * surgeMultiplier);
  const surgedPriorityCharge = Math.ceil(priorityCharge * surgeMultiplier);

  // Calculate total before discounts
  const subtotal =
    surgedBaseCharge +
    surgedDistanceCharge +
    surgedWeightCharge +
    surgedPriorityCharge;

  // Apply minimum and maximum limits
  const afterLimits = Math.max(
    minimumCharge,
    Math.min(maximumCharge || subtotal, subtotal),
  );

  // Calculate discounts
  let discount = 0;
  const appliedDiscounts: DeliveryChargeResult["appliedDiscounts"] = [];

  // Free delivery threshold
  if (orderValue >= freeDeliveryThreshold) {
    discount = afterLimits;
    appliedDiscounts.push({
      type: "free_delivery",
      amount: discount,
      description: `Free delivery on orders above ₹${freeDeliveryThreshold}`,
    });
  }

  // Calculate final total
  const totalCharge = Math.max(0, afterLimits - discount);

  // Create breakdown
  const breakdown: DeliveryChargeResult["breakdown"] = [
    {
      label: "Base Charge",
      amount: surgedBaseCharge,
      description: zone ? `Zone: ${zone.name}` : "Standard delivery",
    },
    {
      label: "Distance Charge",
      amount: surgedDistanceCharge,
      description: `${distance.toFixed(1)} km @ ₹${perKmCharge}/km`,
    },
  ];

  if (weightCharge > 0) {
    breakdown.push({
      label: "Weight Charge",
      amount: surgedWeightCharge,
      description: `${weight}kg additional weight`,
    });
  }

  if (priorityCharge > 0) {
    breakdown.push({
      label: "Priority Charge",
      amount: surgedPriorityCharge,
      description: `${priority} delivery`,
    });
  }

  if (surgeMultiplier > 1) {
    breakdown.push({
      label: "Surge Charge",
      amount: Math.ceil(
        (subtotal - subtotal / surgeMultiplier) * surgeMultiplier,
      ),
      description: `${((surgeMultiplier - 1) * 100).toFixed(0)}% surge pricing`,
    });
  }

  if (discount > 0) {
    breakdown.push({
      label: "Discount",
      amount: -discount,
      description: appliedDiscounts[0]?.description,
    });
  }

  return {
    baseCharge: surgedBaseCharge,
    distanceCharge: surgedDistanceCharge,
    weightCharge: surgedWeightCharge,
    priorityCharge: surgedPriorityCharge,
    surgeCharge: Math.ceil(
      (subtotal - subtotal / surgeMultiplier) * surgeMultiplier,
    ),
    discount,
    totalCharge,
    estimatedDistance: distance,
    estimatedTime,
    zone,
    breakdown,
    appliedDiscounts,
  };
}

// Admin functions for managing delivery charges
export class DeliveryChargeManager {
  private config: DeliveryChargeConfig;

  constructor(config: DeliveryChargeConfig = DEFAULT_DELIVERY_CONFIG) {
    this.config = config;
  }

  // Update delivery configuration
  updateConfig(newConfig: Partial<DeliveryChargeConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Add new delivery zone
  addZone(zone: DeliveryZone): void {
    this.config.zones.push(zone);
  }

  // Update existing zone
  updateZone(zoneId: string, updates: Partial<DeliveryZone>): void {
    const index = this.config.zones.findIndex((z) => z.id === zoneId);
    if (index !== -1) {
      this.config.zones[index] = { ...this.config.zones[index], ...updates };
    }
  }

  // Remove zone
  removeZone(zoneId: string): void {
    this.config.zones = this.config.zones.filter((z) => z.id !== zoneId);
  }

  // Get current configuration
  getConfig(): DeliveryChargeConfig {
    return this.config;
  }

  // Calculate charges using current config
  calculateCharge(input: DeliveryCalculationInput): DeliveryChargeResult {
    return calculateDeliveryCharge(input, this.config);
  }

  // Get zone statistics
  getZoneStats(): Array<{
    zone: DeliveryZone;
    deliveryCount: number;
    averageCharge: number;
    totalRevenue: number;
  }> {
    // TODO: connect to DB/API
    return [];
  }

  // Get surge pricing analytics
  getSurgeAnalytics(): {
    currentMultiplier: number;
    peakHours: Array<{
      time: string;
      multiplier: number;
      activeDeliveries: number;
    }>;
    specialDays: Array<{
      date: string;
      multiplier: number;
      description: string;
    }>;
  } {
    const currentTime = new Date();
    const currentMultiplier = calculateSurgeMultiplier(
      currentTime,
      this.config,
    );

    return {
      currentMultiplier,
      peakHours: this.config.peakHours.map((peak) => ({
        time: `${peak.start}-${peak.end}`,
        multiplier: peak.multiplier,
        activeDeliveries: 0, // TODO: connect to DB/API
      })),
      specialDays: this.config.specialDays,
    };
  }
}

// Export default manager instance
export const deliveryChargeManager = new DeliveryChargeManager();

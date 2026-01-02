import { prisma } from "@/lib/prisma";

export interface LocationInfo {
  ip: string;
  success: boolean;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
  pincode?: string;
  zone?: any;
  isServiced?: boolean;
  deliveryFee?: number;
  error?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  boundaries: any; // GeoJSON
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  baseDeliveryFee: number;
  perKmFee: number;
  isActive: boolean;
}

export class LocationService {
  /**
   * Parse user agent string to extract device info
   */
  static parseUserAgent(userAgent: string): {
    deviceType: string;
    os: string;
    browser: string;
  } {
    const ua = userAgent.toLowerCase();

    // Device type detection
    let deviceType = "desktop";
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      deviceType = "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      deviceType = "tablet";
    }

    // OS detection
    let os = "Unknown";
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("macintosh") || ua.includes("mac os x")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

    // Browser detection
    let browser = "Unknown";
    if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari") && !ua.includes("chrome"))
      browser = "Safari";
    else if (ua.includes("edg")) browser = "Edge";
    else if (ua.includes("opera")) browser = "Opera";

    return { deviceType, os, browser };
  }

  /**
   * SERVER-SAFE: IP → GEO lookup with fallback
   */
  static async lookupIP(ip: string): Promise<any> {
    // Skip lookup for local/private IPs
    if (this.isPrivateIP(ip)) {
      return {
        ip,
        country_name: "Local",
        city: "Local",
        region: "Local",
        latitude: 0,
        longitude: 0,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const url = `https://ipapi.co/${ip}/json/`;
      const res = await fetch(url, {
        headers: { "User-Agent": "TownKart/1.0" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`IP lookup failed for ${ip}: ${res.status}`);
        return null;
      }

      const data = await res.json();

      // Validate response has required fields
      if (!data || typeof data !== "object") {
        console.warn(`Invalid IP lookup response for ${ip}`);
        return null;
      }

      return data;
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn(`IP lookup timeout for ${ip}`);
      } else {
        console.error(`IP lookup error for ${ip}:`, err.message);
      }
      return null;
    }
  }

  /**
   * Check if IP is private/local
   */
  private static isPrivateIP(ip: string): boolean {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;

    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);

    // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8
    return (
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      first === 127
    );
  }

  /**
   * Reverse GPS → Address lookup with fallback
   */
  static async reverseGeocode(lat: number, lng: number): Promise<any> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const res = await fetch(url, { signal: controller.signal });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Reverse geocode failed: ${res.status}`);
        return {};
      }

      const d = await res.json();

      return {
        address: d.locality || d.city || null,
        city: d.city || null,
        state: d.principalSubdivision || null,
        pincode: d.postcode || null,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn("Reverse geocode timeout");
      } else {
        console.error("Reverse geocode error:", err.message);
      }
      return {};
    }
  }

  /**
   * Haversine distance
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRadians(d: number) {
    return d * (Math.PI / 180);
  }

  /**
   * Check if coordinates are inside a delivery zone
   */
  static isPointInZone(lat: number, lng: number, zone: DeliveryZone): boolean {
    const distance = this.calculateDistance(
      lat,
      lng,
      zone.centerLat,
      zone.centerLng
    );
    return distance <= zone.radiusKm;
  }

  /**
   * Get active delivery zones
   */
  static async getActiveDeliveryZones(): Promise<DeliveryZone[]> {
    try {
      return await prisma.deliveryZone.findMany({
        where: { isActive: true },
      });
    } catch (err) {
      console.error("Zone fetch error:", err);
      return [];
    }
  }

  /**
   * Best delivery zone (based on radius + lowest base fee)
   */
  static async findBestDeliveryZone(lat: number, lng: number) {
    const zones = await this.getActiveDeliveryZones();
    const valid = zones.filter((z) => this.isPointInZone(lat, lng, z));
    if (!valid.length) return null;

    return valid.reduce((best, cur) =>
      cur.baseDeliveryFee < best.baseDeliveryFee ? cur : best
    );
  }

  /**
   * Calculate delivery fee
   */
  static calculateDeliveryFee(
    userLat: number,
    userLng: number,
    storeLat: number,
    storeLng: number,
    zone?: DeliveryZone
  ) {
    const distance = this.calculateDistance(
      userLat,
      userLng,
      storeLat,
      storeLng
    );

    if (zone) {
      const extra = Math.max(0, distance - 2);
      return zone.baseDeliveryFee + extra * zone.perKmFee;
    }

    return 20 + distance * 5;
  }

  /**
   * Check if location is inside any service area
   */
  static async isLocationServiced(lat: number, lng: number) {
    try {
      const areas = await prisma.serviceArea.findMany({
        where: { isActive: true },
      });

      return areas.some((area) => {
        const distance = this.calculateDistance(
          lat,
          lng,
          area.centerLat,
          area.centerLng
        );
        return distance <= area.radiusKm;
      });
    } catch (err) {
      console.error("Service area error:", err);
      return false;
    }
  }

  /**
   * ⭐ MAIN METHOD → FULL LOCATION INFO using client IP
   */
  static async getLocationInfoFromIP(ip: string): Promise<LocationInfo> {
    try {
      const data = await this.lookupIP(ip);

      if (!data || !data.latitude || !data.longitude) {
        return {
          success: false,
          ip: ip,
          error: "Unable to determine location from IP",
        };
      }

      const lat = data.latitude;
      const lng = data.longitude;

      // Reverse geocode
      const geo = await this.reverseGeocode(lat, lng);

      // Zone
      const zone = await this.findBestDeliveryZone(lat, lng);

      // Service check
      const isServiced = await this.isLocationServiced(lat, lng);

      return {
        success: true,
        ip,
        country: data.country_name || undefined,
        region: data.region || undefined,
        city: data.city || undefined,
        latitude: lat,
        longitude: lng,
        address: geo.address || undefined,
        pincode: geo.pincode || undefined,
        zone: zone
          ? {
              id: zone.id,
              name: zone.name,
              radiusKm: zone.radiusKm,
              baseDeliveryFee: zone.baseDeliveryFee,
              perKmFee: zone.perKmFee,
            }
          : undefined,
        isServiced,
      };
    } catch (err: any) {
      console.error("getLocationInfoFromIP error:", err);
      return {
        success: false,
        ip: ip,
        error: err.message,
      };
    }
  }
}

export default LocationService;

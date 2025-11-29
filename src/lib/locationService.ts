export interface LocationData {
  ip: string;
  country?: string;
  city?: string;
  region?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  isp?: string;
}

export class LocationService {
  /**
   * Get location information from IP address using production-ready geolocation service
   */
  static async getLocationFromIP(ip: string): Promise<LocationData> {
    try {
      // Skip geolocation for local/private IPs
      if (this.isLocalOrPrivateIP(ip)) {
        return {
          ip,
          country: "Unknown",
          city: "Local Network",
          region: "Local",
          lat: undefined,
          lng: undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          isp: "Local Network",
        };
      }

      // Use ipapi.co for production geolocation (free tier available)
      const API_KEY = process.env.IPAPI_KEY; // Optional: add API key for higher limits
      const url = API_KEY
        ? `https://ipapi.co/${ip}/json/?key=${API_KEY}`
        : `https://ipapi.co/${ip}/json/`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "TownKart/1.0",
        },
        // Add timeout
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`IP API returned ${response.status}`);
      }

      const data = await response.json();

      // Check if API returned an error
      if (data.error) {
        throw new Error(data.reason || "IP API error");
      }

      return {
        ip,
        country: data.country_name || data.country,
        city: data.city,
        region: data.region || data.region_code,
        lat: data.latitude ? parseFloat(data.latitude) : undefined,
        lng: data.longitude ? parseFloat(data.longitude) : undefined,
        timezone: data.timezone,
        isp: data.org || data.asn,
      };
    } catch (error) {
      console.error("Error getting location from IP:", error);

      // Fallback: try alternative service (ipinfo.io)
      try {
        const fallbackResponse = await fetch(`https://ipinfo.io/${ip}/json`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "TownKart/1.0",
          },
          signal: AbortSignal.timeout(3000),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();

          if (!fallbackData.error) {
            const [lat, lng] = fallbackData.loc
              ? fallbackData.loc.split(",").map(parseFloat)
              : [undefined, undefined];

            return {
              ip,
              country: fallbackData.country,
              city: fallbackData.city,
              region: fallbackData.region,
              lat,
              lng,
              timezone: fallbackData.timezone,
              isp: fallbackData.org,
            };
          }
        }
      } catch (fallbackError) {
        console.error("Fallback IP service also failed:", fallbackError);
      }

      // Final fallback
      return {
        ip,
        country: "Unknown",
        city: "Unknown",
        region: "Unknown",
        lat: undefined,
        lng: undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isp: "Unknown",
      };
    }
  }

  /**
   * Check if IP is local or private
   */
  private static isLocalOrPrivateIP(ip: string): boolean {
    // Localhost
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("127.")) {
      return true;
    }

    // Private IP ranges
    const parts = ip.split(".");
    if (parts.length !== 4) return false;

    const first = parseInt(parts[0]);
    const second = parseInt(parts[1]);

    // 10.0.0.0/8
    if (first === 10) return true;

    // 172.16.0.0/12
    if (first === 172 && second >= 16 && second <= 31) return true;

    // 192.168.0.0/16
    if (first === 192 && second === 168) return true;

    // Link-local (169.254.0.0/16) - but we'll geolocate these
    // APIPA (169.254.0.0/16) is public, so don't treat as private

    return false;
  }

  /**
   * Parse user agent string to extract device info
   */
  static parseUserAgent(userAgent: string): {
    deviceType: string;
    os?: string;
    browser?: string;
  } {
    const ua = userAgent.toLowerCase();

    // Detect device type
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

    // Detect OS
    let os: string | undefined;
    if (ua.includes("windows")) os = "Windows";
    else if (ua.includes("macintosh") || ua.includes("mac os x")) os = "macOS";
    else if (ua.includes("linux")) os = "Linux";
    else if (ua.includes("android")) os = "Android";
    else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

    // Detect browser
    let browser: string | undefined;
    if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
    else if (ua.includes("firefox")) browser = "Firefox";
    else if (ua.includes("safari") && !ua.includes("chrome"))
      browser = "Safari";
    else if (ua.includes("edg")) browser = "Edge";
    else if (ua.includes("opera")) browser = "Opera";
    else browser = "Unknown";

    return { deviceType, os, browser };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

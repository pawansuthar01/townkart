import { LocationData } from "./location.service";

export interface LocationConsentRecord {
  consentId?: string; // Added for tracking
  userId: string;
  consentGiven: boolean;
  consentTimestamp: Date;
  consentPurpose: string;
  consentExpiry?: Date;
  dataRetentionPeriod: number; // in days
  dataUsage: string[];
  withdrawalTimestamp?: Date;
}

export interface LocationDataRecord {
  id: string;
  userId: string;
  location: LocationData;
  purpose: string;
  collectedAt: Date;
  retentionExpiry: Date;
  isAnonymized: boolean;
  consentId: string;
}

export class GDPRLocationService {
  private static instance: GDPRLocationService;

  private constructor() {}

  static getInstance(): GDPRLocationService {
    if (!GDPRLocationService.instance) {
      GDPRLocationService.instance = new GDPRLocationService();
    }
    return GDPRLocationService.instance;
  }

  // Record user consent for location data collection
  async recordConsent(
    consent: Omit<LocationConsentRecord, "consentTimestamp">,
  ): Promise<string> {
    const consentId = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, this would be stored in a database
    const consentRecord: LocationConsentRecord = {
      ...consent,
      consentTimestamp: new Date(),
      consentExpiry: consent.dataRetentionPeriod
        ? new Date(
            Date.now() + consent.dataRetentionPeriod * 24 * 60 * 60 * 1000,
          )
        : undefined,
    };

    // Store consent record (mock implementation)
    this.storeConsentRecord(consentId, consentRecord);

    return consentId;
  }

  // Check if user has valid consent for location data collection
  async hasValidConsent(userId: string, purpose: string): Promise<boolean> {
    const consentRecords = this.getConsentRecords(userId);

    const validConsent = consentRecords.find(
      (record) =>
        record.consentGiven &&
        !record.withdrawalTimestamp &&
        record.consentPurpose === purpose &&
        (!record.consentExpiry || record.consentExpiry > new Date()),
    );

    return !!validConsent;
  }

  // Withdraw consent for location data collection
  async withdrawConsent(userId: string, consentId?: string): Promise<void> {
    const consentRecords = this.getConsentRecords(userId);

    if (consentId) {
      // Withdraw specific consent
      const record = consentRecords.find((r) => r.consentId === consentId);
      if (record) {
        record.withdrawalTimestamp = new Date();
        this.updateConsentRecord(consentId, record);
      }
    } else {
      // Withdraw all consents for user
      consentRecords.forEach((record) => {
        record.withdrawalTimestamp = new Date();
        this.updateConsentRecord(record.consentId!, record);
      });
    }

    // Schedule data deletion
    this.scheduleDataDeletion(userId);
  }

  // Store location data with GDPR compliance
  async storeLocationData(
    userId: string,
    location: LocationData,
    purpose: string,
    consentId: string,
  ): Promise<void> {
    // Check if consent is still valid
    const hasConsent = await this.hasValidConsent(userId, purpose);
    if (!hasConsent) {
      throw new Error("No valid consent for location data collection");
    }

    const consentRecord = this.getConsentRecords(userId).find(
      (r) => r.consentPurpose === purpose && r.consentGiven,
    );

    if (!consentRecord) {
      throw new Error("Consent record not found");
    }

    const locationRecord: LocationDataRecord = {
      id: `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      location,
      purpose,
      collectedAt: new Date(),
      retentionExpiry: new Date(
        Date.now() + consentRecord.dataRetentionPeriod * 24 * 60 * 60 * 1000,
      ),
      isAnonymized: false,
      consentId,
    };

    // Store location data (mock implementation)
    this.storeLocationRecord(locationRecord);

    // Log data collection for audit purposes
    this.logDataCollection(userId, purpose, location);
  }

  // Anonymize location data after retention period
  async anonymizeExpiredData(): Promise<void> {
    const expiredRecords = this.getExpiredLocationRecords();

    expiredRecords.forEach((record) => {
      // Anonymize the location data
      const anonymizedLocation: LocationData = {
        ...record.location,
        latitude: Math.round(record.location.latitude * 100) / 100, // Round to 2 decimal places
        longitude: Math.round(record.location.longitude * 100) / 100,
        accuracy: undefined, // Remove accuracy for privacy
        timestamp: record.location.timestamp,
      };

      record.location = anonymizedLocation;
      record.isAnonymized = true;

      this.updateLocationRecord(record.id, record);
    });
  }

  // Delete location data after retention period or consent withdrawal
  async deleteExpiredData(): Promise<void> {
    const expiredRecords = this.getExpiredLocationRecords();
    const withdrawnRecords = this.getWithdrawnLocationRecords();

    const recordsToDelete = [...expiredRecords, ...withdrawnRecords];

    recordsToDelete.forEach((record) => {
      this.deleteLocationRecord(record.id);
    });
  }

  // Get data portability export for user
  async exportUserData(userId: string): Promise<{
    consentRecords: LocationConsentRecord[];
    locationRecords: LocationDataRecord[];
  }> {
    const consentRecords = this.getConsentRecords(userId);
    const locationRecords = this.getLocationRecords(userId);

    return {
      consentRecords,
      locationRecords,
    };
  }

  // Generate privacy notice for location data collection
  generatePrivacyNotice(purpose: string): string {
    const notices = {
      delivery_tracking: `
        Location Data Privacy Notice

        We collect your location data to:
        - Track delivery progress in real-time
        - Ensure accurate ETAs for customers
        - Optimize delivery routes
        - Maintain service quality

        Your location data is:
        - Collected only during active deliveries
        - Stored securely and encrypted
        - Retained for 30 days after delivery completion
        - Used solely for delivery operations
        - Not shared with third parties without your consent

        You can withdraw consent at any time through your app settings.
      `,
      rider_safety: `
        Rider Safety Location Data Notice

        We collect location data to:
        - Monitor rider safety during deliveries
        - Respond quickly to emergency situations
        - Ensure riders are within service areas
        - Provide real-time support when needed

        Your location data is:
        - Collected only when you're active as a rider
        - Used exclusively for safety and operational purposes
        - Stored with bank-level encryption
        - Retained for 90 days for safety audit purposes
        - Never used for marketing or tracking outside work

        You can disable this feature in your rider settings.
      `,
      customer_service: `
        Customer Service Location Notice

        We collect your location to:
        - Provide accurate delivery estimates
        - Find the nearest available stores
        - Optimize delivery assignments
        - Improve our service quality

        Your location data is:
        - Collected only when you request location-based services
        - Processed securely and anonymously where possible
        - Stored for 7 days for service improvement
        - Not used for advertising or tracking
        - Always optional - you can enter addresses manually

        You can clear your location history anytime.
      `,
    };

    return notices[purpose as keyof typeof notices] || notices.customer_service;
  }

  // Log all location data operations for audit compliance
  private logDataCollection(
    userId: string,
    purpose: string,
    location: LocationData,
  ): void {
    const logEntry = {
      timestamp: new Date(),
      userId,
      action: "LOCATION_DATA_COLLECTED",
      purpose,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      },
      ipAddress: "client_ip", // Would be obtained from request
      userAgent: navigator.userAgent,
    };

    // Store audit log (mock implementation)
    this.storeAuditLog(logEntry);
  }

  // Mock storage implementations (replace with actual database calls)
  private storeConsentRecord(
    consentId: string,
    record: LocationConsentRecord,
  ): void {
    const key = `consent_${consentId}`;
    localStorage.setItem(key, JSON.stringify({ ...record, consentId }));
  }

  private getConsentRecords(userId: string): LocationConsentRecord[] {
    const records: LocationConsentRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("consent_")) {
        const record = JSON.parse(localStorage.getItem(key)!);
        if (record.userId === userId) {
          records.push(record);
        }
      }
    }
    return records;
  }

  private updateConsentRecord(
    consentId: string,
    record: LocationConsentRecord,
  ): void {
    const key = `consent_${consentId}`;
    localStorage.setItem(key, JSON.stringify(record));
  }

  private storeLocationRecord(record: LocationDataRecord): void {
    const key = `location_${record.id}`;
    localStorage.setItem(key, JSON.stringify(record));
  }

  private getLocationRecords(userId: string): LocationDataRecord[] {
    const records: LocationDataRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("location_")) {
        const record = JSON.parse(localStorage.getItem(key)!);
        if (record.userId === userId) {
          records.push(record);
        }
      }
    }
    return records;
  }

  private updateLocationRecord(
    recordId: string,
    record: LocationDataRecord,
  ): void {
    const key = `location_${recordId}`;
    localStorage.setItem(key, JSON.stringify(record));
  }

  private deleteLocationRecord(recordId: string): void {
    const key = `location_${recordId}`;
    localStorage.removeItem(key);
  }

  private getExpiredLocationRecords(): LocationDataRecord[] {
    const records: LocationDataRecord[] = [];
    const now = new Date();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("location_")) {
        const record = JSON.parse(localStorage.getItem(key)!);
        if (new Date(record.retentionExpiry) < now) {
          records.push(record);
        }
      }
    }
    return records;
  }

  private getWithdrawnLocationRecords(): LocationDataRecord[] {
    const withdrawnConsents = new Set<string>();
    const records: LocationDataRecord[] = [];

    // Find withdrawn consents
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("consent_")) {
        const consent = JSON.parse(localStorage.getItem(key)!);
        if (consent.withdrawalTimestamp) {
          withdrawnConsents.add(consent.consentId);
        }
      }
    }

    // Find location records for withdrawn consents
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("location_")) {
        const record = JSON.parse(localStorage.getItem(key)!);
        if (withdrawnConsents.has(record.consentId)) {
          records.push(record);
        }
      }
    }

    return records;
  }

  private scheduleDataDeletion(userId: string): void {
    // In a real implementation, this would schedule a background job
    setTimeout(() => {
      this.deleteExpiredData();
    }, 1000); // Immediate deletion for demo
  }

  private storeAuditLog(logEntry: any): void {
    const key = `audit_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(logEntry));
  }
}

// Export singleton instance
export const gdprLocationService = GDPRLocationService.getInstance();

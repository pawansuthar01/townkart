import { prisma } from "@/lib/prisma";

export interface OTPSettings {
  delivery_method: "email" | "sms" | "both";
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  otp_length: number;
  expiry_minutes: number;
  max_attempts: number;
  cooldown_minutes: number;
}

export class OTPService {
  private static async getAdminOTPSettings(): Promise<OTPSettings> {
    try {
      const settings = await prisma.systemSetting.findMany({
        where: {
          category: "otp",
        },
      });

      const otpSettings: OTPSettings = {
        delivery_method: "sms",
        email_enabled: true,
        sms_enabled: true,
        whatsapp_enabled: false,
        otp_length: 6,
        expiry_minutes: 10,
        max_attempts: 3,
        cooldown_minutes: 5,
      };

      settings.forEach((setting) => {
        try {
          const value = JSON.parse(setting.value);
          if (setting.key in otpSettings) {
            (otpSettings as any)[setting.key] = value;
          }
        } catch {
          // Use default values if parsing fails
        }
      });

      return otpSettings;
    } catch (error) {
      console.error("Error fetching OTP settings:", error);
      return {
        delivery_method: "sms",
        email_enabled: true,
        sms_enabled: true,
        whatsapp_enabled: false,
        otp_length: 6,
        expiry_minutes: 10,
        max_attempts: 3,
        cooldown_minutes: 5,
      };
    }
  }

  static generateOTP(length: number = 6): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  static async sendOTP(
    phoneNumber: string,
    email: string | null,
    purpose: "LOGIN" | "REGISTER" | "RESET_PASSWORD" = "LOGIN",
  ): Promise<{ success: boolean; message: string; channels: string[] }> {
    try {
      const settings = await this.getAdminOTPSettings();

      // Check cooldown period
      const recentOTP = await prisma.oTP.findFirst({
        where: {
          phoneNumber,
          createdAt: {
            gt: new Date(Date.now() - settings.cooldown_minutes * 60 * 1000),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (recentOTP) {
        const timeLeft = Math.ceil(
          (recentOTP.createdAt.getTime() +
            settings.cooldown_minutes * 60 * 1000 -
            Date.now()) /
            1000 /
            60,
        );
        return {
          success: false,
          message: `Please wait ${timeLeft} minutes before requesting another OTP`,
          channels: [],
        };
      }

      // Check max attempts
      const recentAttempts = await prisma.oTP.count({
        where: {
          phoneNumber,
          createdAt: {
            gt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      if (recentAttempts >= settings.max_attempts * 3) {
        // Allow 3x max_attempts per day
        return {
          success: false,
          message: "Too many OTP requests today. Please try again tomorrow.",
          channels: [],
        };
      }

      const otp = this.generateOTP(settings.otp_length);
      const expiresAt = new Date(
        Date.now() + settings.expiry_minutes * 60 * 1000,
      );

      // Create OTP record
      await prisma.oTP.create({
        data: {
          phoneNumber,
          otp,
          purpose,
          expiresAt,
        },
      });

      const channels: string[] = [];

      // Send based on delivery method and enabled channels
      if (settings.delivery_method === "sms" && settings.sms_enabled) {
        await this.sendSMS(phoneNumber, otp, purpose);
        channels.push("SMS");
      } else if (
        settings.delivery_method === "email" &&
        settings.email_enabled &&
        email
      ) {
        await this.sendEmail(email, otp, purpose);
        channels.push("Email");
      } else if (settings.delivery_method === "both") {
        if (settings.sms_enabled) {
          await this.sendSMS(phoneNumber, otp, purpose);
          channels.push("SMS");
        }
        if (settings.email_enabled && email) {
          await this.sendEmail(email, otp, purpose);
          channels.push("Email");
        }
      }

      // Send WhatsApp if enabled (fallback or additional)
      if (settings.whatsapp_enabled) {
        await this.sendWhatsApp(phoneNumber, otp, purpose);
        channels.push("WhatsApp");
      }

      return {
        success: true,
        message: `OTP sent successfully via ${channels.join(", ")}`,
        channels,
      };
    } catch (error) {
      console.error("Error sending OTP:", error);
      return {
        success: false,
        message: "Failed to send OTP. Please try again.",
        channels: [],
      };
    }
  }

  private static async sendSMS(
    phoneNumber: string,
    otp: string,
    purpose: string,
  ): Promise<void> {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    console.log(`Sending SMS OTP ${otp} to ${phoneNumber} for ${purpose}`);

    // Mock implementation - replace with actual SMS service
    // Example with Twilio:
    // const twilio = require('twilio')(accountSid, authToken);
    // await twilio.messages.create({
    //   body: `Your OTP for ${purpose} is: ${otp}`,
    //   from: '+1234567890',
    //   to: phoneNumber
    // });
  }

  private static async sendEmail(
    email: string,
    otp: string,
    purpose: string,
  ): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Sending Email OTP ${otp} to ${email} for ${purpose}`);

    // Mock implementation - replace with actual email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: email,
    //   from: 'noreply@townkart.com',
    //   subject: `Your OTP for ${purpose}`,
    //   text: `Your OTP is: ${otp}`,
    //   html: `<strong>Your OTP is: ${otp}</strong>`
    // });
  }

  private static async sendWhatsApp(
    phoneNumber: string,
    otp: string,
    purpose: string,
  ): Promise<void> {
    // TODO: Integrate with WhatsApp Business API
    console.log(`Sending WhatsApp OTP ${otp} to ${phoneNumber} for ${purpose}`);

    // Mock implementation - replace with actual WhatsApp service
    // Example with Twilio WhatsApp:
    // const twilio = require('twilio')(accountSid, authToken);
    // await twilio.messages.create({
    //   body: `Your OTP for ${purpose} is: ${otp}`,
    //   from: 'whatsapp:+14155238886',
    //   to: `whatsapp:${phoneNumber}`
    // });
  }

  static async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const otpRecord = await prisma.oTP.findFirst({
        where: {
          phoneNumber,
          otp,
          isUsed: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (!otpRecord) {
        return false;
      }

      // Mark OTP as used
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      return true;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return false;
    }
  }

  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      await prisma.oTP.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error("Error cleaning up expired OTPs:", error);
    }
  }
}

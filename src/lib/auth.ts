import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RateLimiter } from "@/middleware/rateLimit";
import { DeviceTracker } from "@/middleware/deviceTracking";
import { DeviceManager } from "@/lib/deviceManager";
import { LocationService } from "@/lib/locationService";

// Utility functions
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateAccessToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "30d",
  });
};

export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
  } catch (error) {
    return null;
  }
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "otp",
      name: "otp",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        otp: { label: "OTP", type: "text" },
        deviceInfo: { label: "Device Info", type: "text" },
      },
      async authorize(credentials) {
        console.log("🔐 OTP authorize called with:", {
          hasPhoneNumber: !!credentials?.phoneNumber,
          phoneNumber: credentials?.phoneNumber,
        });

        if (!credentials?.phoneNumber) {
          console.log("❌ No phone number provided");
          return null;
        }

        // Find user by phone number (OTP already verified by API)
        const user = await prisma.user.findUnique({
          where: { phoneNumber: credentials.phoneNumber },
          select: {
            id: true,
            email: true,
            fullName: true,
            userRoles: true,
            activeRole: true,
            phoneVerified: true,
            isActive: true,
          },
        });

        console.log("👤 User lookup result:", {
          userFound: !!user,
          userId: user?.id,
          isActive: user?.isActive,
          phoneVerified: user?.phoneVerified,
        });

        if (!user || !user.isActive) {
          console.log("❌ User not found or not active");
          return null;
        }

        console.log("✅ OTP authorize returning user:", user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          roles: user.userRoles,
          activeRole: user.activeRole,
          phoneVerified: user.phoneVerified,
          isActive: user.isActive,
        } as any;
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "boolean" },
        deviceInfo: { label: "Device Info", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        // Determine if identifier is email or phone number

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.identifier },
              { phoneNumber: credentials.identifier },
            ],
          },
          include: {
            customerProfile: true,
            riderProfile: true,
          },
        });
        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) {
          // Check if user is admin for rate limiting

          // Log failed login attempt using RateLimiter
          await RateLimiter.recordLoginAttempt(
            credentials.identifier,
            "unknown", // IP will be set by middleware
            null, // userAgent will be set by middleware
            false,
            "INVALID_PASSWORD",
            user.id
          );

          return null;
        }

        // Check if user is admin for special handling

        // Log successful login using RateLimiter
        await RateLimiter.recordLoginAttempt(
          credentials.identifier,
          "unknown", // IP will be set by middleware
          null, // userAgent will be set by middleware
          true,
          undefined,
          user.id
        );

        // Update last login info
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        });

        console.log("✅ User authenticated, returning:", {
          id: user.id,
          email: user.email,
          name: user.fullName,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.profileImageUrl,
          roles: user.userRoles,
          activeRole: user.activeRole,
          rememberMe: credentials.rememberMe === "true",
        } as any;
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // If user just signed in, set initial token data
      if (user) {
        token.id = user.id;
        token.phoneNumber = (user as any).phoneNumber;
        token.activeRole = (user as any).activeRole;
        token.roles = (user as any).roles;
        token.phoneVerified = (user as any).phoneVerified;
        token.isActive = (user as any).isActive;
      }

      // Always fetch fresh user data for token (or on update trigger)
      if (token.sub) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            include: {
              customerProfile: true,
              riderProfile: true,
              storeStaff: {
                include: {
                  store: {
                    include: {
                      serviceArea: true,
                    },
                  },
                },
              },
              managedStores: {
                include: {
                  serviceArea: true,
                },
              },
              addresses: true,
              orders: {
                take: 5,
                orderBy: { createdAt: "desc" },
              },
              reviews: {
                take: 5,
                orderBy: { createdAt: "desc" },
              },
              notifications: {
                where: { isRead: false },
                take: 10,
              },
              wallet: true,
              wishlistItems: {
                take: 10,
                include: {
                  product: true,
                },
              },
              sessions: {
                take: 5,
                orderBy: { createdAt: "desc" },
              },
              devices: {
                take: 5,
                orderBy: { lastLoginAt: "desc" },
              },
              loginAttempts: {
                take: 10,
                orderBy: { createdAt: "desc" },
              },
              _count: {
                select: {
                  orders: true,
                  reviews: true,
                  wishlistItems: true,
                  addresses: true,
                },
              },
            },
          });

          if (dbUser) {
            // Store all user data in token
            token.phoneNumber = dbUser.phoneNumber;
            token.activeRole = dbUser.activeRole;
            token.roles = dbUser.userRoles;
            token.phoneVerified = dbUser.phoneVerified;
            token.isActive = dbUser.isActive;
            token.email = dbUser.email;
            token.name = dbUser.fullName;
            token.profileImageUrl = dbUser.profileImageUrl;
            token.emailVerified = dbUser.emailVerified;
            token.lastLoginAt = dbUser.lastLoginAt;
            token.lastLoginIP = dbUser.lastLoginIP;
            token.lastLoginDevice = dbUser.lastLoginDevice;
            token.createdAt = dbUser.createdAt;
            token.updatedAt = dbUser.updatedAt;

            // Relations data
            (token as any).customerProfile = dbUser.customerProfile;
            (token as any).riderProfile = dbUser.riderProfile;
            (token as any).storeStaff = dbUser.storeStaff;
            (token as any).managedStores = dbUser.managedStores;
            (token as any).addresses = dbUser.addresses;
            (token as any).recentOrders = dbUser.orders;
            (token as any).recentReviews = dbUser.reviews;
            (token as any).unreadNotifications = dbUser.notifications;
            (token as any).wallet = dbUser.wallet;
            (token as any).wishlistItems = dbUser.wishlistItems;
            (token as any).recentSessions = dbUser.sessions;
            (token as any).devices = dbUser.devices;
            (token as any).recentLoginAttempts = dbUser.loginAttempts;

            // Counts
            (token as any).stats = {
              totalOrders: dbUser._count.orders,
              totalReviews: dbUser._count.reviews,
              totalWishlistItems: dbUser._count.wishlistItems,
              totalAddresses: dbUser._count.addresses,
            };

            // Store-specific data for STORE_MANAGER
            if (
              dbUser.activeRole === "STORE_MANAGER" &&
              dbUser.storeStaff?.length > 0
            ) {
              const storeStaff = dbUser.storeStaff[0];
              (token as any).storeData = {
                storeId: storeStaff.storeId,
                store: storeStaff.store,
                role: storeStaff.role,
                isActive: storeStaff.isActive,
              };
            }
          }
        } catch (error) {
          console.error("Error fetching user data for token:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      console.log("🎫 Session callback triggered", {
        hasToken: !!token,
        userId: token?.sub,
      });

      if (token?.sub) {
        // Set all user data from token (no database call needed)
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        (session.user as any).phoneNumber = token.phoneNumber;
        (session.user as any).userRoles = token.roles;
        (session.user as any).activeRole = token.activeRole;
        (session.user as any).profileImageUrl =
          (token as any).profileImageUrl || "";
        (session.user as any).emailVerified = (token as any).emailVerified;
        (session.user as any).phoneVerified = token.phoneVerified;
        (session.user as any).isActive = token.isActive;
        (session.user as any).lastLoginAt = (token as any).lastLoginAt;
        (session.user as any).lastLoginIP = (token as any).lastLoginIP;
        (session.user as any).lastLoginDevice = (token as any).lastLoginDevice;
        (session.user as any).createdAt = (token as any).createdAt;
        (session.user as any).updatedAt = (token as any).updatedAt;

        // Relations data from token
        session.user.customerProfile = (token as any).customerProfile;
        session.user.riderProfile = (token as any).riderProfile;
        session.user.storeStaff = (token as any).storeStaff;
        session.user.managedStores = (token as any).managedStores;
        session.user.addresses = (token as any).addresses;
        session.user.recentOrders = (token as any).recentOrders;
        session.user.recentReviews = (token as any).recentReviews;
        session.user.unreadNotifications = (token as any).unreadNotifications;
        session.user.wallet = (token as any).wallet;
        session.user.wishlistItems = (token as any).wishlistItems;
        session.user.recentSessions = (token as any).recentSessions;
        session.user.devices = (token as any).devices;
        session.user.recentLoginAttempts = (token as any).recentLoginAttempts;
        session.user.stats = (token as any).stats;
        session.user.storeData = (token as any).storeData;
      }

      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("🔐 Sign in event triggered", {
        userId: user.id,
        provider: account?.provider,
      });

      if (account?.provider === "google") {
        try {
          // Check if user exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create new user from Google profile
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                fullName: user.name!,
                phoneNumber: "0000000000", // Placeholder phone number for Google users
                profileImageUrl: user.image,
                emailVerified: true,
                phoneVerified: false,
                userRoles: ["CUSTOMER"],
                activeRole: "CUSTOMER",
                customerProfile: {
                  create: {},
                },
              },
            });

            user.id = newUser.id;
            (user as any).roles = ["CUSTOMER"];
            (user as any).activeRole = "CUSTOMER";
          } else {
            // Update existing user with Google info if needed
            user.id = existingUser.id;
            (user as any).roles = existingUser.userRoles;
            (user as any).activeRole = existingUser.activeRole;
          }
        } catch (error) {
          console.error("Error during Google sign in:", error);
        }
      }

      // Track device and session information for all sign ins
      if (user.id) {
        console.log(
          `User ${user.id} signed in via ${account?.provider || "credentials"}`
        );
      }
    },
    async signOut({ session, token }) {
      console.log("🚪 Sign out event triggered", {
        sessionId: session?.id,
        userId: token?.sub,
      });

      // Database cleanup is handled by /api/auth/logout API
      // This event is just for logging
      if (token?.sub) {
        console.log(`User ${token.sub} signed out (NextAuth event)`);
      }
    },
    async createUser({ user }) {
      console.log("👤 Create user event triggered", { userId: user.id });
    },
    async updateUser({ user }) {
      console.log("📝 Update user event triggered", { userId: user.id });
    },
    async linkAccount({ user, account, profile }) {
      console.log("🔗 Link account event triggered", {
        userId: user.id,
        provider: account.provider,
      });
    },
    async session({ session, token }) {
      console.log("🎫 Session event triggered", {
        sessionId: session.id,
        userId: token?.sub,
      });
    },
  },
};

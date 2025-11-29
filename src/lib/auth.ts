import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RateLimiter } from "@/middleware/rateLimit";
import { DeviceTracker } from "@/middleware/deviceTracking";

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
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }
        console.log(credentials);
        // Determine if identifier is email or phone number
        const isEmail = credentials.identifier.includes("@");

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

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          image: user.profileImageUrl,
          roles: user.userRoles,
          activeRole: user.activeRole,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("🔐 JWT callback triggered", {
        hasUser: !!user,
        tokenSub: token.sub,
      });
      if (user) {
        token.roles = (user as any).roles;
        token.activeRole = (user as any).activeRole;
        console.log("✅ JWT token updated with user data", {
          roles: token.roles,
          activeRole: token.activeRole,
        });
      }
      return token;
    },
    async session({ session, token }) {
      console.log("🎫 Session callback triggered", {
        hasToken: !!token,
        tokenSub: token?.sub,
      });
      if (token) {
        session.user.id = token.sub!;
        (session.user as any).roles = token.roles;
        (session.user as any).activeRole = token.activeRole;

        // Fetch complete user data with all relations
        try {
          console.log("🔍 Fetching complete user data for session:", token.sub);
          const user = await prisma.user.findUnique({
            where: { id: token.sub! },
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
                take: 5, // Last 5 orders
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

          if (user) {
            console.log(
              "✅ Found user:",
              user.fullName,
              "Role:",
              user.activeRole
            );
            console.log("📊 StoreStaff count:", user.storeStaff?.length || 0);

            // Basic user info
            session.user.id = user.id;
            session.user.name = user.fullName;
            session.user.email = user.email;
            (session.user as any).image = user.profileImageUrl;

            // Complete user data
            (session.user as any).phoneNumber = user.phoneNumber;
            (session.user as any).userRoles = user.userRoles;
            (session.user as any).activeRole = user.activeRole;
            (session.user as any).profileImageUrl = user.profileImageUrl;
            (session.user as any).emailVerified = user.emailVerified;
            (session.user as any).phoneVerified = user.phoneVerified;
            (session.user as any).isActive = user.isActive;
            (session.user as any).lastLoginAt = user.lastLoginAt;
            (session.user as any).lastLoginIP = user.lastLoginIP;
            (session.user as any).lastLoginDevice = user.lastLoginDevice;
            (session.user as any).createdAt = user.createdAt;
            (session.user as any).updatedAt = user.updatedAt;

            // Relations data - cast to any to access included relations
            const fullUser = user as any;
            (session.user as any).customerProfile = fullUser.customerProfile;
            (session.user as any).riderProfile = fullUser.riderProfile;
            (session.user as any).storeStaff = fullUser.storeStaff;
            (session.user as any).managedStores = fullUser.managedStores;
            (session.user as any).addresses = fullUser.addresses;
            (session.user as any).recentOrders = fullUser.orders;
            (session.user as any).recentReviews = fullUser.reviews;
            (session.user as any).unreadNotifications = fullUser.notifications;
            (session.user as any).wallet = fullUser.wallet;
            (session.user as any).wishlistItems = fullUser.wishlistItems;
            (session.user as any).recentSessions = fullUser.sessions;
            (session.user as any).devices = fullUser.devices;
            (session.user as any).recentLoginAttempts = fullUser.loginAttempts;

            // Counts
            (session.user as any).stats = {
              totalOrders: fullUser._count.orders,
              totalReviews: fullUser._count.reviews,
              totalWishlistItems: fullUser._count.wishlistItems,
              totalAddresses: fullUser._count.addresses,
            };

            // Store-specific data for STORE_MANAGER
            if (
              fullUser.activeRole === "STORE_MANAGER" &&
              fullUser.storeStaff?.length > 0
            ) {
              const storeStaff = fullUser.storeStaff[0];
              (session.user as any).storeData = {
                storeId: storeStaff.storeId,
                store: storeStaff.store,
                role: storeStaff.role,
                isActive: storeStaff.isActive,
              };
            }
          }
        } catch (error) {
          console.error(
            "Error fetching complete user data for session:",
            error
          );
        }
      }
      console.log("🎯 Final session user data:", {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        activeRole: (session.user as any).activeRole,
        hasStoreData: !!(session.user as any).storeData,
        phoneNumber: (session.user as any).phoneNumber,
      });
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
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

            (user as any).id = newUser.id;
            (user as any).roles = ["CUSTOMER"];
            (user as any).activeRole = "CUSTOMER";
          } else {
            // Update existing user with Google info if needed
            (user as any).id = existingUser.id;
            (user as any).roles = existingUser.userRoles;
            (user as any).activeRole = existingUser.activeRole;
          }
        } catch (error) {
          console.error("Error during Google sign in:", error);
        }
      }
      // Track device and session information for all sign ins
      if ((user as any).id) {
        console.log(
          `User ${(user as any).id} signed in via ${account?.provider || "credentials"}`
        );
      }
    },
    async signOut({ token }) {
      // Clean up sessions if needed
      if (token?.sub) {
        console.log(`User ${token.sub} signed out`);
      }
    },
  },
};

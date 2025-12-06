import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    id?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phoneNumber?: string;
      activeRole?: string;
      roles?: string[];
      isVerified?: boolean;
      userRoles?: string[];
      profileImageUrl?: string;
      emailVerified?: boolean;
      phoneVerified?: boolean;
      isActive?: boolean;
      lastLoginAt?: Date;
      lastLoginIP?: string;
      lastLoginDevice?: string;
      createdAt?: Date;
      updatedAt?: Date;
      customerProfile?: any;
      riderProfile?: any;
      storeStaff?: any;
      managedStores?: any;
      addresses?: any;
      recentOrders?: any;
      recentReviews?: any;
      unreadNotifications?: any;
      wallet?: any;
      wishlistItems?: any;
      recentSessions?: any;
      devices?: any;
      recentLoginAttempts?: any;
      stats?: {
        totalOrders: number;
        totalReviews: number;
        totalWishlistItems: number;
        totalAddresses: number;
      };
      storeData?: any;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    phoneNumber: string;
    activeRole: string;
    roles: string[];
    isVerified: boolean;
  }

  interface JWT {
    id?: string;
    sub?: string;
    phoneNumber?: string;
    activeRole?: string;
    roles?: string[];
    isVerified?: boolean;
    rememberMe?: boolean;
    exp?: number;
  }
}

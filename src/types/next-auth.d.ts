import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phoneNumber?: string;
      activeRole?: string;
      isVerified?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    phoneNumber: string;
    activeRole: string;
    isVerified: boolean;
  }

  interface JWT {
    id: string;
    phoneNumber?: string;
    activeRole?: string;
    isVerified?: boolean;
  }
}

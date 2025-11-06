import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// In-memory user store (for demo purposes - replace with database in production)
const users: any[] = [
  {
    id: "1",
    email: "customer@townkart.com",
    password: "$2b$10$.v0PCRhLhNKEcrR.xbiyGOX/Co51ap63q4zhMxIDlUEFr4Pp/DXpW", // password: customer123
    fullName: "John Customer",
    phoneNumber: "+91 98765 43210",
    activeRole: "CUSTOMER",
    isVerified: true,
    createdAt: new Date(),
  },
  {
    id: "2",
    email: "merchant@townkart.com",
    password: "$2b$10$sLI9EkD8SLsY1YmAFeL/TOxjJGr0ePjrKVLjh/Neg1aRXW9A09Tvq", // password: merchant123
    fullName: "Sarah Merchant",
    phoneNumber: "+91 98765 43211",
    activeRole: "MERCHANT",
    isVerified: true,
    createdAt: new Date(),
  },
  {
    id: "3",
    email: "rider@townkart.com",
    password: "$2b$10$IaVRphAbP0WLbq5zKy3AfuHFSmXI1AoTsM5NPR/Ej4aLICDXA4/QS", // password: rider123
    fullName: "Mike Rider",
    phoneNumber: "+91 98765 43212",
    activeRole: "RIDER",
    isVerified: true,
    createdAt: new Date(),
  },
];

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = users.find((u) => u.email === credentials.email);

        if (!user) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          phoneNumber: user.phoneNumber,
          activeRole: user.activeRole,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: JWT_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phoneNumber = (user as any).phoneNumber;
        token.activeRole = (user as any).activeRole;
        token.isVerified = (user as any).isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).phoneNumber = token.phoneNumber;
        (session.user as any).activeRole = token.activeRole;
        (session.user as any).isVerified = token.isVerified;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

// Helper functions for custom auth
export const generateToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Mock user registration (in production, save to database)
export const registerUser = async (userData: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: string;
}) => {
  const existingUser = users.find((u) => u.email === userData.email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await hashPassword(userData.password);
  const newUser = {
    id: (users.length + 1).toString(),
    email: userData.email,
    password: hashedPassword,
    fullName: userData.fullName,
    phoneNumber: userData.phoneNumber,
    activeRole: userData.role.toUpperCase(),
    isVerified: true,
    createdAt: new Date(),
  };

  users.push(newUser);
  return newUser;
};

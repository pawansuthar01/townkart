"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific NextAuth errors
        if (result.error === "CredentialsSignin") {
          throw new Error("Invalid email or password");
        }
        throw new Error(result.error);
      }

      if (!result?.ok) {
        throw new Error("Login failed");
      }

      // Wait a bit for session to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      return result;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const register = async (userData: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    role: string;
  }) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const result = await response.json();

      // Auto login after registration
      const loginResult = await login(userData.email, userData.password);
      return loginResult;
    } catch (error) {
      throw error;
    }
  };

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === "loading",
    login,
    logout,
    register,
  };
};

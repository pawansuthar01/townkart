"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ShoppingCart,
  Store,
  Bike,
  Info,
} from "lucide-react";

export function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER", // Default to customer
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    token: string;
    role: string;
    email: string;
    message?: string;
    storeId?: string;
    serviceAreas: string[];
    stores: string[];
  } | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const activeRole = (session.user as any)?.activeRole;

      if (activeRole === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (activeRole === "STORE_MANAGER") {
        router.push("/store");
      } else if (activeRole === "RIDER") {
        router.push("/rider");
      } else {
        router.push("/");
      }
    }
  }, [session, status, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError("");
  };

  // Check for invitation token on component mount
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      validateInvitationToken(token);
    } else {
      // No token, default to customer registration
      setFormData((prev) => ({ ...prev, role: "CUSTOMER" }));
    }
  }, [searchParams]);

  const validateInvitationToken = async (token: string) => {
    setIsValidatingToken(true);
    try {
      const response = await fetch(
        `/api/auth/validate-invitation?token=${token}`
      );
      const data = await response.json();

      if (data.valid) {
        setInvitationData({
          token,
          role: data.invitation.role,
          email: data.invitation.invitedEmail,
          message: data.invitation.message,
          storeId: data.invitation.storeId,
          serviceAreas: data.invitation.serviceAreas,
          stores: data.invitation.stores,
        });
        setFormData((prev) => ({
          ...prev,
          role: data.invitation.role,
          email: data.invitation.invitedEmail,
        }));
      } else {
        setError(data.message || "Invalid invitation token");
      }
    } catch (error) {
      setError("Failed to validate invitation token");
    } finally {
      setIsValidatingToken(false);
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "Full name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.phoneNumber.trim()) return "Phone number is required";
    if (!formData.password) return "Password is required";
    if (!formData.confirmPassword) return "Please confirm your password";
    if (!formData.role) return "Please select a role";

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email))
      return "Please enter a valid email address";

    // Password validation
    if (formData.password.length < 6)
      return "Password must be at least 6 characters long";
    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      return "Password must contain at least one letter and one number";
    }

    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";

    // Enhanced phone validation
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phoneNumber))
      return "Please enter a valid Indian phone number (e.g., +919876543210)";

    // Name validation
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(formData.fullName.trim()))
      return "Name can only contain letters and spaces";

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        token: invitationData?.token,
      });

      if (result) {
        // Redirect to OTP verification page
        router.push(
          `/auth/verify-otp?phone=${encodeURIComponent(formData.phoneNumber)}&role=${formData.role}&Purpose=REGISTER&userId=${result.userId}`
        );
      } else {
        throw new Error("Registration failed");
      }
    } catch (error: any) {
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "CUSTOMER":
        return <ShoppingCart className="h-4 w-4" />;
      case "MERCHANT":
        return <Store className="h-4 w-4" />;
      case "RIDER":
        return <Bike className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-townkart-primary/5 via-white to-townkart-secondary/5 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-townkart-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-townkart-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-400/5 to-teal-400/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm transition-all duration-300 relative">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="mx-auto w-16 h-16 bg-townkart-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-townkart-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {invitationData ? "Complete Registration" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {invitationData
              ? `You're invited to join as a ${invitationData.role.toLowerCase().replace("_", " ")}`
              : "Join TownKart and start your journey"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isValidatingToken && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>Validating invitation...</AlertDescription>
              </Alert>
            )}

            {invitationData && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">
                      You've been invited to join as a{" "}
                      {invitationData.role === "STORE_MANAGER"
                        ? "Store Manager"
                        : invitationData.role.toLowerCase()}
                    </p>
                    {invitationData.role === "STORE_MANAGER" &&
                      invitationData.storeId && (
                        <p className="text-sm">
                          You will be managing a specific store.
                        </p>
                      )}
                    {invitationData.role === "RIDER" && (
                      <div className="text-sm">
                        {(invitationData.serviceAreas?.length || 0) > 0 && (
                          <p>
                            Assigned to {invitationData.serviceAreas.length}{" "}
                            service area(s)
                          </p>
                        )}
                        {(invitationData.stores?.length || 0) > 0 && (
                          <p>
                            Assigned to {invitationData.stores.length} store(s)
                          </p>
                        )}
                      </div>
                    )}
                    {invitationData.message && (
                      <p className="text-sm">{invitationData.message}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                disabled={isLoading || !!invitationData}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+919876543210"
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            {/* Role selection only shown for invitations */}
            {invitationData && (
              <div className="space-y-2">
                <Label htmlFor="role">Joining as</Label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  {formData.role === "RIDER" && (
                    <Bike className="h-5 w-5 text-blue-600" />
                  )}
                  {formData.role === "STORE_MANAGER" && (
                    <Store className="h-5 w-5 text-green-600" />
                  )}
                  <span className="font-medium">
                    {formData.role === "STORE_MANAGER"
                      ? "Store Manager"
                      : formData.role}
                  </span>
                </div>
              </div>
            )}

            {/* Hidden role field for customers */}
            {!invitationData && (
              <input type="hidden" name="role" value="CUSTOMER" />
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 6 characters, include letter and number)"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                  disabled={isLoading}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  required
                  disabled={isLoading}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                required
                className="mr-2 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                disabled={isLoading}
              />
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-green-600 hover:text-green-500 font-medium"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-green-600 hover:text-green-500 font-medium"
              >
                Privacy Policy
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-green-600 hover:text-green-500 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

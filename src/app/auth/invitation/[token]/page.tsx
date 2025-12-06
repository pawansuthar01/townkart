"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Upload, Check, X, Eye, EyeOff } from "lucide-react";
import { MapIntegration } from "@/components/shared/MapIntegration";

interface InvitationData {
  id: string;
  invitedEmail: string;
  invitedPhone: string;
  role: "RIDER" | "STORE_MANAGER";
  serviceAreas?: string[];
  stores?: string[];
  message?: string;
  expiresAt: string;
}

interface ServiceArea {
  id: string;
  name: string;
  city: string;
  state: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export default function InvitationRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
    confirmPassword: "",
    phoneNumber: invitation?.invitedPhone || "",
    email: invitation?.invitedEmail || "",
    // Rider specific
    vehicleType: "bike",
    vehicleNumber: "",
    licenseNumber: "",
    emergencyContact: "",
    emergencyPhone: "",
    // Store manager specific
    storeId: "",
    // Documents
    aadharCard: null as File | null,
    panCard: null as File | null,
    drivingLicense: null as File | null,
    vehicleRegistration: null as File | null,
    bankDetails: null as File | null,
    profilePhoto: null as File | null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const response = await fetch(
        `/api/auth/validate-invitation?token=${token}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Invalid invitation");
      }

      const data = await response.json();
      setInvitation(data.invitation);
      setFormData((prev) => ({
        ...prev,
        email: data.invitation.invitedEmail,
        phoneNumber: data.invitation.invitedPhone,
      }));

      // Load service areas and stores
      await loadServiceAreasAndStores(data.invitation);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceAreasAndStores = async (invitationData: InvitationData) => {
    try {
      // Load service areas
      if (
        invitationData.role === "RIDER" &&
        invitationData.serviceAreas?.length
      ) {
        const areasResponse = await fetch("/api/admin/service-areas");
        if (areasResponse.ok) {
          const areasData = await areasResponse.json();
          const filteredAreas = areasData.data.filter((area: ServiceArea) =>
            invitationData.serviceAreas?.includes(area.id)
          );
          setServiceAreas(filteredAreas);
        }
      }

      // Load stores
      if (invitationData.role === "RIDER" && invitationData.stores?.length) {
        const storesResponse = await fetch("/api/admin/stores?limit=1000");
        if (storesResponse.ok) {
          const storesData = await storesResponse.json();
          const filteredStores = storesData.data.filter((store: Store) =>
            invitationData.stores?.includes(store.id)
          );
          setStores(filteredStores);
        }
      }

      // For store manager, load all stores
      if (invitationData.role === "STORE_MANAGER") {
        const storesResponse = await fetch("/api/admin/stores?limit=1000");
        if (storesResponse.ok) {
          const storesData = await storesResponse.json();
          setStores(storesData.data);
        }
      }
    } catch (error) {
      console.error("Failed to load areas/stores:", error);
    }
  };

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "Full name is required";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 8)
      return "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";

    if (invitation?.role === "RIDER") {
      if (!formData.vehicleNumber) return "Vehicle number is required";
      if (!formData.licenseNumber) return "License number is required";
      if (!formData.aadharCard) return "Aadhar card is required";
      if (!formData.drivingLicense) return "Driving license is required";
      if (!formData.vehicleRegistration)
        return "Vehicle registration is required";
    }

    if (invitation?.role === "STORE_MANAGER") {
      if (!formData.storeId) return "Please select a store";
    }

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

    setSubmitting(true);

    try {
      const submitData = new FormData();

      // Basic info
      submitData.append("token", token);
      submitData.append("fullName", formData.fullName);
      submitData.append("password", formData.password);
      submitData.append("phoneNumber", formData.phoneNumber);
      submitData.append("email", formData.email);

      // Role specific data
      if (invitation?.role === "RIDER") {
        submitData.append("vehicleType", formData.vehicleType);
        submitData.append("vehicleNumber", formData.vehicleNumber);
        submitData.append("licenseNumber", formData.licenseNumber);
        submitData.append("emergencyContact", formData.emergencyContact);
        submitData.append("emergencyPhone", formData.emergencyPhone);
      }

      if (invitation?.role === "STORE_MANAGER") {
        submitData.append("storeId", formData.storeId);
      }

      // Documents
      if (formData.aadharCard)
        submitData.append("aadharCard", formData.aadharCard);
      if (formData.panCard) submitData.append("panCard", formData.panCard);
      if (formData.drivingLicense)
        submitData.append("drivingLicense", formData.drivingLicense);
      if (formData.vehicleRegistration)
        submitData.append("vehicleRegistration", formData.vehicleRegistration);
      if (formData.bankDetails)
        submitData.append("bankDetails", formData.bankDetails);
      if (formData.profilePhoto)
        submitData.append("profilePhoto", formData.profilePhoto);

      const response = await fetch("/api/auth/submit-application", {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit application");
      }

      const data = await response.json();
      setSuccess(
        "Application submitted successfully! You will be notified once approved."
      );

      // Redirect after success
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertDescription>
                {error || "Invalid or expired invitation"}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Join TownKart as{" "}
              {invitation.role === "STORE_MANAGER" ? "Store Manager" : "Rider"}
            </CardTitle>
            <p className="text-center text-gray-600">
              Complete your application to get started
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="role">Role Details</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="confirmPassword">
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="role" className="space-y-4">
                  {invitation.role === "RIDER" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="vehicleType">Vehicle Type *</Label>
                          <select
                            id="vehicleType"
                            value={formData.vehicleType}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                vehicleType: e.target.value,
                              }))
                            }
                            className="w-full p-2 border rounded-md"
                            required
                          >
                            <option value="bike">Bike</option>
                            <option value="scooter">Scooter</option>
                            <option value="car">Car</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="vehicleNumber">
                            Vehicle Number *
                          </Label>
                          <Input
                            id="vehicleNumber"
                            value={formData.vehicleNumber}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                vehicleNumber: e.target.value,
                              }))
                            }
                            placeholder="e.g., RJ14AB1234"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="licenseNumber">
                            License Number *
                          </Label>
                          <Input
                            id="licenseNumber"
                            value={formData.licenseNumber}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                licenseNumber: e.target.value,
                              }))
                            }
                            placeholder="e.g., RJ1420200000000"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="emergencyContact">
                            Emergency Contact
                          </Label>
                          <Input
                            id="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                emergencyContact: e.target.value,
                              }))
                            }
                            placeholder="Emergency contact name"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="emergencyPhone">
                            Emergency Phone
                          </Label>
                          <Input
                            id="emergencyPhone"
                            value={formData.emergencyPhone}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                emergencyPhone: e.target.value,
                              }))
                            }
                            placeholder="+91xxxxxxxxxx"
                          />
                        </div>
                      </div>

                      {/* Service Areas Map */}
                      {serviceAreas.length > 0 && (
                        <div>
                          <Label className="text-lg font-semibold mb-2 block">
                            Your Service Areas
                          </Label>
                          <div className="h-64 rounded-lg overflow-hidden border">
                            <MapIntegration
                              center={{
                                latitude: serviceAreas[0].centerLat,
                                longitude: serviceAreas[0].centerLng,
                              }}
                              zoom={10}
                              markers={serviceAreas.map((area) => ({
                                id: area.id,
                                latitude: area.centerLat,
                                longitude: area.centerLng,
                                title: area.name,
                                address: `${area.city}, ${area.state}`,
                                type: "shop" as const,
                              }))}
                              height="250px"
                            />
                          </div>
                          <div className="mt-2 space-y-1">
                            {serviceAreas.map((area) => (
                              <div
                                key={area.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span>
                                  {area.name} - {area.city}, {area.state}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {invitation.role === "STORE_MANAGER" && (
                    <div>
                      <Label htmlFor="storeId">Select Store *</Label>
                      <select
                        id="storeId"
                        value={formData.storeId}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            storeId: e.target.value,
                          }))
                        }
                        className="w-full p-2 border rounded-md"
                        required
                      >
                        <option value="">Choose a store</option>
                        {stores.map((store) => (
                          <option key={store.id} value={store.id}>
                            {store.name} ({store.code}) - {store.city}
                          </option>
                        ))}
                      </select>

                      {formData.storeId && (
                        <div className="mt-4">
                          <Label className="text-lg font-semibold mb-2 block">
                            Store Location
                          </Label>
                          <div className="h-64 rounded-lg overflow-hidden border">
                            {(() => {
                              const selectedStore = stores.find(
                                (s) => s.id === formData.storeId
                              );
                              return selectedStore ? (
                                <MapIntegration
                                  center={{
                                    latitude: selectedStore.latitude,
                                    longitude: selectedStore.longitude,
                                  }}
                                  zoom={15}
                                  markers={[
                                    {
                                      id: selectedStore.id,
                                      latitude: selectedStore.latitude,
                                      longitude: selectedStore.longitude,
                                      title: selectedStore.name,
                                      address: selectedStore.address,
                                      type: "shop" as const,
                                    },
                                  ]}
                                  height="250px"
                                />
                              ) : null;
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Aadhar Card *</Label>
                      <div className="mt-1">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            handleFileUpload(
                              "aadharCard",
                              e.target.files?.[0] || null
                            )
                          }
                          className="w-full p-2 border rounded-md"
                          required={invitation.role === "RIDER"}
                        />
                        {formData.aadharCard && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ {formData.aadharCard.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>PAN Card</Label>
                      <div className="mt-1">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            handleFileUpload(
                              "panCard",
                              e.target.files?.[0] || null
                            )
                          }
                          className="w-full p-2 border rounded-md"
                        />
                        {formData.panCard && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ {formData.panCard.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {invitation.role === "RIDER" && (
                      <>
                        <div>
                          <Label>Driving License *</Label>
                          <div className="mt-1">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) =>
                                handleFileUpload(
                                  "drivingLicense",
                                  e.target.files?.[0] || null
                                )
                              }
                              className="w-full p-2 border rounded-md"
                              required
                            />
                            {formData.drivingLicense && (
                              <p className="text-sm text-green-600 mt-1">
                                ✓ {formData.drivingLicense.name}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Vehicle Registration *</Label>
                          <div className="mt-1">
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) =>
                                handleFileUpload(
                                  "vehicleRegistration",
                                  e.target.files?.[0] || null
                                )
                              }
                              className="w-full p-2 border rounded-md"
                              required
                            />
                            {formData.vehicleRegistration && (
                              <p className="text-sm text-green-600 mt-1">
                                ✓ {formData.vehicleRegistration.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <Label>Bank Details</Label>
                      <div className="mt-1">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) =>
                            handleFileUpload(
                              "bankDetails",
                              e.target.files?.[0] || null
                            )
                          }
                          className="w-full p-2 border rounded-md"
                        />
                        {formData.bankDetails && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ {formData.bankDetails.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Profile Photo</Label>
                      <div className="mt-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleFileUpload(
                              "profilePhoto",
                              e.target.files?.[0] || null
                            )
                          }
                          className="w-full p-2 border rounded-md"
                        />
                        {formData.profilePhoto && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ {formData.profilePhoto.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

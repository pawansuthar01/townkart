"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Store,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { DocumentUpload } from "@/components/shared/DocumentUpload";
import { useAuth } from "@/hooks/useAuth";

interface StoreSetupData {
  // Basic Information
  name: string;
  description: string;
  category: string;
  subcategory: string;

  // Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;

  // Contact
  phoneNumber: string;
  email: string;

  // Operating Hours
  operatingHours: any;

  // Documents
  businessLicense: File | null;
  gstCertificate: File | null;
  addressProof: File | null;
  ownerId: File | null;
}

const categories = [
  "Grocery",
  "Restaurant",
  "Pharmacy",
  "Electronics",
  "Fashion",
  "Books",
  "Home & Garden",
  "Sports",
  "Beauty",
  "Others",
];

const steps = [
  { id: 1, title: "Basic Information", icon: Store },
  { id: 2, title: "Location & Contact", icon: MapPin },
  { id: 3, title: "Operating Hours", icon: Clock },
  { id: 4, title: "Documents", icon: FileText },
  { id: 5, title: "Review & Submit", icon: CheckCircle },
];

export default function StoreSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [storeData, setStoreData] = useState<StoreSetupData>({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: null,
    longitude: null,
    phoneNumber: "",
    email: "",
    operatingHours: {
      monday: { open: "09:00", close: "21:00", closed: false },
      tuesday: { open: "09:00", close: "21:00", closed: false },
      wednesday: { open: "09:00", close: "21:00", closed: false },
      thursday: { open: "09:00", close: "21:00", closed: false },
      friday: { open: "09:00", close: "21:00", closed: false },
      saturday: { open: "09:00", close: "21:00", closed: false },
      sunday: { open: "09:00", close: "21:00", closed: false },
    },
    businessLicense: null,
    gstCertificate: null,
    addressProof: null,
    ownerId: null,
  });

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Pre-fill user data
    if (user) {
      setStoreData((prev) => ({
        ...prev,
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const updateStoreData = (field: string, value: any) => {
    setStoreData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (field: string, file: File | null) => {
    updateStoreData(field, file);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          storeData.name &&
          storeData.description &&
          storeData.category
        );
      case 2:
        return !!(
          storeData.address &&
          storeData.city &&
          storeData.state &&
          storeData.pincode &&
          storeData.phoneNumber &&
          storeData.email
        );
      case 3:
        return true; // Operating hours are optional
      case 4:
        return !!(
          storeData.businessLicense &&
          storeData.ownerId &&
          storeData.addressProof
        );
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();

      // Add basic data
      Object.entries(storeData).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === "object" && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch("/api/store/setup", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.push("/store/waiting");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit store application");
      }
    } catch (error) {
      console.error("Error submitting store setup:", error);
      alert("Failed to submit store application");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Store Name *</Label>
              <Input
                id="name"
                placeholder="Enter your store name"
                value={storeData.name}
                onChange={(e) => updateStoreData("name", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Store Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your store, products, and services"
                value={storeData.description}
                onChange={(e) => updateStoreData("description", e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={storeData.category}
                  onValueChange={(value) => updateStoreData("category", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                <Input
                  id="subcategory"
                  placeholder="e.g., Organic, Fast Food, Electronics"
                  value={storeData.subcategory}
                  onChange={(e) =>
                    updateStoreData("subcategory", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="address">Store Address *</Label>
              <Textarea
                id="address"
                placeholder="Full address including landmark"
                value={storeData.address}
                onChange={(e) => updateStoreData("address", e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={storeData.city}
                  onChange={(e) => updateStoreData("city", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={storeData.state}
                  onChange={(e) => updateStoreData("state", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  placeholder="Pincode"
                  value={storeData.pincode}
                  onChange={(e) => updateStoreData("pincode", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+919876543210"
                  value={storeData.phoneNumber}
                  onChange={(e) =>
                    updateStoreData("phoneNumber", e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="store@example.com"
                  value={storeData.email}
                  onChange={(e) => updateStoreData("email", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">
                Set your operating hours
              </h3>
              <p className="text-gray-600">
                Customers will see these hours on your store
              </p>
            </div>

            {Object.entries(storeData.operatingHours).map(
              ([day, hours]: [string, any]) => (
                <div
                  key={day}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="w-20 capitalize font-medium">{day}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) =>
                        updateStoreData("operatingHours", {
                          ...storeData.operatingHours,
                          [day]: { ...hours, closed: !e.target.checked },
                        })
                      }
                    />
                    <span className="text-sm">Open</span>
                  </div>
                  {!hours.closed && (
                    <>
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) =>
                          updateStoreData("operatingHours", {
                            ...storeData.operatingHours,
                            [day]: { ...hours, open: e.target.value },
                          })
                        }
                        className="w-32"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) =>
                          updateStoreData("operatingHours", {
                            ...storeData.operatingHours,
                            [day]: { ...hours, close: e.target.value },
                          })
                        }
                        className="w-32"
                      />
                    </>
                  )}
                  {hours.closed && <Badge variant="secondary">Closed</Badge>}
                </div>
              ),
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">
                Upload Required Documents
              </h3>
              <p className="text-gray-600">
                These documents are required for verification
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DocumentUpload
                label="Business License"
                required
                accept="image/*,.pdf"
                onFileSelect={(file) =>
                  handleFileUpload("businessLicense", file)
                }
                selectedFile={storeData.businessLicense}
                placeholder="Upload your business license or registration certificate"
              />

              <DocumentUpload
                label="GST Certificate"
                accept="image/*,.pdf"
                onFileSelect={(file) =>
                  handleFileUpload("gstCertificate", file)
                }
                selectedFile={storeData.gstCertificate}
                placeholder="Upload your GST registration certificate (optional)"
              />

              <DocumentUpload
                label="Address Proof"
                required
                accept="image/*,.pdf"
                onFileSelect={(file) => handleFileUpload("addressProof", file)}
                selectedFile={storeData.addressProof}
                placeholder="Upload utility bill or rental agreement"
              />

              <DocumentUpload
                label="Owner ID Proof"
                required
                accept="image/*,.pdf"
                onFileSelect={(file) => handleFileUpload("ownerId", file)}
                selectedFile={storeData.ownerId}
                placeholder="Upload Aadhar card, PAN card, or passport"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Review Your Application</h3>
              <p className="text-gray-600">
                Please review all information before submitting
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Store Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>Name:</strong> {storeData.name}
                  </div>
                  <div>
                    <strong>Category:</strong> {storeData.category}
                  </div>
                  <div>
                    <strong>Description:</strong> {storeData.description}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Location & Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>Address:</strong> {storeData.address}
                  </div>
                  <div>
                    <strong>City:</strong> {storeData.city}, {storeData.state} -{" "}
                    {storeData.pincode}
                  </div>
                  <div>
                    <strong>Phone:</strong> {storeData.phoneNumber}
                  </div>
                  <div>
                    <strong>Email:</strong> {storeData.email}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Operating Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    {Object.entries(storeData.operatingHours).map(
                      ([day, hours]: [string, any]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize">{day}:</span>
                          <span>
                            {hours.closed
                              ? "Closed"
                              : `${hours.open} - ${hours.close}`}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Business License</span>
                  </div>
                  {storeData.gstCertificate && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>GST Certificate</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Address Proof</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Owner ID</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Store Setup</h1>
              <p className="text-gray-600">Complete your store registration</p>
            </div>
            <Badge variant="secondary">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm ${isActive ? "font-semibold" : ""}`}
                  >
                    {step.title}
                  </span>
                  {step.id < steps.length && (
                    <div
                      className={`w-12 h-0.5 mx-4 ${
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              {renderStepContent()}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    onClick={handleNext}
                    disabled={!validateStep(currentStep)}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? "Submitting..." : "Submit Application"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

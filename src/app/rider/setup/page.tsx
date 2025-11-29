"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Bike,
  User,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Camera,
  MapPin,
} from "lucide-react";
import { DocumentUpload } from "@/components/shared/DocumentUpload";
import { useAuth } from "@/hooks/useAuth";

interface RiderSetupData {
  // Personal Information
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;

  // Vehicle Information
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleColor: string;

  // Location
  city: string;
  state: string;
  pincode: string;
  currentAddress: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  // Documents
  drivingLicense: File | null;
  vehicleRegistration: File | null;
  aadharCard: File | null;
  panCard: File | null;
  photo: File | null;
  addressProof: File | null;
}

const vehicleTypes = ["Bike", "Scooter", "Bicycle", "Car", "Auto Rickshaw"];

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Vehicle Details", icon: Bike },
  { id: 3, title: "Location", icon: MapPin },
  { id: 4, title: "Emergency Contact", icon: User },
  { id: 5, title: "Documents", icon: FileText },
  { id: 6, title: "Review & Submit", icon: CheckCircle },
];

export default function RiderSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [riderData, setRiderData] = useState<RiderSetupData>({
    fullName: "",
    phoneNumber: "",
    email: "",
    dateOfBirth: "",
    vehicleType: "",
    vehicleNumber: "",
    vehicleModel: "",
    vehicleColor: "",
    city: "",
    state: "",
    pincode: "",
    currentAddress: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    drivingLicense: null,
    vehicleRegistration: null,
    aadharCard: null,
    panCard: null,
    photo: null,
    addressProof: null,
  });

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Pre-fill user data
    if (user) {
      setRiderData((prev) => ({
        ...prev,
        fullName: user.name || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const updateRiderData = (field: string, value: any) => {
    setRiderData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (field: string, file: File | null) => {
    updateRiderData(field, file);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          riderData.fullName &&
          riderData.phoneNumber &&
          riderData.email &&
          riderData.dateOfBirth
        );
      case 2:
        return !!(
          riderData.vehicleType &&
          riderData.vehicleNumber &&
          riderData.vehicleModel
        );
      case 3:
        return !!(
          riderData.city &&
          riderData.state &&
          riderData.pincode &&
          riderData.currentAddress
        );
      case 4:
        return !!(
          riderData.emergencyContactName &&
          riderData.emergencyContactPhone &&
          riderData.emergencyContactRelation
        );
      case 5:
        return !!(
          riderData.drivingLicense &&
          riderData.vehicleRegistration &&
          riderData.aadharCard &&
          riderData.photo
        );
      case 6:
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
      Object.entries(riderData).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await fetch("/api/rider/setup", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.push("/rider/waiting");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit rider application");
      }
    } catch (error) {
      console.error("Error submitting rider setup:", error);
      alert("Failed to submit rider application");
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
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={riderData.fullName}
                onChange={(e) => updateRiderData("fullName", e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+919876543210"
                  value={riderData.phoneNumber}
                  onChange={(e) =>
                    updateRiderData("phoneNumber", e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="rider@example.com"
                  value={riderData.email}
                  onChange={(e) => updateRiderData("email", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={riderData.dateOfBirth}
                onChange={(e) => updateRiderData("dateOfBirth", e.target.value)}
                className="mt-1"
                max={
                  new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0]
                }
              />
              <p className="text-sm text-gray-500 mt-1">
                You must be at least 18 years old
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="vehicleType">Vehicle Type *</Label>
              <Select
                value={riderData.vehicleType}
                onValueChange={(value) => updateRiderData("vehicleType", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                <Input
                  id="vehicleNumber"
                  placeholder="e.g., RJ14AB1234"
                  value={riderData.vehicleNumber}
                  onChange={(e) =>
                    updateRiderData("vehicleNumber", e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="vehicleModel">Vehicle Model *</Label>
                <Input
                  id="vehicleModel"
                  placeholder="e.g., Honda Activa, Hero Splendor"
                  value={riderData.vehicleModel}
                  onChange={(e) =>
                    updateRiderData("vehicleModel", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="vehicleColor">Vehicle Color</Label>
              <Input
                id="vehicleColor"
                placeholder="e.g., Black, White, Red"
                value={riderData.vehicleColor}
                onChange={(e) =>
                  updateRiderData("vehicleColor", e.target.value)
                }
                className="mt-1"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="currentAddress">Current Address *</Label>
              <textarea
                id="currentAddress"
                placeholder="Full address including landmark"
                value={riderData.currentAddress}
                onChange={(e) =>
                  updateRiderData("currentAddress", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={riderData.city}
                  onChange={(e) => updateRiderData("city", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={riderData.state}
                  onChange={(e) => updateRiderData("state", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  placeholder="Pincode"
                  value={riderData.pincode}
                  onChange={(e) => updateRiderData("pincode", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold">Emergency Contact</h3>
              <p className="text-gray-600">
                We'll contact this person in case of emergency
              </p>
            </div>

            <div>
              <Label htmlFor="emergencyContactName">Contact Name *</Label>
              <Input
                id="emergencyContactName"
                placeholder="Full name of emergency contact"
                value={riderData.emergencyContactName}
                onChange={(e) =>
                  updateRiderData("emergencyContactName", e.target.value)
                }
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
                <Input
                  id="emergencyContactPhone"
                  placeholder="+919876543210"
                  value={riderData.emergencyContactPhone}
                  onChange={(e) =>
                    updateRiderData("emergencyContactPhone", e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="emergencyContactRelation">Relationship *</Label>
                <Select
                  value={riderData.emergencyContactRelation}
                  onValueChange={(value) =>
                    updateRiderData("emergencyContactRelation", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Parent">Parent</SelectItem>
                    <SelectItem value="Spouse">Spouse</SelectItem>
                    <SelectItem value="Sibling">Sibling</SelectItem>
                    <SelectItem value="Friend">Friend</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 5:
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
                label="Driving License"
                required
                accept="image/*,.pdf"
                onFileSelect={(file) =>
                  handleFileUpload("drivingLicense", file)
                }
                selectedFile={riderData.drivingLicense}
                placeholder="Upload your valid driving license"
              />

              <DocumentUpload
                label="Vehicle Registration"
                required
                accept="image/*,.pdf"
                onFileSelect={(file) =>
                  handleFileUpload("vehicleRegistration", file)
                }
                selectedFile={riderData.vehicleRegistration}
                placeholder="Upload vehicle registration certificate"
              />

              <DocumentUpload
                label="Aadhar Card"
                required
                accept="image/*,.pdf"
                onFileSelect={(file) => handleFileUpload("aadharCard", file)}
                selectedFile={riderData.aadharCard}
                placeholder="Upload Aadhar card for identity verification"
              />

              <DocumentUpload
                label="PAN Card"
                accept="image/*,.pdf"
                onFileSelect={(file) => handleFileUpload("panCard", file)}
                selectedFile={riderData.panCard}
                placeholder="Upload PAN card (optional)"
              />

              <DocumentUpload
                label="Recent Photo"
                required
                accept="image/*"
                icon="camera"
                onFileSelect={(file) => handleFileUpload("photo", file)}
                selectedFile={riderData.photo}
                placeholder="Upload a recent passport-size photo"
              />

              <DocumentUpload
                label="Address Proof"
                required
                accept="image/*,.pdf"
                onFileSelect={(file) => handleFileUpload("addressProof", file)}
                selectedFile={riderData.addressProof}
                placeholder="Upload utility bill or rental agreement"
              />
            </div>
          </div>
        );

      case 6:
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
                  <CardTitle className="text-base">
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>Name:</strong> {riderData.fullName}
                  </div>
                  <div>
                    <strong>Phone:</strong> {riderData.phoneNumber}
                  </div>
                  <div>
                    <strong>Email:</strong> {riderData.email}
                  </div>
                  <div>
                    <strong>Date of Birth:</strong> {riderData.dateOfBirth}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>Type:</strong> {riderData.vehicleType}
                  </div>
                  <div>
                    <strong>Number:</strong> {riderData.vehicleNumber}
                  </div>
                  <div>
                    <strong>Model:</strong> {riderData.vehicleModel}
                  </div>
                  <div>
                    <strong>Color:</strong>{" "}
                    {riderData.vehicleColor || "Not specified"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>Address:</strong> {riderData.currentAddress}
                  </div>
                  <div>
                    <strong>City:</strong> {riderData.city}, {riderData.state} -{" "}
                    {riderData.pincode}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <strong>Name:</strong> {riderData.emergencyContactName}
                  </div>
                  <div>
                    <strong>Phone:</strong> {riderData.emergencyContactPhone}
                  </div>
                  <div>
                    <strong>Relation:</strong>{" "}
                    {riderData.emergencyContactRelation}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Driving License</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Vehicle Registration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Aadhar Card</span>
                    </div>
                    {riderData.panCard && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">PAN Card</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Photo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Address Proof</span>
                    </div>
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
              <h1 className="text-2xl font-bold text-gray-900">Rider Setup</h1>
              <p className="text-gray-600">Complete your rider registration</p>
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

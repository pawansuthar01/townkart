"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Camera,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CODVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderAmount: number;
  onVerificationComplete: (data: {
    otp?: string;
    photoProofUrl?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CODVerificationModal({
  isOpen,
  onClose,
  orderAmount,
  onVerificationComplete,
  isLoading = false,
}: CODVerificationModalProps) {
  const [otp, setOtp] = useState("");
  const [photoProofUrl, setPhotoProofUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState<
    "otp" | "photo" | "complete"
  >("otp");

  const requiresOTP = orderAmount > 1000;
  const requiresPhoto = orderAmount > 1000;

  const handleOTPSubmit = async () => {
    if (!otp || otp.length !== 6) {
      return;
    }

    if (requiresPhoto) {
      setVerificationStep("photo");
    } else {
      await completeVerification();
    }
  };

  const handlePhotoSubmit = async () => {
    if (!photoProofUrl) {
      return;
    }

    await completeVerification();
  };

  const completeVerification = async () => {
    try {
      setIsSubmitting(true);
      await onVerificationComplete({
        otp: requiresOTP ? otp : undefined,
        photoProofUrl: requiresPhoto ? photoProofUrl : undefined,
      });
      setVerificationStep("complete");
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (verificationStep === "complete") {
      // Reset modal state
      setOtp("");
      setPhotoProofUrl("");
      setVerificationStep("otp");
      onClose();
    } else {
      onClose();
    }
  };

  const capturePhoto = async () => {
    try {
      // Check if device supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera not supported on this device");
        return;
      }

      // Request camera permission and capture photo
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera if available
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      // Create canvas to capture frame
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      // Wait for video to load
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame to canvas
      context?.drawImage(video, 0, 0);

      // Convert to blob and create object URL
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const photoUrl = URL.createObjectURL(blob);
            setPhotoProofUrl(photoUrl);
          }
        },
        "image/jpeg",
        0.8,
      );

      // Stop camera stream
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.error("Photo capture error:", error);
      // Fallback to file input if camera fails
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setPhotoProofUrl(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            High-Value Order Verification
          </DialogTitle>
          <DialogDescription>
            This order requires additional verification due to its value (₹
            {orderAmount.toLocaleString("en-IN")})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Verification Steps Indicator */}
          <div className="flex items-center justify-center gap-4">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                verificationStep === "otp"
                  ? "bg-blue-100 text-blue-700"
                  : verificationStep === "photo"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-green-100 text-green-700",
              )}
            >
              <Smartphone className="w-4 h-4" />
              OTP
            </div>

            {requiresPhoto && (
              <>
                <div className="w-8 h-px bg-gray-300" />
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                    verificationStep === "photo"
                      ? "bg-blue-100 text-blue-700"
                      : verificationStep === "complete"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600",
                  )}
                >
                  <Camera className="w-4 h-4" />
                  Photo
                </div>
              </>
            )}
          </div>

          {/* OTP Verification Step */}
          {verificationStep === "otp" && requiresOTP && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  An OTP has been sent to the customer's phone number for
                  verification.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="otp">Enter 6-digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleOTPSubmit}
                disabled={!otp || otp.length !== 6 || isLoading}
                className="w-full"
              >
                Verify OTP
              </Button>
            </div>
          )}

          {/* Photo Proof Step */}
          {verificationStep === "photo" && requiresPhoto && (
            <div className="space-y-4">
              <Alert>
                <Camera className="h-4 w-4" />
                <AlertDescription>
                  Please capture a photo of the cash and receipt for
                  verification.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {!photoProofUrl ? (
                  <Button
                    onClick={capturePhoto}
                    variant="outline"
                    className="w-full h-24 border-2 border-dashed"
                  >
                    <div className="text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <div className="text-sm">Tap to Capture Photo</div>
                    </div>
                  </Button>
                ) : (
                  <div className="relative">
                    <img
                      src={photoProofUrl}
                      alt="Cash proof"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2"
                      onClick={() => setPhotoProofUrl("")}
                    >
                      Retake
                    </Button>
                  </div>
                )}
              </div>

              <Button
                onClick={handlePhotoSubmit}
                disabled={!photoProofUrl || isLoading || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Submitting..." : "Complete Verification"}
              </Button>
            </div>
          )}

          {/* Completion Step */}
          {verificationStep === "complete" && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Verification Complete
                </h3>
                <p className="text-sm text-green-600 mt-1">
                  Cash collection has been successfully verified and recorded.
                </p>
              </div>

              <Button
                onClick={handleClose}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Security Notice */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Lock className="w-4 h-4" />
              <span>All data is encrypted and securely stored</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

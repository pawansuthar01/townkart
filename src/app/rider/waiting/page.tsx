"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Bike,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RiderWaitingPage() {
  const [riderStatus, setRiderStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkRiderStatus();
  }, []);

  const checkRiderStatus = async () => {
    try {
      // In a real app, this would check the user's rider status
      const status = "pending"; // 'pending', 'approved', 'rejected'
      setRiderStatus(status);
    } catch (error) {
      console.error("Error checking rider status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    checkRiderStatus();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-townkart-primary mx-auto mb-4" />
          <p className="text-gray-600">Checking rider status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-townkart-primary rounded-full flex items-center justify-center">
              <Bike className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              Rider Application Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {riderStatus === "pending" && (
              <>
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      Under Review
                    </Badge>
                  </div>
                  <p className="text-gray-600">
                    Your rider application is being reviewed by our team. This
                    usually takes 24-48 hours.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">
                    What happens next?
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Document verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>Background check</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Vehicle verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>Training and approval</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {riderStatus === "rejected" && (
              <>
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <Badge variant="destructive">Application Rejected</Badge>
                  </div>
                  <p className="text-gray-600">
                    Unfortunately, your rider application was not approved.
                    Please contact support for more details.
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Common reasons for rejection:</strong>
                    <br />• Incomplete documentation
                    <br />• Invalid driving license
                    <br />• Vehicle not meeting requirements
                    <br />• Background check issues
                  </p>
                </div>
              </>
            )}

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Required Documents</h4>
              <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Government ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Driving License</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Vehicle Registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Address Proof</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Need Help?</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="text-sm">
                  Contact Support
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="text-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>Application submitted on {new Date().toLocaleDateString()}</p>
              <p>Application ID: RD-{Date.now().toString().slice(-6)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

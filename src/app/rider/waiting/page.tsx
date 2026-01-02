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
  Bell,
  Timer,
  Bookmark,
  Copy,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RiderWaitingPage() {
  const [riderStatus, setRiderStatus] = useState<
    "pending" | "approved" | "rejected" | "no_application" | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [nextCheckIn, setNextCheckIn] = useState(30); // seconds
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [statusChanged, setStatusChanged] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkRiderStatus = useCallback(async () => {
    try {
      const email = searchParams.get("email");
      const url = email
        ? `/api/rider/application-status?email=${encodeURIComponent(email)}`
        : "/api/rider/application-status";

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const newStatus = data.status;

        // Check if status changed
        if (
          riderStatus &&
          riderStatus !== newStatus &&
          newStatus !== "pending"
        ) {
          setStatusChanged(true);
          // Auto-disable auto refresh when status changes to final state
          if (newStatus === "approved" || newStatus === "rejected") {
            setAutoRefreshEnabled(false);
          }
        }

        setRiderStatus(newStatus);
        setLastChecked(new Date());
      } else {
        setRiderStatus("pending"); // Default to pending if API fails
      }
    } catch (error) {
      console.error("Error checking rider status:", error);
      setRiderStatus("pending"); // Default to pending if error
    } finally {
      setIsLoading(false);
    }
  }, [riderStatus, searchParams]);

  // Auto refresh countdown
  useEffect(() => {
    if (
      !autoRefreshEnabled ||
      riderStatus === "approved" ||
      riderStatus === "rejected"
    )
      return;

    const interval = setInterval(() => {
      setNextCheckIn((prev) => {
        if (prev <= 1) {
          checkRiderStatus();
          return 30; // Reset to 30 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, riderStatus, checkRiderStatus]);

  useEffect(() => {
    checkRiderStatus();
  }, []);

  useEffect(() => {
    if (riderStatus === "approved") {
      // Redirect to rider dashboard if approved
      setTimeout(() => router.push("/rider/rider-dashboard"), 3000);
    } else if (riderStatus === "no_application") {
      // Redirect to setup if no application
      setTimeout(() => router.push("/rider/setup"), 2000);
    }
  }, [riderStatus, router]);

  const handleRefresh = () => {
    setIsLoading(true);
    setNextCheckIn(30); // Reset countdown
    checkRiderStatus();
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
    if (!autoRefreshEnabled) {
      setNextCheckIn(30); // Reset countdown when enabling
    }
  };

  const dismissStatusChange = () => {
    setStatusChanged(false);
  };

  const copyWaitingUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    // Could add a toast notification here
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
        {/* Status Change Notification */}
        {statusChanged && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Bell className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Status Update Available!
              </p>
              <p className="text-xs text-green-600">
                Your application status has changed. Refreshing...
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={dismissStatusChange}
              className="text-green-700 border-green-300"
            >
              Dismiss
            </Button>
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-townkart-primary rounded-full flex items-center justify-center">
              <Bike className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {riderStatus === "approved"
                ? "Application Approved!"
                : riderStatus === "rejected"
                  ? "Application Status"
                  : "Rider Application Pending"}
            </CardTitle>
            {lastChecked && (
              <p className="text-sm text-gray-500">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
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

                  {/* Auto-refresh status */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Auto-refresh{" "}
                          {autoRefreshEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={toggleAutoRefresh}
                        className="text-xs"
                      >
                        {autoRefreshEnabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                    {autoRefreshEnabled && (
                      <p className="text-xs text-blue-600">
                        Next check in: {nextCheckIn} seconds
                      </p>
                    )}
                  </div>
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

            {riderStatus === "approved" && (
              <>
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <Badge className="bg-green-100 text-green-800">
                      Application Approved!
                    </Badge>
                  </div>
                  <p className="text-gray-600">
                    Congratulations! Your rider application has been approved.
                    You will be redirected to your dashboard shortly.
                  </p>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">
                      Redirecting in 3 seconds...
                    </p>
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
              <h4 className="font-medium text-gray-900">Status Controls</h4>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-sm"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  {isLoading ? "Checking..." : "Refresh Now"}
                </Button>
                <Button variant="outline" className="text-sm">
                  Contact Support
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Auto-refresh checks your status every 30 seconds. You can
                disable it above if needed.
              </p>
            </div>

            {/* Bookmark URL section */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Save This Page
              </h4>
              <p className="text-xs text-gray-500">
                Bookmark this page to easily check your application status
                later.
              </p>
              <Button
                variant="outline"
                onClick={copyWaitingUrl}
                className="w-full text-sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Page URL
              </Button>
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

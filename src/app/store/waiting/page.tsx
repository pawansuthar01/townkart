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
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StoreWaitingPage() {
  const [storeStatus, setStoreStatus] = useState<
    "pending" | "approved" | "rejected" | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkStoreStatus();
  }, []);

  useEffect(() => {
    if (storeStatus === "approved") {
      // Redirect to store dashboard after a short delay
      setTimeout(() => {
        router.push("/store");
      }, 3000);
    }
  }, [storeStatus, router]);

  const checkStoreStatus = async () => {
    try {
      const response = await fetch("/api/store/profile");
      if (response.ok) {
        const data = await response.json();
        const store = data.profile;

        if (store.isActive && store.isVerified) {
          setStoreStatus("approved");
        } else if (!store.isActive && store.isVerified === false) {
          setStoreStatus("rejected");
        } else {
          setStoreStatus("pending");
        }
      } else {
        console.error("Failed to fetch store profile");
        setStoreStatus("pending"); // Default to pending on error
      }
    } catch (error) {
      console.error("Error checking store status:", error);
      setStoreStatus("pending"); // Default to pending on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    checkStoreStatus();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-townkart-primary mx-auto mb-4" />
          <p className="text-gray-600">Checking store status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div
              className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
                storeStatus === "approved"
                  ? "bg-green-500"
                  : storeStatus === "rejected"
                    ? "bg-red-500"
                    : "bg-townkart-primary"
              }`}
            >
              {storeStatus === "approved" ? (
                <CheckCircle className="h-8 w-8 text-white" />
              ) : storeStatus === "rejected" ? (
                <AlertCircle className="h-8 w-8 text-white" />
              ) : (
                <FileText className="h-8 w-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {storeStatus === "approved"
                ? "Store Application Approved!"
                : storeStatus === "rejected"
                  ? "Store Application Rejected"
                  : "Store Application Pending"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {storeStatus === "approved" && (
              <>
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Application Approved!
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-green-800">
                      🎉 Congratulations! Your store has been approved!
                    </h3>
                    <p className="text-gray-600">
                      You can now start managing your store and accepting
                      orders.
                    </p>
                    <p className="text-sm text-gray-500">
                      Redirecting to your store dashboard in a few seconds...
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">
                    What's Next?
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Add products to your store inventory</li>
                    <li>• Set up your operating hours</li>
                    <li>• Start accepting customer orders</li>
                    <li>• Monitor your store performance</li>
                  </ul>
                </div>
              </>
            )}

            {storeStatus === "pending" && (
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
                    Your store application is being reviewed by our team. This
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
                      <span>Store setup and approval</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {storeStatus === "rejected" && (
              <>
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <Badge variant="destructive">Application Rejected</Badge>
                  </div>
                  <p className="text-gray-600">
                    Unfortunately, your store application was not approved.
                    Please contact support for more details.
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Common reasons for rejection:</strong>
                    <br />• Incomplete documentation
                    <br />• Invalid business information
                    <br />• Location not in service area
                  </p>
                </div>
              </>
            )}

            {storeStatus !== "approved" && (
              <>
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
                  <p>
                    Application submitted on {new Date().toLocaleDateString()}
                  </p>
                  <p>Application ID: ST-{Date.now().toString().slice(-6)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

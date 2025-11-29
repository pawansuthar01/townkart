import { Metadata } from "next";
import { DeliveryMonitoringDashboard } from "@/components/admin/DeliveryMonitoringDashboard";

export const metadata: Metadata = {
  title: "Delivery Monitoring | TownKart Admin",
  description: "Monitor all active deliveries with real-time map tracking",
};

export default function DeliveryMonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DeliveryMonitoringDashboard />
    </div>
  );
}

import { Metadata } from "next";
import { DeliveryChargeManager } from "@/components/admin/DeliveryChargeManager";

export const metadata: Metadata = {
  title: "Delivery Charge Management | TownKart Admin",
  description: "Manage delivery zones, pricing, and surge charges for TownKart",
};

export default function DeliveryChargesAdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DeliveryChargeManager />
    </div>
  );
}

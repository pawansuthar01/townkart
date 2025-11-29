import { Metadata } from "next";
import { OrderTracking } from "@/components/customer/OrderTracking";

interface TrackingPageProps {
  params: {
    orderId: string;
  };
}

export async function generateMetadata({
  params,
}: TrackingPageProps): Promise<Metadata> {
  return {
    title: `Order Tracking - ${params.orderId} | TownKart`,
    description: `Track your order ${params.orderId} in real-time with live location updates.`,
    keywords: [
      "order tracking",
      "delivery tracking",
      "live location",
      "townkart",
    ],
    openGraph: {
      title: `Order Tracking - ${params.orderId}`,
      description: `Track your order ${params.orderId} with real-time updates`,
      type: "website",
    },
  };
}

export default function TrackingPage({ params }: TrackingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Tracking
            </h1>
            <p className="text-gray-600">
              Track your order #{params.orderId} with real-time location updates
            </p>
          </div>

          <OrderTracking orderId={params.orderId} />
        </div>
      </main>
    </div>
  );
}

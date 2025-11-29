import { Metadata } from "next";
import { OrderDetails } from "@/components/orders/OrderDetails";

interface OrderDetailsPageProps {
  params: {
    orderId: string;
  };
}

export async function generateMetadata({
  params,
}: OrderDetailsPageProps): Promise<Metadata> {
  return {
    title: `Order Details - ${params.orderId} | TownKart`,
    description: `View detailed information for order ${params.orderId} including items, status, and delivery information.`,
    keywords: [
      "order details",
      "order history",
      "purchase details",
      "townkart",
    ],
    openGraph: {
      title: `Order Details - ${params.orderId}`,
      description: `View your order details for ${params.orderId}`,
      type: "website",
    },
  };
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Details
            </h1>
            <p className="text-gray-600">
              Complete information about your order #{params.orderId}
            </p>
          </div>

          <OrderDetails orderId={params.orderId} />
        </div>
      </main>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Clock, Phone, ShoppingBag } from "lucide-react";

interface MerchantCardProps {
  merchant: {
    id: string;
    name: string;
    image: string;
    rating: number;
    reviews: number;
    distance: string;
    deliveryTime: string;
    categories: string[];
    isOpen: boolean;
    minOrder: number;
    deliveryFee: number;
    featured?: boolean;
    discount?: number;
  };
  compact?: boolean;
}

export function MerchantCard({ merchant, compact = false }: MerchantCardProps) {
  if (compact) {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border-0 overflow-hidden cursor-pointer">
        <CardContent className="p-0">
          <Link href={`/shops/${merchant.id}`}>
            <div className="relative h-32">
              <Image
                src={merchant.image}
                alt={merchant.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {merchant.featured && (
                <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
                  Featured
                </Badge>
              )}

              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">
                  {merchant.name}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-white/90">
                  <div className="flex items-center">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {merchant.rating}
                  </div>
                  <span>•</span>
                  <span>{merchant.distance}</span>
                </div>
              </div>
            </div>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <Link href={`/shops/${merchant.id}`}>
            <div className="relative h-48 overflow-hidden">
              <Image
                src={merchant.image}
                alt={merchant.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {merchant.featured && (
                <Badge className="absolute top-3 left-3 bg-yellow-500 hover:bg-yellow-600">
                  Featured
                </Badge>
              )}

              {merchant.discount && (
                <Badge className="absolute top-3 right-3 bg-red-500 hover:bg-red-600">
                  {merchant.discount}% OFF
                </Badge>
              )}

              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center justify-between text-white mb-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{merchant.rating}</span>
                    <span className="text-sm text-white/80">
                      ({merchant.reviews})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 text-sm">
                    <Clock className="h-3 w-3" />
                    <span>{merchant.deliveryTime}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-white text-sm">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{merchant.distance}</span>
                  </div>

                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      merchant.isOpen
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {merchant.isOpen ? "Open" : "Closed"}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <Link href={`/shops/${merchant.id}`}>
                <h3 className="font-semibold text-lg text-gray-900 hover:text-townkart-primary line-clamp-1">
                  {merchant.name}
                </h3>
              </Link>

              <div className="flex flex-wrap gap-1 mt-2">
                {merchant.categories.slice(0, 3).map((category, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
                {merchant.categories.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{merchant.categories.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <ShoppingBag className="h-4 w-4" />
                <span>Min ₹{merchant.minOrder}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>₹{merchant.deliveryFee} delivery</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Link href={`/shops/${merchant.id}`} className="flex-1">
              <Button
                className="w-full townkart-gradient hover:opacity-90"
                disabled={!merchant.isOpen}
              >
                {merchant.isOpen ? "View Menu" : "Closed"}
              </Button>
            </Link>

            <Button variant="outline" size="icon" className="shrink-0">
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

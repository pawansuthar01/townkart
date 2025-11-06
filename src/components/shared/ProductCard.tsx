"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/hooks/useCart";
import { Heart, Star, Plus, Check } from "lucide-react";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    originalPrice?: number;
    discount?: number;
    rating: number;
    reviews: number;
    image: string;
    shop: string;
    distance: string;
    stock: number;
    category?: string;
    isNew?: boolean;
    isPopular?: boolean;
  };
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        shop: product.shop,
        stock: product.stock,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const discountPercentage = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : product.discount;

  if (compact) {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <Link href={`/products/${product.id}`}>
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {discountPercentage && (
                  <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                    -{discountPercentage}%
                  </Badge>
                )}
                {product.isNew && (
                  <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
                    New
                  </Badge>
                )}
              </div>
            </Link>

            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Heart
                className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`}
              />
            </button>
          </div>

          <div className="p-3">
            <Link href={`/products/${product.id}`}>
              <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1 hover:text-townkart-primary">
                {product.name}
              </h3>
            </Link>

            <p className="text-xs text-gray-500 mb-2">{product.shop}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <span className="font-bold text-gray-900">
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-gray-500 line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>

              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={isAdding || product.stock === 0}
                className="h-7 px-2 townkart-gradient hover:opacity-90"
              >
                {isAdding ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : isInCart(product.id) ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <Link href={`/products/${product.id}`}>
            <div className="aspect-square relative overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {discountPercentage && (
                <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-600 text-sm">
                  -{discountPercentage}%
                </Badge>
              )}
              {product.isNew && (
                <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
                  New
                </Badge>
              )}
              {product.isPopular && (
                <Badge className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 hover:bg-yellow-600">
                  Popular
                </Badge>
              )}
            </div>
          </Link>

          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart
              className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </button>
        </div>

        <div className="p-4">
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-2 hover:text-townkart-primary">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">({product.reviews})</span>
          </div>

          <p className="text-sm text-gray-500 mb-3">
            {product.shop} • {product.distance}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900">
                ₹{product.price}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={isAdding || product.stock === 0}
              className="townkart-gradient hover:opacity-90 px-4"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : isInCart(product.id) ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Added
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>

          {product.stock < 5 && product.stock > 0 && (
            <p className="text-xs text-orange-600 mt-2">
              Only {product.stock} left in stock
            </p>
          )}

          {product.stock === 0 && (
            <p className="text-xs text-red-600 mt-2">Out of stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

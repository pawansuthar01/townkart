"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Home, ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-townkart-primary to-townkart-secondary rounded-full flex items-center justify-center mb-6">
            <Search className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might
            have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>

            <Link href="/">
              <Button className="w-full sm:w-auto flex items-center justify-center btn-primary">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shops">
              <Button
                variant="outline"
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Browse Shops
              </Button>
            </Link>

            <Link href="/auth/login">
              <Button
                variant="townkart"
                className="w-full sm:w-auto flex items-center justify-center"
              >
                Login / Sign Up
              </Button>
            </Link>
          </div>
        </div>

        {/* Popular Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link
              href="/"
              className="p-3 bg-white rounded-lg border hover:shadow-md transition-shadow text-center"
            >
              🏠 Home
            </Link>
            <Link
              href="/shops"
              className="p-3 bg-white rounded-lg border hover:shadow-md transition-shadow text-center"
            >
              🛍️ Shops
            </Link>
            <Link
              href="/cart"
              className="p-3 bg-white rounded-lg border hover:shadow-md transition-shadow text-center"
            >
              🛒 Cart
            </Link>
            <Link
              href="/auth/login"
              className="p-3 bg-white rounded-lg border hover:shadow-md transition-shadow text-center"
            >
              🔐 Login
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <Link
              href="/support"
              className="text-townkart-primary hover:underline"
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

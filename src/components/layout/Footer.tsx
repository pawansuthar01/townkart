import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 px-4">
      <div className="w-full">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="townkart-gradient p-2 rounded">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">TownKart</span>
            </div>
            <p className="text-gray-400 text-sm">
              Making local commerce easy, fast, and reliable for everyone.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link
                  href="/shops"
                  className="hover:text-white transition-colors"
                >
                  Browse Shops
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="hover:text-white transition-colors"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/offers"
                  className="hover:text-white transition-colors"
                >
                  Offers
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="hover:text-white transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Partner With Us</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>
                <Link
                  href="/merchant/join"
                  className="hover:text-white transition-colors"
                >
                  Join as Merchant
                </Link>
              </li>
              <li>
                <Link
                  href="/rider/join"
                  className="hover:text-white transition-colors"
                >
                  Become a Rider
                </Link>
              </li>
              <li>
                <Link
                  href="/business"
                  className="hover:text-white transition-colors"
                >
                  Business Solutions
                </Link>
              </li>
              <li>
                <Link
                  href="/api"
                  className="hover:text-white transition-colors"
                >
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>📧 support@townkart.com</li>
              <li>📱 +91 9784740736</li>
              <li>🏢 Rajasthan </li>
              <li>🌐 www.townkart.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
          <p>
            © 2025 TownKart. All rights reserved. Made with{" "}
            <a
              href="https://pawansuthar.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Pawan Kumar
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

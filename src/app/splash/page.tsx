"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";

export default function SplashPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 5;
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-townkart-primary via-townkart-secondary to-townkart-accent flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="text-center z-10">
        {/* Logo */}
        <div className="mb-8 animate-bounce">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <ShoppingCart className="h-12 w-12 text-townkart-primary" />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
          TownKart
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-white/90 mb-8 animate-fade-in animation-delay-300">
          Local Commerce Made Easy
        </p>

        {/* Progress Bar */}
        <div className="w-64 mx-auto mb-4">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Loading Text */}
        <p className="text-white/80 text-sm animate-pulse">
          Preparing your experience...
        </p>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10 animate-float">
        <div className="w-4 h-4 bg-white/30 rounded-full"></div>
      </div>
      <div className="absolute top-20 right-20 animate-float animation-delay-500">
        <div className="w-6 h-6 bg-white/20 rounded-full"></div>
      </div>
      <div className="absolute bottom-20 left-20 animate-float animation-delay-1000">
        <div className="w-3 h-3 bg-white/40 rounded-full"></div>
      </div>
      <div className="absolute bottom-10 right-10 animate-float animation-delay-1500">
        <div className="w-5 h-5 bg-white/25 rounded-full"></div>
      </div>
    </div>
  );
}

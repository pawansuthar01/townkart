"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  ShoppingCart,
  Store,
  Bike,
  MapPin,
  Clock,
  Shield,
  Star,
  Users,
  Truck,
  CreditCard,
  Smartphone,
  CheckCircle,
  Search,
  Filter,
  Heart,
  Plus,
  Minus,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Play,
  Award,
  TrendingUp,
  Zap,
  Gift,
  Home,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import SpecialOffer from "./SpecialOffer";
import { motion } from "framer-motion";
// Hero Banner Component
function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const slides = [
    {
      id: "ss",
      title: "Fresh Groceries Delivered Fast",
      subtitle:
        "Get fresh produce and daily essentials delivered to your doorstep in under 30 minutes with our lightning-fast delivery service",
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1920&h=1080&fit=crop",
      cta: "Shop Groceries Now",
      link: "/categories/grocery",
    },
    {
      id: "ss4",
      title: "Medicines & Healthcare at Your Doorstep",
      subtitle:
        "Order medicines and health products with free prescription upload and doorstep delivery within 60 minutes",
      image:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1920&h=1080&fit=crop",
      cta: "Order Medicines",
      link: "/categories/medicine",
    },
    {
      id: "sss",
      title: "Restaurant Food Delivery Made Easy",
      subtitle:
        "Order from your favorite restaurants with live GPS tracking and contactless delivery for complete safety",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1920&h=1080&fit=crop",
      cta: "Order Food Online",
      link: "/categories/food",
    },
    {
      id: "ssss",
      title: "Fashion & Lifestyle Shopping",
      subtitle:
        "Discover trendy fashion, accessories, and lifestyle products from top brands with free shipping on orders above ₹999",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop",
      cta: "Shop Fashion",
      link: "/categories/fashion",
    },
    {
      id: "ssss",
      title: "Electronics & Gadgets Store",
      subtitle:
        "Latest electronics, smartphones, and gadgets with warranty, free installation, and doorstep delivery",
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1920&h=1080&fit=crop",
      cta: "Shop Electronics",
      link: "/categories/electronics",
    },
  ];

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    }, 6000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [slides.length, isPaused]);

  // Touch/Swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }
    if (isRightSwipe) {
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      } else if (e.key === "ArrowRight") {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  return (
    <div
      ref={carouselRef}
      className="relative h-screen overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <section className="relative h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Full-screen banner container */}
        <div className="relative h-full w-full max-w-[1400px] mx-auto">
          {slides.map((slide, index) => (
            <motion.div
              key={slide.id}
              className={`absolute inset-0 ${index === currentSlide ? "z-10" : "z-0"}`}
              initial={{
                x:
                  index === currentSlide
                    ? 0
                    : index < currentSlide
                      ? "-100%"
                      : "100%",
              }}
              animate={{
                x:
                  index === currentSlide
                    ? 0
                    : index < currentSlide
                      ? "-100%"
                      : "100%",
                opacity: index === currentSlide ? 1 : 0.2,
              }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Full-screen background image */}
              <motion.div
                className="absolute inset-0 w-full h-full"
                style={{ backgroundImage: `url(${slide.image})` }}
                animate={{ scale: index === currentSlide ? 1.1 : 1 }}
                transition={{ duration: 8, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-cover bg-center" />
              </motion.div>

              {/* Overlay gradients */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Content positioned on right side */}
              <div className="relative z-10 h-full flex items-center justify-end">
                <motion.div
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 1,
                    delay: 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="text-right text-white space-y-6 max-w-lg mr-8 md:mr-16 lg:mr-24"
                >
                  {/* Main content */}
                  <div className="space-y-4">
                    <motion.h1
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-light leading-tight"
                    >
                      <span className="block text-white">{slide.title}</span>
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                      className="text-lg md:text-xl text-white/90 leading-relaxed"
                    >
                      {slide.subtitle}
                    </motion.p>
                  </div>

                  {/* CTA Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="flex flex-col sm:flex-row gap-4 justify-end pt-6"
                  >
                    <Link
                      href={slide.link || "/product"}
                      className="inline-block bg-white text-black font-semibold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors duration-300 text-center"
                    >
                      {slide.cta || "Shop Now"}
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 right-8 z-20">
          <div className="flex space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-white scale-125"
                    : "bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-20">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
            initial={{ width: "0%" }}
            animate={{
              width: `${((currentSlide + 1) / slides.length) * 100}%`,
            }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      </section>
    </div>
  );
}

// Stats Section Component
function StatsSection() {
  const stats = [
    { number: "10,000+", label: "Happy Customers", icon: Users },
    { number: "500+", label: "Partner Shops", icon: Store },
    { number: "50,000+", label: "Orders Delivered", icon: Truck },
    { number: "4.8", label: "Average Rating", icon: Star },
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Impact in Numbers
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trusted by thousands of customers across the city
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="group text-center">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-gradient-to-br from-townkart-primary to-townkart-secondary rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <stat.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-townkart-primary to-townkart-secondary bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-lg font-semibold text-gray-700">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Why Choose Us Section Component
function WhyChooseUsSection() {
  const features = [
    {
      icon: Truck,
      title: "Lightning Fast Delivery",
      description:
        "Get your orders delivered within 30-60 minutes in your city with real-time GPS tracking",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Shield,
      title: "100% Safe & Secure",
      description:
        "Contactless delivery, OTP verification, and quality assurance for every order",
      color: "from-green-500 to-green-600",
    },
    {
      icon: CreditCard,
      title: "Multiple Payment Options",
      description:
        "Pay with UPI, cards, wallets, COD, or EMI. Secure transactions guaranteed",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Award,
      title: "Best Price Guarantee",
      description:
        "We match or beat competitor prices with exclusive offers and cashback rewards",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Users,
      title: "24/7 Customer Support",
      description:
        "Round-the-clock support via chat, call, or WhatsApp for all your queries",
      color: "from-teal-500 to-cyan-500",
    },
    {
      icon: Zap,
      title: "Easy Returns & Refunds",
      description:
        "Hassle-free returns within 7 days with instant refunds to your wallet",
      color: "from-pink-500 to-rose-500",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-white to-gray-50">
      <div className="w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Choose TownKart?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience the future of local shopping with our innovative platform
            designed for your convenience and safety
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 bg-white overflow-hidden">
                <CardContent className="p-8 text-center relative">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-townkart-primary/5 to-transparent rounded-bl-full"></div>

                  <div
                    className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <feature.icon className="h-12 w-12 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-6 group-hover:text-townkart-primary transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 text-lg leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover effect line */}
                  <div className="w-0 group-hover:w-full h-1 bg-gradient-to-r from-townkart-primary to-townkart-secondary mx-auto mt-6 transition-all duration-300"></div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Ads Banner Component
function AdsBanner() {
  const ads = [
    {
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
      title: "Fresh Produce Sale",
      discount: "50% OFF",
      validTill: "Dec 31",
    },
    {
      image:
        "https://images.unsplash.com/photo-1587854680352-936b22b91030?w=400&h=300&fit=crop",
      title: "Medicine Special",
      discount: "30% OFF",
      validTill: "Dec 25",
    },
    {
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      title: "Food Festival",
      discount: "Buy 1 Get 1",
      validTill: "Dec 20",
    },
    {
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      title: "Fashion Week",
      discount: "40% OFF",
      validTill: "Dec 28",
    },
  ];

  return (
    <section className="py-6 px-4">
      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ads.map((ad, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0"
            >
              <div className="relative h-24 md:h-32">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${ad.image})` }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
                  <div>
                    <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs">
                      {ad.discount}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs md:text-sm mb-1">
                      {ad.title}
                    </h3>
                    <p className="text-xs opacity-90">
                      Valid till {ad.validTill}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Categories Section Component
function CategoriesSection() {
  const categories = [
    {
      id: "grocery",
      name: "Grocery",
      icon: ShoppingCart,
      count: 245,
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop",
      color: "from-green-500 to-green-600",
      description: "Fresh produce & daily essentials",
    },
    {
      id: "food",
      name: "Food",
      icon: Store,
      count: 189,
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
      color: "from-orange-500 to-red-500",
      description: "Restaurants & food delivery",
    },
    {
      id: "medicine",
      name: "Medicine",
      icon: Shield,
      count: 67,
      image:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
      color: "from-blue-500 to-blue-600",
      description: "Pharmacy & healthcare",
    },
    {
      id: "fashion",
      name: "Fashion",
      icon: Users,
      count: 134,
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
      color: "from-purple-500 to-pink-500",
      description: "Clothing & accessories",
    },
    {
      id: "electronics",
      name: "Electronics",
      icon: Smartphone,
      count: 89,
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=200&fit=crop",
      color: "from-gray-700 to-gray-800",
      description: "Gadgets & electronics",
    },
    {
      id: "household",
      name: "Household",
      icon: Home,
      count: 156,
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop",
      color: "from-teal-500 to-cyan-500",
      description: "Home & kitchen essentials",
    },
  ];

  return (
    <section className="py-8 px-4">
      <div className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover products from your favorite categories with fast delivery
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.id}`}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-full border-0">
                <div className="relative h-40 md:h-48">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${category.image})` }}
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-90 group-hover:opacity-80 transition-opacity`}
                  />
                  <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                      <div
                        className={`p-2 rounded-full bg-white/20 backdrop-blur-sm`}
                      >
                        <category.icon className="h-5 w-5" />
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">
                        {category.count}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">
                        {category.name}
                      </h3>
                      <p className="text-xs text-white/90 mb-2">
                        {category.description}
                      </p>
                      <Button className="bg-white text-gray-900 hover:bg-gray-100 font-medium text-xs px-3 py-1 h-7">
                        Explore
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Collections Section Component
function CollectionsSection() {
  const collections = [
    {
      id: "trending",
      title: "Trending Now",
      subtitle: "Most popular products this week",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
      itemCount: 25,
      link: "/products/trending",
    },
    {
      id: "offers",
      title: "Special Offers",
      subtitle: "Up to 50% off on selected items",
      image:
        "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop",
      itemCount: 18,
      link: "/offers",
    },
    {
      id: "new",
      title: "New Arrivals",
      subtitle: "Latest products from top brands",
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop",
      itemCount: 32,
      link: "/products",
    },
  ];

  return (
    <section className="py-8 px-4 bg-gray-50">
      <div className="w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Collections
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore curated collections of the best products
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Link key={collection.id} href={`${collection.link}`}>
              <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border-0">
                <div className="relative h-64">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${collection.image})` }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:bg-opacity-40 transition-all" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-white/20 text-white border-white/30">
                        {collection.itemCount} items
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">
                        {collection.title}
                      </h3>
                      <p className="text-white/90 mb-4 text-sm">
                        {collection.subtitle}
                      </p>
                      <Button className="bg-white text-gray-900 hover:bg-gray-100 font-medium px-4 py-2">
                        View Collection
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Trending Products Section Component
function TrendingProductsSection() {
  const { addItem } = useCart();

  const products = [
    {
      id: 1,
      name: "Fresh Organic Tomatoes",
      price: 40,
      originalPrice: 50,
      discount: 20,
      rating: 4.5,
      reviews: 128,
      image:
        "https://images.unsplash.com/photo-1546470427-e9e826abd807?w=300&h=200&fit=crop",
      shop: "Fresh Mart",
      distance: "0.8 km",
      stock: 25,
    },
    {
      id: 2,
      name: "Grilled Chicken Salad",
      price: 180,
      rating: 4.8,
      reviews: 95,
      image:
        "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop",
      shop: "Healthy Bites Cafe",
      distance: "1.2 km",
      stock: 15,
    },
    {
      id: 3,
      name: "Wireless Headphones",
      price: 2499,
      originalPrice: 2999,
      discount: 17,
      rating: 4.6,
      reviews: 203,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
      shop: "TechHub Electronics",
      distance: "2.1 km",
      stock: 8,
    },
    {
      id: 4,
      name: "Paracetamol Tablets",
      price: 25,
      rating: 4.9,
      reviews: 67,
      image:
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop",
      shop: "City Pharmacy",
      distance: "0.5 km",
      stock: 50,
    },
    {
      id: 5,
      name: "Premium Coffee Beans",
      price: 450,
      rating: 4.7,
      reviews: 156,
      image:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=200&fit=crop",
      shop: "Brew Masters",
      distance: "1.5 km",
      stock: 20,
    },
    {
      id: 6,
      name: "Running Shoes",
      price: 2999,
      originalPrice: 3999,
      discount: 25,
      rating: 4.4,
      reviews: 89,
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop",
      shop: "SportZone",
      distance: "3.2 km",
      stock: 12,
    },
    {
      id: 7,
      name: "Smart Watch",
      price: 5999,
      originalPrice: 7999,
      discount: 25,
      rating: 4.6,
      reviews: 234,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop",
      shop: "Gadget World",
      distance: "1.8 km",
      stock: 15,
    },
    {
      id: 8,
      name: "Yoga Mat",
      price: 899,
      rating: 4.8,
      reviews: 145,
      image:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop",
      shop: "Fitness First",
      distance: "2.5 km",
      stock: 30,
    },
    {
      id: 9,
      name: "LED Desk Lamp",
      price: 1299,
      originalPrice: 1599,
      discount: 19,
      rating: 4.5,
      reviews: 98,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
      shop: "Home Essentials",
      distance: "1.3 km",
      stock: 22,
    },
    {
      id: 10,
      name: "Face Moisturizer",
      price: 499,
      rating: 4.7,
      reviews: 167,
      image:
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=200&fit=crop",
      shop: "Beauty Hub",
      distance: "0.9 km",
      stock: 18,
    },
    {
      id: 11,
      name: "Notebook Set",
      price: 199,
      rating: 4.6,
      reviews: 89,
      image:
        "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300&h=200&fit=crop",
      shop: "Stationery Plus",
      distance: "1.7 km",
      stock: 45,
    },
    {
      id: 12,
      name: "Wall Clock",
      price: 799,
      originalPrice: 999,
      discount: 20,
      rating: 4.4,
      reviews: 76,
      image:
        "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=300&h=200&fit=crop",
      shop: "Decor World",
      distance: "2.8 km",
      stock: 14,
    },
  ];

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      shop: product.shop,
      stock: product.stock,
    });
  };

  return (
    <section className="py-8 px-4">
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Trending Products
            </h2>
            <p className="text-lg text-gray-600">
              Most popular items loved by our customers
            </p>
          </div>
          <Link href="/products">
            <Button variant="outline" size="lg" className="font-medium">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 cursor-pointer">
                <CardContent className="p-0">
                  <div className="relative">
                    <div
                      className="h-36 md:h-40 bg-cover bg-center"
                      style={{ backgroundImage: `url(${product.image})` }}
                    />

                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" className="p-2">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-townkart-primary transition-colors">
                        {product.name}
                      </h3>

                      <div className="flex items-center space-x-1 mb-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(product.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          ({product.reviews})
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            ₹{product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        className="w-full townkart-gradient hover:opacity-90 font-medium text-sm py-2"
                        size="sm"
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Newsletter Section Component
function NewsletterSection() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribed with:", email);
    setEmail("");
  };

  return (
    <section className="py-8 px-4 bg-gray-900 text-white">
      <div className="w-full text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
        <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
          Get the latest offers, new product launches, and exclusive deals
          delivered to your inbox
        </p>

        <form
          onSubmit={handleSubscribe}
          className="max-w-md mx-auto flex gap-3"
        >
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 bg-white text-gray-900 border-0"
          />
          <Button
            type="submit"
            className="townkart-gradient hover:opacity-90 px-6 font-medium"
          >
            Subscribe
          </Button>
        </form>

        <p className="text-sm text-gray-400 mt-4">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}

export function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroBanner />
      <AdsBanner />
      <CategoriesSection />
      <SpecialOffer />
      <CollectionsSection />
      <TrendingProductsSection />
      <NewsletterSection />
      <StatsSection />
      <WhyChooseUsSection />
      <Footer />
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Loader2,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import SpecialOffer from "./SpecialOffer";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { fetchBanners } from "@/store/slices/bannerSlice";
import { fetchAds } from "@/store/slices/adSlice";
import { fetchSpecialOffers } from "@/store/slices/specialOfferSlice";
import { fetchCollections } from "@/store/slices/collectionSlice";
import { RootState, AppDispatch } from "@/store";
import {
  ImageWithFallback,
  getDefaultImage,
} from "@/components/shared/ImageWithFallback";
import { useWishlist } from "@/hooks/useWishlist";

// Location and caching utilities
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

interface CachedData {
  banners?: any[];
  ads?: any[];
  categories?: any[];
  lastFetch: number;
  location?: LocationData;
}

const CACHE_KEY = "townkart_home_data";
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

const useLocationAndCache = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [cachedData, setCachedData] = useState<CachedData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load cached data on mount
  useEffect(() => {
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsedData: CachedData = JSON.parse(cached);
          const now = Date.now();

          // Check if cache is still valid
          if (now - parsedData.lastFetch < CACHE_DURATION) {
            setCachedData(parsedData);
            if (parsedData.location) {
              setLocation(parsedData.location);
            }
          }
        }
      } catch (error) {
        console.error("Error loading cached data:", error);
      }
    };

    loadCachedData();
  }, []);

  // Detect user location
  const detectLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          resolve(locationData);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }, []);

  // Update location and cache
  const updateLocation = useCallback(async () => {
    try {
      const locationData = await detectLocation();
      setLocation(locationData);

      // Update cache with new location
      setCachedData((prev) => {
        const updated = {
          ...prev,
          location: locationData,
          lastFetch: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Error detecting location:", error);
      // Set location to null if detection fails - app will work without location
      setLocation(null);

      // Update cache without location
      setCachedData((prev) => {
        const updated = {
          ...prev,
          location: undefined,
          lastFetch: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
    } finally {
      setIsLoadingLocation(false);
    }
  }, [detectLocation]);

  // Cache data
  const cacheData = useCallback((key: keyof CachedData, data: any) => {
    setCachedData((prev) => {
      const updated = {
        ...prev,
        [key]: data,
        lastFetch: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get cached data
  const getCachedData = useCallback(
    (key: keyof CachedData) => {
      return cachedData?.[key];
    },
    [cachedData]
  );

  // Check if data needs refresh
  const shouldRefreshData = useCallback(() => {
    if (!cachedData) return true;
    const now = Date.now();
    return now - cachedData.lastFetch > CACHE_DURATION;
  }, [cachedData]);

  // Start periodic location updates
  useEffect(() => {
    // Initial location detection
    updateLocation();

    // Set up interval for location updates every 15 minutes
    intervalRef.current = setInterval(() => {
      updateLocation();
    }, CACHE_DURATION);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateLocation]);

  return {
    location,
    cachedData,
    isLoadingLocation,
    cacheData,
    getCachedData,
    shouldRefreshData,
  };
};

// Hero Banner Component
function HeroBanner() {
  const dispatch = useDispatch<AppDispatch>();
  const { banners, loading } = useSelector((state: RootState) => state.banners);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Use cached banners if available
  const displayBanners = banners.length > 0 ? banners : [];

  useEffect(() => {
    if (banners.length === 0) {
      dispatch(fetchBanners())
        .unwrap()
        .catch(() => {});
    }
  }, [dispatch, banners.length]);

  // Transform banner data to match the expected slide format
  const slides = banners.map((banner: any) => ({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle || "",
    image: banner.imageUrl,
    cta: "Shop Now",
    link: banner.linkUrl || "/products",
  }));

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
                animate={{ scale: index === currentSlide ? 1.1 : 1 }}
                transition={{ duration: 8, ease: "easeOut" }}
              >
                <ImageWithFallback
                  src={slide.image}
                  fallbackSrc={getDefaultImage("banner")}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
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

// Stats Section Component with real data
function StatsSection() {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        // Fallback to default stats if API fails
        setStats([
          {
            number: "50K+",
            label: "Happy Customers",
            icon: Users,
          },
          {
            number: "1000+",
            label: "Partner Stores",
            icon: Store,
          },
          {
            number: "500K+",
            label: "Orders Delivered",
            icon: Truck,
          },
          {
            number: "4.8",
            label: "Average Rating",
            icon: Star,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Our Impact in Numbers
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Our Impact in Numbers
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Trusted by thousands of customers across the city
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent =
              stat.icon === "Users"
                ? Users
                : stat.icon === "Store"
                  ? Store
                  : stat.icon === "Truck"
                    ? Truck
                    : Star;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group text-center"
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-gradient-to-br from-townkart-primary to-townkart-secondary rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="h-8 w-8 text-white" />
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
              </motion.div>
            );
          })}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
  const dispatch = useDispatch<AppDispatch>();
  const { ads, loading } = useSelector((state: RootState) => state.ads);

  // Use cached ads if available
  const displayAds = ads.length > 0 ? ads : [];

  useEffect(() => {
    if (ads.length === 0) {
      dispatch(fetchAds())
        .unwrap()
        .catch(() => {});
    }
  }, [dispatch, ads.length]);

  return (
    <section className="py-6 px-4">
      <div className="container-max mobile-first">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {displayAds.map((ad, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0"
            >
              <div className="relative h-24 md:h-32">
                <ImageWithFallback
                  src={ad.imageUrl || undefined}
                  fallbackSrc={getDefaultImage("ad")}
                  alt={ad.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
                  <div>
                    <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs">
                      {ad.title}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs md:text-sm mb-1">
                      {ad.description || ad.title}
                    </h3>
                    <p className="text-xs opacity-90">{ad.position}</p>
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
const CategoriesSection = React.memo(
  ({ cachedCategories }: { cachedCategories?: any[] }) => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
      // Use cached categories if available
      if (cachedCategories && cachedCategories.length > 0) {
        const mappedCategories = cachedCategories.map((category: any) => ({
          id: category.id,
          name: category.name,
          icon: getIconComponent(category.icon || "ShoppingCart"),
          count: category.count || 0,
          image: category.image,
          color: category.color || "from-green-500 to-green-600",
          description: category.description || category.name,
        }));
        setCategories(mappedCategories);
        setHasFetched(true);
        return;
      }

      // Only fetch once when component mounts and no cached data
      if (!hasFetched && !cachedCategories) {
        fetchCategories();
      }
    }, [cachedCategories, hasFetched]);

    const getIconComponent = (iconName: string) => {
      const icons: Record<string, any> = {
        ShoppingCart,
        Store,
        Shield,
        Users,
        Smartphone,
        Home,
      };
      return icons[iconName] || ShoppingCart;
    };

    const fetchCategories = async () => {
      // Prevent multiple calls
      if (hasFetched || loading) return;
      try {
        setLoading(true);
        // Use direct fetch instead of useProducts hook for categories
        const response = await fetch("/api/categories");
        const data = await response.json();
        const categoriesData = data.success ? data.categories : [];

        if (categoriesData && categoriesData.length > 0) {
          const mappedCategories = categoriesData.map((category: any) => ({
            id: category.id,
            name: category.name,
            icon: getIconComponent(category.icon || "ShoppingCart"),
            count: category.count || 0,
            image: category.image,
            color: category.color || "from-green-500 to-green-600",
            description: category.description || category.name,
          }));
          setCategories(mappedCategories);
        } else {
          // No categories available from API
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // No fallback categories - show empty state
        setCategories([]);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };

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

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-0">
                  <CardContent className="p-0">
                    <div className="h-40 md:h-48 bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <ShoppingCart className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No categories available
              </h3>
              <p className="text-gray-600 mb-6">
                Categories will be available once stores are added to the
                platform.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link key={category.id} href={`/categories/${category.id}`}>
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-full border-0">
                    <div className="relative h-40 md:h-48">
                      <ImageWithFallback
                        src={category.image || undefined}
                        fallbackSrc={getDefaultImage("banner")}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-t ${category.color || "from-gray-500 to-gray-600"} opacity-90 group-hover:opacity-80 transition-opacity`}
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
          )}
        </div>
      </section>
    );
  }
);

// Trending Products Section Component
const TrendingProductsSection = React.memo(
  ({ userLocation }: { userLocation?: any }) => {
    const { addItem, isAnimating: cartAnimating } = useCart();
    const {
      toggleWishlist,
      isInWishlist,
      isAnimating: wishlistAnimating,
    } = useWishlist();
    const { user, isAuthenticated } = useAuth();
    const { getTrendingProducts } = useProducts();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    useEffect(() => {
      if (!hasFetched) {
        fetchTrendingProducts();
        setHasFetched(true);
      }
    }, []);

    const fetchTrendingProducts = async () => {
      // Prevent multiple calls
      if (hasFetched) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const isMobile =
          typeof window !== "undefined" && window.innerWidth < 768;
        const limit = isMobile ? 20 : 40;

        const data = await getTrendingProducts(limit);
        console.log("Trending products data:", data);
        if (data && data.data && data.data.length > 0) {
          const sortedProducts = data.data.sort((a: any, b: any) => {
            const ratingA = a.averageRating || 0;
            const ratingB = b.averageRating || 0;
            return ratingB - ratingA;
          });
          setProducts(sortedProducts);
        } else {
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const handleAddToCart = (product: any) => {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.primaryImage || product.images?.[0] || product.image,
        quantity: 1,
        shop: product.store?.name || "Unknown Shop",
        stock: product.stockQuantity,
      });
    };

    const handleToggleWishlist = (product: any) => {
      toggleWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.primaryImage || product.images?.[0] || product.image,
        shop: product.store?.name || "Unknown Shop",
        category: product.categoryName,
        description: product.description,
      });
    };

    if (loading || seeding) {
      return (
        <section className="py-8 px-4">
          <div className="w-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Trending Products
                </h2>
                <p className="text-lg text-gray-600">
                  {seeding ? "Initializing database..." : "Loading products..."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[...Array(40)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-0">
                  <CardContent className="p-0">
                    <div className="h-36 md:h-40 bg-gray-200 animate-pulse" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (error) {
      return (
        <section className="py-8 px-4">
          <div className="w-full">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Trending Products
                </h2>
                <p className="text-lg text-gray-600">Failed to load products</p>
              </div>
            </div>
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchTrendingProducts} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </section>
      );
    }

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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 cursor-pointer">
                  <CardContent className="p-0">
                    <div className="relative">
                      <ImageWithFallback
                        src={
                          product.primaryImage ||
                          product.images?.[0] ||
                          undefined
                        }
                        fallbackSrc={getDefaultImage("product")}
                        alt={product.name}
                        width={200}
                        height={150}
                        className="object-cover rounded-t-lg w-full h-32"
                      />

                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className={`p-2 relative ${wishlistAnimating ? "animate-pulse" : ""}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleToggleWishlist(product);
                          }}
                        >
                          <Heart
                            className={`h-3 w-3 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`}
                          />
                          {wishlistAnimating && (
                            <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded animate-ping"></div>
                          )}
                        </Button>
                        <Button size="sm" variant="secondary" className="p-2">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>

                      {product.discountedPrice && (
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-red-500 hover:bg-red-600 text-white">
                            {Math.round(
                              ((product.price - product.discountedPrice) /
                                product.price) *
                                100
                            )}
                            % OFF
                          </Badge>
                        </div>
                      )}

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
                                  i < Math.floor(product.averageRating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">
                            ({product.totalReviews || 0})
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{product.discountedPrice || product.price}
                            </span>
                            {product.discountedPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{product.price}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product);
                          }}
                          className={`w-full townkart-gradient hover:opacity-90 font-medium text-sm py-2 relative ${cartAnimating ? "animate-pulse" : ""}`}
                          size="sm"
                          disabled={product.stockQuantity <= 0}
                        >
                          {product.stockQuantity <= 0
                            ? "Out of Stock"
                            : "Add to Cart"}
                          {cartAnimating && (
                            <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded animate-ping"></div>
                          )}
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
);

// Newsletter Section Component
const NewsletterSection = React.memo(() => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
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
});

export function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Location and caching hooks
  const {
    location,
    cachedData,
    isLoadingLocation,
    cacheData,
    getCachedData,
    shouldRefreshData,
  } = useLocationAndCache();

  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // If authenticated and not customer, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user?.activeRole && user.activeRole !== "CUSTOMER") {
      switch (user.activeRole) {
        case "ADMIN":
          router.push("/admin");
          break;
        case "RIDER":
          router.push("/rider/rider-dashboard");
          break;
        case "STORE_MANAGER":
          router.push("/store");
          break;
        default:
          break;
      }
    }
  }, [isAuthenticated, user?.activeRole, router]);

  // Fetch home page data with caching
  const fetchHomePageData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if we need to refresh data
      if (!shouldRefreshData() && cachedData) {
        setDataLoaded(true);
        setIsLoading(false);
        return;
      }

      // Fetch banners
      if (!getCachedData("banners")) {
        try {
          const bannersResult = await dispatch(fetchBanners()).unwrap();
          cacheData("banners", bannersResult);
        } catch (error) {
          console.error("Error fetching banners:", error);
        }
      }

      // Fetch ads
      if (!getCachedData("ads")) {
        try {
          const adsResult = await dispatch(fetchAds()).unwrap();
          cacheData("ads", adsResult);
        } catch (error) {
          console.error("Error fetching ads:", error);
        }
      }

      // Fetch categories
      if (!getCachedData("categories")) {
        try {
          const categoriesResponse = await fetch("/api/categories");
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json();
            if (categoriesData.success) {
              cacheData("categories", categoriesData.categories);
            }
          }
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      }

      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching home page data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, shouldRefreshData, cachedData, cacheData, getCachedData]);

  // Initial data fetch
  useEffect(() => {
    fetchHomePageData();
  }, [fetchHomePageData]);

  // Handle page visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && shouldRefreshData()) {
        fetchHomePageData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [shouldRefreshData, fetchHomePageData]);

  // Loading state
  if (isLoading || isLoadingLocation) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-townkart-primary mx-auto" />
            <div className="space-y-2">
              <p className="text-gray-600">
                Loading your personalized experience...
              </p>
              {isLoadingLocation && (
                <p className="text-sm text-gray-500">
                  Detecting your location for better recommendations
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For customers or unauthenticated users, show home page
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-white"
      >
        <HeroBanner />
        <AdsBanner />
        <CategoriesSection
          cachedCategories={getCachedData("categories") as any[] | undefined}
        />
        <SpecialOffer />
        <TrendingProductsSection userLocation={location} />

        <NewsletterSection />
        <StatsSection />
        <WhyChooseUsSection />
      </motion.div>
    </AnimatePresence>
  );
}

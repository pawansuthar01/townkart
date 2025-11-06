"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function SpecialOffer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set countdown to end in 7 days from now
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          ),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-gradient-to-r from-townkart-primary/20 to-townkart-secondary/20 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-townkart-primary/30 dark:bg-townkart-primary/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-townkart-secondary/30 dark:bg-townkart-secondary/20 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-townkart-accent/30 dark:bg-townkart-accent/20 rounded-full blur-xl"></div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Up to 50% Off on
                <span className="block text-townkart-primary dark:text-townkart-primary">
                  Summer Collection
                </span>
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-6 md:mb-8 max-w-lg mx-auto lg:mx-0">
                Don't miss out on our biggest summer sale! Get amazing discounts
                on trendy summer fashion, accessories, and more.
              </p>
            </motion.div>

            {/* Countdown Timer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="mb-6 md:mb-8"
            >
              <p className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Sale ends in:
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-4">
                <div className="text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 md:p-4 min-w-[60px] md:min-w-[70px]">
                    <div className="text-2xl md:text-3xl font-bold text-townkart-primary dark:text-townkart-primary">
                      {timeLeft.days}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Days
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 md:p-4 min-w-[60px] md:min-w-[70px]">
                    <div className="text-2xl md:text-3xl font-bold text-townkart-primary dark:text-townkart-primary">
                      {timeLeft.hours}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Hours
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 md:p-4 min-w-[60px] md:min-w-[70px]">
                    <div className="text-2xl md:text-3xl font-bold text-townkart-primary dark:text-townkart-primary">
                      {timeLeft.minutes}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Min
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 md:p-4 min-w-[60px] md:min-w-[70px]">
                    <div className="text-2xl md:text-3xl font-bold text-townkart-primary dark:text-townkart-primary">
                      {timeLeft.seconds}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Sec
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Link
                href="/product"
                className="inline-block bg-townkart-primary hover:bg-townkart-primary/90 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-lg transition-colors duration-300 transform hover:scale-105 shadow-lg text-sm md:text-base"
              >
                Shop Sale Now
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Side - Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative flex justify-center lg:justify-end">
              <img
                src="https://res.cloudinary.com/dzyaapsz3/image/upload/v1762258197/restaurants/cmh4yzf1o0000g0y0y5lfqod0/pexels-photo-8638766-removebg-preview-1762258196927.png"
                alt="Summer Collection Sale"
                className="w-full max-w-sm md:max-w-md lg:max-w-lg h-auto rounded-2xl  object-contain"
                loading="lazy"
              />

              {/* Sale Badge */}
              <div className="absolute top-3 md:top-6 left-3 md:left-6 bg-red-500 text-white px-3 md:px-4 py-1 md:py-2 rounded-full font-bold text-sm md:text-lg shadow-lg">
                50% OFF
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-2 md:-top-4 -right-2 md:-right-4 bg-yellow-400 text-black px-2 md:px-3 py-1 md:py-2 rounded-full font-bold shadow-lg text-sm md:text-base"
              >
                🔥 HOT
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 10, 0],
                  rotate: [0, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -bottom-2 md:-bottom-4 -left-2 md:-left-4 bg-townkart-secondary text-white px-2 md:px-3 py-1 md:py-2 rounded-full font-bold shadow-lg text-sm md:text-base"
              >
                SALE!
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { useState, useEffect } from "react";

export function useScrollFixed(threshold: number = 10) {
  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsFixed(scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return isFixed;
}

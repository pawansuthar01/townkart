import { useState, useEffect } from "react";

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        // Fallback for older browsers
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
};

// Predefined media query hooks
export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
export const useIsTablet = () =>
  useMediaQuery("(min-width: 769px) and (max-width: 1024px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1025px)");
export const useIsLargeDesktop = () => useMediaQuery("(min-width: 1440px)");

// Orientation hooks
export const useIsPortrait = () => useMediaQuery("(orientation: portrait)");
export const useIsLandscape = () => useMediaQuery("(orientation: landscape)");

// Touch device detection
export const useIsTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkTouch = () => {
      setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();

    // Re-check on resize (some devices might change)
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  return isTouch;
};

// Reduced motion preference
export const usePrefersReducedMotion = () => {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
};

// Dark mode preference
export const usePrefersDarkMode = () => {
  return useMediaQuery("(prefers-color-scheme: dark)");
};

// High contrast mode
export const usePrefersHighContrast = () => {
  return useMediaQuery("(prefers-contrast: high)");
};

// Custom breakpoint hooks
export const useBreakpoint = (breakpoint: number) => {
  return useMediaQuery(`(min-width: ${breakpoint}px)`);
};

export const useBreakpointRange = (min: number, max: number) => {
  return useMediaQuery(`(min-width: ${min}px) and (max-width: ${max}px)`);
};

// Common breakpoints
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export const useBreakpointValue = <T>(
  values: Record<string, T>,
): T | undefined => {
  const isXs = useMediaQuery(`(min-width: ${breakpoints.xs}px)`);
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md}px)`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);
  const is2xl = useMediaQuery(`(min-width: ${breakpoints["2xl"]}px)`);

  if (is2xl && values["2xl"]) return values["2xl"];
  if (isXl && values.xl) return values.xl;
  if (isLg && values.lg) return values.lg;
  if (isMd && values.md) return values.md;
  if (isSm && values.sm) return values.sm;
  if (isXs && values.xs) return values.xs;

  return undefined;
};

// Container query hook (for element-based responsive design)
export const useContainerQuery = (
  containerRef: React.RefObject<HTMLElement>,
  breakpoints: { [key: string]: number },
) => {
  const [activeBreakpoint, setActiveBreakpoint] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;

        // Find the largest breakpoint that fits
        let currentBreakpoint: string | null = null;
        for (const [name, minWidth] of Object.entries(breakpoints)) {
          if (width >= minWidth) {
            currentBreakpoint = name;
          } else {
            break;
          }
        }

        setActiveBreakpoint(currentBreakpoint);
      }
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [containerRef, breakpoints]);

  return activeBreakpoint;
};

// Print media query
export const useIsPrinting = () => useMediaQuery("print");

// Network information hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [connection, setConnection] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Network status
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Connection information (if available)
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      setConnection({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });

      const updateConnection = () => {
        setConnection({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      };

      connection.addEventListener("change", updateConnection);

      return () => {
        window.removeEventListener("online", updateOnlineStatus);
        window.removeEventListener("offline", updateOnlineStatus);
        connection.removeEventListener("change", updateConnection);
      };
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return { isOnline, connection };
};

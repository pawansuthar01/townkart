import { useState, useEffect, useCallback, useRef } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  hasNextPage?: boolean;
  isLoading?: boolean;
}

interface UseInfiniteScrollReturn {
  loadMore: () => void;
  isLoading: boolean;
  hasNextPage: boolean;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export const useInfiniteScroll = (
  onLoadMore: () => void | Promise<void>,
  options: UseInfiniteScrollOptions = {},
): UseInfiniteScrollReturn => {
  const {
    threshold = 0.1,
    rootMargin = "100px",
    hasNextPage = true,
    isLoading = false,
  } = options;

  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasNextPage) return;

    setLoading(true);
    try {
      await onLoadMore();
    } finally {
      setLoading(false);
    }
  }, [loading, hasNextPage, onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loading && hasNextPage) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(sentinel);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, loading, hasNextPage, threshold, rootMargin]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    loadMore,
    isLoading: loading || isLoading,
    hasNextPage,
    sentinelRef,
  };
};

// Hook for managing paginated data with infinite scroll
export const useInfiniteData = <T>(
  fetchFunction: (
    page: number,
    limit: number,
  ) => Promise<{ data: T[]; hasNextPage: boolean }>,
  options: {
    initialLimit?: number;
    enabled?: boolean;
  } = {},
) => {
  const { initialLimit = 20, enabled = true } = options;

  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (!enabled || !hasNextPage || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(page, initialLimit);

      setData((prev) => [...prev, ...result.data]);
      setHasNextPage(result.hasNextPage);
      setPage((prev) => prev + 1);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, hasNextPage, isLoading, page, initialLimit, fetchFunction]);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(1);
    setHasNextPage(true);
    setError(null);

    if (enabled) {
      await loadMore();
    }
  }, [enabled, loadMore]);

  const {
    loadMore: infiniteLoadMore,
    isLoading: infiniteLoading,
    sentinelRef,
  } = useInfiniteScroll(loadMore, {
    hasNextPage,
    isLoading,
  });

  // Initial load
  useEffect(() => {
    if (enabled && data.length === 0) {
      loadMore();
    }
  }, [enabled, data.length, loadMore]);

  return {
    data,
    isLoading: isLoading || infiniteLoading,
    error,
    hasNextPage,
    loadMore: infiniteLoadMore,
    refresh,
    sentinelRef,
  };
};

// Hook for managing scroll position
export const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      setScrollPosition(position);
      setIsAtTop(position === 0);
      setIsAtBottom(position >= maxScroll - 10); // 10px threshold
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const scrollToElement = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return {
    scrollPosition,
    isAtTop,
    isAtBottom,
    scrollToTop,
    scrollToBottom,
    scrollToElement,
  };
};

// Hook for managing scroll direction
export const useScrollDirection = (threshold: number = 100) => {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(
    null,
  );
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        return;
      }

      setScrollDirection(scrollY > lastScrollY ? "down" : "up");
      setLastScrollY(scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, threshold]);

  return scrollDirection;
};

"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageWithFallbackProps {
  src?: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  onError?: () => void;
}

export function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  className = "",
  width,
  height,
  fill = false,
  priority = false,
  onError,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(!src);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      onError?.();
    }
  };

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      onError={handleError}
    />
  );
}

// Utility function to get default avatar based on role and gender
export function getDefaultAvatar(role: string, gender?: string): string {
  const normalizedRole = role.toLowerCase();
  const normalizedGender = gender?.toLowerCase() || "male"; // Default to male if gender not specified

  // Map roles to avatar files
  const roleMap: Record<string, string> = {
    customer: "customer",
    merchant: "merchant",
    rider: "rider",
    admin: "admin",
  };

  const rolePrefix = roleMap[normalizedRole] || "customer";
  const genderSuffix = normalizedGender === "female" ? "female" : "male";

  return `/avatars/${rolePrefix}-${genderSuffix}.jpg`;
}

// Utility function to get default image for different types
export function getDefaultImage(
  type: "banner" | "ad" | "offer" | "product" | "collection",
): string {
  const imageMap: Record<string, string> = {
    banner:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9Ijk2MCIgeT0iNTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CYW5uZXIgSW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD4KPHRleHQgeD0iOTYwIiB5PSI2MDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk0QTNCMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlZmF1bHQgQmFubmVyPC90ZXh0Pgo8L3N2Zz4K",
    ad: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5BZE5vdEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+Cg==",
    offer:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5PZmZlck5vdEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+Cg==",
    product:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Db21taW5nIFNvb248L3RleHQ+Cjwvc3ZnPgo=",
    collection:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM4NCIgdmlld0JveD0iMCAwIDY0MCAzODQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iMzg0IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyMCIgeT0iMTkyIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Db2xsZWN0aW9uPC90ZXh0Pgo8dGV4dCB4PSIzMjAiIHk9IjIzMiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOTRBM0IwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm90IEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+Cg==",
  };

  return (
    imageMap[type] ||
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOZXZlciBMb2FkZWQ8L3RleHQ+Cjwvc3ZnPgo="
  );
}

// Category Service - Handles category data and slug-based routing

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  color: string;
  productCount: number;
  isActive: boolean;
  parentId?: string;
  sortOrder: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithChildren extends Category {
  children?: Category[];
}

// Static category data - in production, this would come from database
export const CATEGORIES: Category[] = [
  {
    id: "grocery",
    slug: "grocery",
    name: "Grocery",
    description: "Fresh produce, dairy, and daily essentials",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    icon: "ShoppingCart",
    color: "from-green-500 to-green-600",
    productCount: 245,
    isActive: true,
    sortOrder: 1,
    metaTitle: "Grocery Delivery - Fresh Produce & Daily Essentials | TownKart",
    metaDescription:
      "Order fresh groceries, fruits, vegetables, and daily essentials with fast delivery. Best prices guaranteed.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "food",
    slug: "food",
    name: "Food & Dining",
    description: "Restaurants, cafes, and food delivery",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop",
    icon: "UtensilsCrossed",
    color: "from-orange-500 to-red-500",
    productCount: 189,
    isActive: true,
    sortOrder: 2,
    metaTitle: "Food Delivery - Restaurants & Cafes | TownKart",
    metaDescription:
      "Order from your favorite restaurants and cafes. Fast food delivery with real-time tracking.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "medicine",
    slug: "medicine",
    name: "Medicine & Healthcare",
    description: "Pharmacy, healthcare products, and wellness",
    image:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop",
    icon: "Heart",
    color: "from-blue-500 to-blue-600",
    productCount: 67,
    isActive: true,
    sortOrder: 3,
    metaTitle: "Medicine Delivery - Pharmacy & Healthcare | TownKart",
    metaDescription:
      "Order medicines, healthcare products, and wellness items with doorstep delivery.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "fashion",
    slug: "fashion",
    name: "Fashion & Lifestyle",
    description: "Clothing, accessories, and lifestyle products",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
    icon: "Shirt",
    color: "from-purple-500 to-pink-500",
    productCount: 134,
    isActive: true,
    sortOrder: 4,
    metaTitle: "Fashion & Lifestyle - Clothing & Accessories | TownKart",
    metaDescription:
      "Shop the latest fashion trends, clothing, and lifestyle products with fast delivery.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "electronics",
    slug: "electronics",
    name: "Electronics",
    description: "Gadgets, electronics, and tech accessories",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop",
    icon: "Smartphone",
    color: "from-gray-700 to-gray-800",
    productCount: 89,
    isActive: true,
    sortOrder: 5,
    metaTitle: "Electronics - Gadgets & Tech Accessories | TownKart",
    metaDescription:
      "Shop electronics, gadgets, and tech accessories with expert reviews and fast delivery.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "household",
    slug: "household",
    name: "Household & Kitchen",
    description: "Home essentials, kitchenware, and appliances",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    icon: "Home",
    color: "from-teal-500 to-cyan-500",
    productCount: 156,
    isActive: true,
    sortOrder: 6,
    metaTitle: "Household & Kitchen - Home Essentials | TownKart",
    metaDescription:
      "Shop household items, kitchenware, and home appliances with reliable delivery.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "books",
    slug: "books",
    name: "Books & Stationery",
    description: "Books, stationery, and educational materials",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
    icon: "BookOpen",
    color: "from-indigo-500 to-purple-600",
    productCount: 78,
    isActive: true,
    sortOrder: 7,
    metaTitle: "Books & Stationery - Educational Materials | TownKart",
    metaDescription:
      "Order books, stationery, and educational materials with fast delivery.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "sports",
    slug: "sports",
    name: "Sports & Fitness",
    description: "Sports equipment, fitness gear, and accessories",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    icon: "Dumbbell",
    color: "from-red-500 to-orange-500",
    productCount: 92,
    isActive: true,
    sortOrder: 8,
    metaTitle: "Sports & Fitness - Equipment & Gear | TownKart",
    metaDescription:
      "Shop sports equipment, fitness gear, and accessories with expert recommendations.",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Get category by slug
export function getCategoryBySlug(slug: string): Category | null {
  return CATEGORIES.find((category) => category.slug === slug) || null;
}

// Get category by ID
export function getCategoryById(id: string): Category | null {
  return CATEGORIES.find((category) => category.id === id) || null;
}

// Get all active categories
export function getActiveCategories(): Category[] {
  return CATEGORIES.filter((category) => category.isActive);
}

// Get categories sorted by sort order
export function getCategoriesSorted(): Category[] {
  return [...CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
}

// Get category breadcrumbs
export function getCategoryBreadcrumbs(slug: string): Category[] {
  const category = getCategoryBySlug(slug);
  if (!category) return [];

  // For now, return just the current category
  // In future, implement parent-child relationships
  return [category];
}

// Search categories
export function searchCategories(query: string): Category[] {
  const lowercaseQuery = query.toLowerCase();
  return CATEGORIES.filter(
    (category) =>
      category.name.toLowerCase().includes(lowercaseQuery) ||
      category.description.toLowerCase().includes(lowercaseQuery) ||
      category.slug.toLowerCase().includes(lowercaseQuery),
  );
}

// Get category statistics
export function getCategoryStats(): {
  totalCategories: number;
  activeCategories: number;
  totalProducts: number;
  averageProductsPerCategory: number;
} {
  const activeCategories = getActiveCategories();
  const totalProducts = activeCategories.reduce(
    (sum, cat) => sum + cat.productCount,
    0,
  );

  return {
    totalCategories: CATEGORIES.length,
    activeCategories: activeCategories.length,
    totalProducts,
    averageProductsPerCategory:
      activeCategories.length > 0
        ? Math.round(totalProducts / activeCategories.length)
        : 0,
  };
}

// Validate category slug
export function isValidCategorySlug(slug: string): boolean {
  return CATEGORIES.some((category) => category.slug === slug);
}

// Get related categories (similar or complementary)
export function getRelatedCategories(
  slug: string,
  limit: number = 3,
): Category[] {
  const currentCategory = getCategoryBySlug(slug);
  if (!currentCategory) return [];

  // Simple logic: return categories with different colors (assuming different themes)
  return CATEGORIES.filter(
    (cat) =>
      cat.slug !== slug && cat.isActive && cat.color !== currentCategory.color,
  ).slice(0, limit);
}

// Generate category URL
export function generateCategoryUrl(slug: string): string {
  return `/categories/${slug}`;
}

// Get category SEO data
export function getCategorySEO(slug: string): {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
} | null {
  const category = getCategoryBySlug(slug);
  if (!category) return null;

  return {
    title: category.metaTitle || `${category.name} - TownKart`,
    description: category.metaDescription || category.description,
    keywords: [
      category.name.toLowerCase(),
      "delivery",
      "online shopping",
      "townkart",
      ...category.description.toLowerCase().split(" "),
    ],
    canonical: generateCategoryUrl(slug),
  };
}

// Category icons mapping (for UI components)
export const CATEGORY_ICONS = {
  ShoppingCart: "ShoppingCart",
  UtensilsCrossed: "UtensilsCrossed",
  Heart: "Heart",
  Shirt: "Shirt",
  Smartphone: "Smartphone",
  Home: "Home",
  BookOpen: "BookOpen",
  Dumbbell: "Dumbbell",
} as const;

// Get category icon component name
export function getCategoryIconName(slug: string): string {
  const category = getCategoryBySlug(slug);
  return category?.icon || "ShoppingCart";
}

// Category color schemes
export const CATEGORY_COLORS = {
  grocery: "from-green-500 to-green-600",
  food: "from-orange-500 to-red-500",
  medicine: "from-blue-500 to-blue-600",
  fashion: "from-purple-500 to-pink-500",
  electronics: "from-gray-700 to-gray-800",
  household: "from-teal-500 to-cyan-500",
  books: "from-indigo-500 to-purple-600",
  sports: "from-red-500 to-orange-500",
} as const;

// Get category color scheme
export function getCategoryColor(slug: string): string {
  const category = getCategoryBySlug(slug);
  if (category) {
    return category.color;
  }

  // Fallback based on slug
  return (
    CATEGORY_COLORS[slug as keyof typeof CATEGORY_COLORS] ||
    "from-gray-500 to-gray-600"
  );
}

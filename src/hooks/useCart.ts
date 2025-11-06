import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCartItems,
} from "@/store/slices/cartSlice";
import { RootState } from "@/store";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  shop: string;
  stock: number;
}

export const useCart = () => {
  const dispatch = useDispatch();
  const { items, total, isLoading } = useSelector(
    (state: RootState) => state.cart,
  );

  // Add item to cart (works without authentication)
  const addItem = useCallback(
    (item: CartItem) => {
      dispatch(addToCart(item));
    },
    [dispatch],
  );

  // Remove item from cart
  const removeItem = useCallback(
    (itemId: number) => {
      dispatch(removeFromCart(itemId));
    },
    [dispatch],
  );

  // Update item quantity
  const updateItemQuantity = useCallback(
    (itemId: number, quantity: number) => {
      if (quantity <= 0) {
        dispatch(removeFromCart(itemId));
      } else {
        dispatch(updateQuantity({ id: itemId, quantity }));
      }
    },
    [dispatch],
  );

  // Clear entire cart
  const clearAllItems = useCallback(() => {
    dispatch(clearCart());
  }, [dispatch]);

  // Get item count
  const getItemCount = useCallback(
    (itemId: number) => {
      const item = items.find((item) => item.id === itemId);
      return item?.quantity || 0;
    },
    [items],
  );

  // Check if item is in cart
  const isInCart = useCallback(
    (itemId: number) => {
      return items.some((item) => item.id === itemId);
    },
    [items],
  );

  // Get cart summary
  const getCartSummary = useCallback(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const deliveryFee = subtotal > 500 ? 0 : 40; // Free delivery above ₹500
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + deliveryFee + tax;

    return {
      itemCount,
      subtotal,
      deliveryFee,
      tax,
      total,
      freeDeliveryThreshold: 500,
      isFreeDelivery: subtotal >= 500,
    };
  }, [items]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("townkart_cart");
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch(setCartItems(cartItems));
      } catch (error) {
        console.error("Failed to load cart from localStorage:", error);
      }
    }
  }, [dispatch]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("townkart_cart", JSON.stringify(items));
  }, [items]);

  // Validate cart items (check stock availability)
  const validateCart = useCallback(() => {
    const invalidItems: number[] = [];

    items.forEach((item) => {
      if (item.quantity > item.stock) {
        invalidItems.push(item.id);
      }
    });

    return {
      isValid: invalidItems.length === 0,
      invalidItems,
    };
  }, [items]);

  // Get items by shop
  const getItemsByShop = useCallback(() => {
    const shopGroups: { [key: string]: CartItem[] } = {};

    items.forEach((item) => {
      if (!shopGroups[item.shop]) {
        shopGroups[item.shop] = [];
      }
      shopGroups[item.shop].push(item);
    });

    return shopGroups;
  }, [items]);

  // Check if cart has items from multiple shops
  const hasMultipleShops = useCallback(() => {
    const shops = new Set(items.map((item) => item.shop));
    return shops.size > 1;
  }, [items]);

  return {
    // State
    items,
    total,
    isLoading,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),

    // Actions
    addItem,
    removeItem,
    updateItemQuantity,
    clearAllItems,

    // Utilities
    getItemCount,
    isInCart,
    getCartSummary,
    validateCart,
    getItemsByShop,
    hasMultipleShops,
  };
};

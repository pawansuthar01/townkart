import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  setWishlistItems,
  fetchUserWishlist,
  addToWishlistServer,
  removeFromWishlistServer,
} from "@/store/slices/wishlistSlice";
import { RootState } from "@/store";
import { useAuth } from "./useAuth";

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  shop: string;
  category?: string;
  description?: string;
  addedAt: string;
}

export const useWishlist = () => {
  const dispatch = useDispatch();
  const { items, isLoading, error } = useSelector(
    (state: RootState) => state.wishlist,
  );
  const { isAuthenticated, user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);

  // Add item to wishlist (works without authentication)
  const addItem = useCallback(
    async (item: Omit<WishlistItem, "addedAt">) => {
      dispatch(addToWishlist(item as WishlistItem));
      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);

      // If user is authenticated, also sync with server
      if (isAuthenticated) {
        try {
          dispatch(addToWishlistServer(item.id) as any);
        } catch (error) {
          console.error("Failed to sync wishlist item with server:", error);
          // Don't remove from local state if server sync fails
        }
      }
    },
    [dispatch, isAuthenticated],
  );

  // Remove item from wishlist
  const removeItem = useCallback(
    async (itemId: string) => {
      dispatch(removeFromWishlist(itemId));

      // If user is authenticated, also sync with server
      if (isAuthenticated) {
        try {
          dispatch(removeFromWishlistServer(itemId) as any);
        } catch (error) {
          console.error("Failed to sync wishlist removal with server:", error);
          // Don't add back to local state if server sync fails
        }
      }
    },
    [dispatch, isAuthenticated],
  );

  // Clear entire wishlist
  const clearAllItems = useCallback(async () => {
    dispatch(clearWishlist());

    // If user is authenticated, also clear server wishlist
    if (isAuthenticated) {
      try {
        // This would need a clear wishlist API endpoint
        // For now, we'll just clear local state
        console.log("Server wishlist clearing not implemented yet");
      } catch (error) {
        console.error("Failed to clear server wishlist:", error);
      }
    }
  }, [dispatch, isAuthenticated]);

  // Check if item is in wishlist
  const isInWishlist = useCallback(
    (itemId: string) => {
      return items.some((item) => item.id === itemId);
    },
    [items],
  );

  // Toggle item in wishlist
  const toggleWishlist = useCallback(
    async (item: Omit<WishlistItem, "addedAt">) => {
      if (isInWishlist(item.id)) {
        await removeItem(item.id);
      } else {
        await addItem(item);
      }
    },
    [isInWishlist, addItem, removeItem],
  );

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem("townkart_wishlist");
    if (savedWishlist) {
      try {
        const wishlistItems = JSON.parse(savedWishlist);
        dispatch(setWishlistItems(wishlistItems));
      } catch (error) {
        console.error("Failed to load wishlist from localStorage:", error);
      }
    }
  }, [dispatch]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("townkart_wishlist", JSON.stringify(items));
  }, [items]);

  // Sync with server when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      // Load user's wishlist from server and merge with local wishlist
      dispatch(fetchUserWishlist() as any)
        .unwrap()
        .then((serverWishlist: any) => {
          // Merge server wishlist with local wishlist
          const localWishlist = JSON.parse(
            localStorage.getItem("townkart_wishlist") || "[]",
          );

          // Combine local and server wishlists, preferring server data for conflicts
          const mergedWishlist = [...serverWishlist];

          // Add any local items that aren't on server
          localWishlist.forEach((localItem: WishlistItem) => {
            if (
              !mergedWishlist.some(
                (serverItem) => serverItem.id === localItem.id,
              )
            ) {
              mergedWishlist.push(localItem);
              // Also add to server
              dispatch(addToWishlistServer(localItem.id) as any);
            }
          });

          dispatch(setWishlistItems(mergedWishlist));
        })
        .catch((error: any) => {
          console.error("Failed to sync wishlist with server:", error);
        });
    }
  }, [isAuthenticated, user, dispatch]);

  return {
    // State
    items,
    isLoading,
    error,
    isAnimating,
    itemCount: items.length,

    // Actions
    addItem,
    removeItem,
    clearAllItems,
    toggleWishlist,

    // Utilities
    isInWishlist,
  };
};

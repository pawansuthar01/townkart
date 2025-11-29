import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

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

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: WishlistState = {
  items: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks for wishlist operations
export const syncWishlistWithServer = createAsyncThunk(
  "wishlist/syncWithServer",
  async (wishlistItems: WishlistItem[]) => {
    // This would sync wishlist with server
    return wishlistItems;
  },
);

export const fetchUserWishlist = createAsyncThunk(
  "wishlist/fetchUserWishlist",
  async () => {
    const response = await fetch("/api/wishlist");
    if (!response.ok) {
      throw new Error("Failed to fetch wishlist");
    }
    return response.json();
  },
);

export const addToWishlistServer = createAsyncThunk(
  "wishlist/addToServer",
  async (productId: string) => {
    const response = await fetch("/api/wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    });
    if (!response.ok) {
      throw new Error("Failed to add to wishlist");
    }
    return response.json();
  },
);

export const removeFromWishlistServer = createAsyncThunk(
  "wishlist/removeFromServer",
  async (productId: string) => {
    const response = await fetch(`/api/wishlist/${productId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to remove from wishlist");
    }
    return response.json();
  },
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id,
      );

      if (!existingItem) {
        state.items.push({
          ...action.payload,
          addedAt: new Date().toISOString(),
        });
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      }
    },

    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },

    clearWishlist: (state) => {
      state.items = [];
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },

    setWishlistItems: (state, action: PayloadAction<WishlistItem[]>) => {
      state.items = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Sync with server
    builder
      .addCase(syncWishlistWithServer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncWishlistWithServer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(syncWishlistWithServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to sync wishlist";
      });

    // Fetch user wishlist
    builder
      .addCase(fetchUserWishlist.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchUserWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch wishlist";
      });

    // Add to wishlist server
    builder
      .addCase(addToWishlistServer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToWishlistServer.fulfilled, (state) => {
        state.isLoading = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(addToWishlistServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to add to wishlist";
      });

    // Remove from wishlist server
    builder
      .addCase(removeFromWishlistServer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromWishlistServer.fulfilled, (state) => {
        state.isLoading = false;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(removeFromWishlistServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to remove from wishlist";
      });
  },
});

// Selectors
export const selectWishlistItems = (state: { wishlist: WishlistState }) =>
  state.wishlist.items;
export const selectWishlistItemCount = (state: { wishlist: WishlistState }) =>
  state.wishlist.items.length;
export const selectIsInWishlist =
  (itemId: string) => (state: { wishlist: WishlistState }) =>
    state.wishlist.items.some((item) => item.id === itemId);

export const {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  setWishlistItems,
  setLoading,
  setError,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  shop: string;
  stock: number;
  category?: string;
  description?: string;
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  freeDeliveryThreshold: number;
  isFreeDelivery: boolean;
}

interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: CartState = {
  items: [],
  total: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks for cart operations (if needed for server sync)
export const syncCartWithServer = createAsyncThunk(
  "cart/syncWithServer",
  async (cartItems: CartItem[]) => {
    // This would sync cart with server
    return cartItems;
  },
);

export const validateCartItems = createAsyncThunk(
  "cart/validateItems",
  async (cartItems: CartItem[]) => {
    // This would validate cart items with server (stock, availability, etc.)
    return cartItems;
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id,
      );

      if (existingItem) {
        // Check stock limit
        if (existingItem.quantity >= existingItem.stock) {
          state.error = "Maximum stock limit reached";
          return;
        }
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }

      state.total = calculateTotal(state.items);
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },

    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      state.total = calculateTotal(state.items);
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ id: number; quantity: number }>,
    ) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((item) => item.id === id);

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((item) => item.id !== id);
        } else if (quantity > item.stock) {
          state.error = "Quantity exceeds available stock";
          return;
        } else {
          item.quantity = quantity;
        }

        state.total = calculateTotal(state.items);
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      }
    },

    incrementQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find((item) => item.id === action.payload);

      if (item) {
        if (item.quantity >= item.stock) {
          state.error = "Maximum stock limit reached";
          return;
        }
        item.quantity += 1;
        state.total = calculateTotal(state.items);
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      }
    },

    decrementQuantity: (state, action: PayloadAction<number>) => {
      const item = state.items.find((item) => item.id === action.payload);

      if (item) {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          state.items = state.items.filter(
            (item) => item.id !== action.payload,
          );
        }

        state.total = calculateTotal(state.items);
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },

    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.total = calculateTotal(state.items);
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    },

    updateCartItem: (
      state,
      action: PayloadAction<{ id: number; updates: Partial<CartItem> }>,
    ) => {
      const { id, updates } = action.payload;
      const item = state.items.find((item) => item.id === id);

      if (item) {
        Object.assign(item, updates);
        state.total = calculateTotal(state.items);
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      }
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setTotal: (state, action: PayloadAction<number>) => {
      state.total = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Sync with server
    builder
      .addCase(syncCartWithServer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncCartWithServer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.total = calculateTotal(state.items);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(syncCartWithServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to sync cart";
      });

    // Validate cart items
    builder
      .addCase(validateCartItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(validateCartItems.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update items with validated data
        state.items = action.payload;
        state.total = calculateTotal(state.items);
      })
      .addCase(validateCartItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to validate cart items";
      });
  },
});

// Helper function to calculate total
const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.total;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartSummary = (state: { cart: CartState }): CartSummary => {
  const items = state.cart.items;
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  const deliveryFee = subtotal > 500 ? 0 : 40; // Free delivery above ₹500
  const tax = subtotal * 0.05; // 5% tax
  const discount = 0; // Could be calculated based on coupons
  const total = subtotal + deliveryFee + tax - discount;

  return {
    itemCount,
    subtotal,
    deliveryFee,
    tax,
    discount,
    total,
    freeDeliveryThreshold: 500,
    isFreeDelivery: subtotal >= 500,
  };
};

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  clearCart,
  setCartItems,
  updateCartItem,
  setLoading,
  setError,
  setTotal,
} = cartSlice.actions;

export default cartSlice.reducer;

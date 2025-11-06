import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface OrderItem {
  id: string;
  productId: string;
  productSnapshot: any;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  merchantId: string;
  totalAmount: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  deliveryAddress: any;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  orderItems: OrderItem[];
  delivery?: any;
  payment?: any;
  review?: any;
}

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    status?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    merchantId?: string;
  };
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (params: { page?: number; limit?: number; filters?: any } = {}) => {
    // This would be handled by the service layer
    return {} as any;
  },
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchOrderById",
  async (orderId: string) => {
    // This would be handled by the service layer
    return {} as any;
  },
);

export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData: any) => {
    // This would be handled by the service layer
    return {} as any;
  },
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async ({
    orderId,
    status,
    additionalData,
  }: {
    orderId: string;
    status: string;
    additionalData?: any;
  }) => {
    // This would be handled by the service layer
    return { orderId, status, additionalData };
  },
);

export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async ({ orderId, reason }: { orderId: string; reason?: string }) => {
    // This would be handled by the service layer
    return { orderId, reason };
  },
);

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
    },
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
    },
    updateOrder: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Order> }>,
    ) => {
      const { id, updates } = action.payload;
      const orderIndex = state.orders.findIndex((order) => order.id === id);
      if (orderIndex !== -1) {
        state.orders[orderIndex] = { ...state.orders[orderIndex], ...updates };
      }
      if (state.currentOrder?.id === id) {
        state.currentOrder = { ...state.currentOrder, ...updates };
      }
    },
    removeOrder: (state, action: PayloadAction<string>) => {
      state.orders = state.orders.filter(
        (order) => order.id !== action.payload,
      );
    },
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPagination: (
      state,
      action: PayloadAction<Partial<OrdersState["pagination"]>>,
    ) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setFilters: (
      state,
      action: PayloadAction<Partial<OrdersState["filters"]>>,
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    resetOrders: (state) => {
      state.orders = [];
      state.currentOrder = null;
      state.pagination = initialState.pagination;
      state.filters = {};
    },
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch orders";
      });

    // Fetch order by ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch order";
      });

    // Create order
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders.unshift(action.payload);
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to create order";
      });

    // Update order status
    builder
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const { orderId, status, additionalData } = action.payload;
        const orderIndex = state.orders.findIndex(
          (order) => order.id === orderId,
        );
        if (orderIndex !== -1) {
          state.orders[orderIndex] = {
            ...state.orders[orderIndex],
            orderStatus: status,
            ...additionalData,
            updatedAt: new Date().toISOString(),
          };
        }
        if (state.currentOrder?.id === orderId) {
          state.currentOrder = {
            ...state.currentOrder,
            orderStatus: status,
            ...additionalData,
            updatedAt: new Date().toISOString(),
          };
        }
        state.isLoading = false;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to update order status";
      });

    // Cancel order
    builder
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const { orderId } = action.payload;
        const orderIndex = state.orders.findIndex(
          (order) => order.id === orderId,
        );
        if (orderIndex !== -1) {
          state.orders[orderIndex] = {
            ...state.orders[orderIndex],
            orderStatus: "CANCELLED",
            updatedAt: new Date().toISOString(),
          };
        }
        if (state.currentOrder?.id === orderId) {
          state.currentOrder = {
            ...state.currentOrder,
            orderStatus: "CANCELLED",
            updatedAt: new Date().toISOString(),
          };
        }
        state.isLoading = false;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to cancel order";
      });
  },
});

export const {
  setOrders,
  addOrder,
  updateOrder,
  removeOrder,
  setCurrentOrder,
  setLoading,
  setError,
  setPagination,
  setFilters,
  clearFilters,
  resetOrders,
} = orderSlice.actions;

export default orderSlice.reducer;

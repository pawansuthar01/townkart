import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeDeliveries: number;
  totalProducts: number;
  recentOrders: any[];
  topProducts: any[];
}

interface AdminState {
  stats: {
    totalOrders: number;
    totalRevenue: number;
    activeDeliveries: number;
    totalProducts: number;
  } | null;
  recentOrders: any[];
  topProducts: any[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  stats: null,
  recentOrders: [],
  topProducts: [],
  loading: false,
  error: null,
};

// Async thunk for fetching admin dashboard stats
export const fetchAdminStats = createAsyncThunk(
  "admin/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/admin/dashboard?type=stats");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch stats");
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch stats");
      }

      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for fetching recent orders
export const fetchRecentOrders = createAsyncThunk(
  "admin/fetchRecentOrders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/admin/dashboard?type=recent-orders");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch recent orders");
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch recent orders");
      }

      return data.data.recentOrders;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for fetching top products
export const fetchTopProducts = createAsyncThunk(
  "admin/fetchTopProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/admin/dashboard?type=top-products");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch top products");
      }

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch top products");
      }

      return data.data.topProducts;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearData: (state) => {
      state.stats = null;
      state.recentOrders = [];
      state.topProducts = [];
    },
  },
  extraReducers: (builder) => {
    // Stats
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Recent Orders
    builder
      .addCase(fetchRecentOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecentOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.recentOrders = action.payload;
      })
      .addCase(fetchRecentOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Top Products
    builder
      .addCase(fetchTopProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.topProducts = action.payload;
      })
      .addCase(fetchTopProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearData } = adminSlice.actions;
export default adminSlice.reducer;

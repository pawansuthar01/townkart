import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Stat {
  icon: string;
  number: number;
  label: string;
}

interface StatsState {
  stats: Stat[];
  loading: boolean;
  error: string | null;
}

const initialState: StatsState = {
  stats: [],
  loading: false,
  error: null,
};

// Async thunk for fetching stats
export const fetchStats = createAsyncThunk(
  "stats/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/stats");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch stats");
      }

      return data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for seeding stats
export const seedStats = createAsyncThunk(
  "stats/seedStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/seed", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to seed database");
      }
      // Wait a moment for seeding to complete, then fetch stats
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const fetchResponse = await fetch("/api/stats");
      const data = await fetchResponse.json();
      return data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const statsSlice = createSlice({
  name: "stats",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, action: PayloadAction<Stat[]>) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(seedStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(seedStats.fulfilled, (state, action: PayloadAction<Stat[]>) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(seedStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = statsSlice.actions;
export default statsSlice.reducer;

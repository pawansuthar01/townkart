import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Advertisement {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdState {
  ads: Advertisement[];
  loading: boolean;
  error: string | null;
}

const initialState: AdState = {
  ads: [],
  loading: false,
  error: null,
};

// Async thunk for fetching advertisements
export const fetchAds = createAsyncThunk(
  "ad/fetchAds",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/ads");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch advertisements");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const adSlice = createSlice({
  name: "ad",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAds.fulfilled,
        (state, action: PayloadAction<Advertisement[]>) => {
          state.loading = false;
          state.ads = action.payload;
        },
      )
      .addCase(fetchAds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = adSlice.actions;
export default adSlice.reducer;

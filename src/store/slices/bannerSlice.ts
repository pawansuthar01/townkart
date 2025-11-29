import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface BannerState {
  banners: Banner[];
  loading: boolean;
  error: string | null;
}

const initialState: BannerState = {
  banners: [],
  loading: false,
  error: null,
};

// Async thunk for fetching banners
export const fetchBanners = createAsyncThunk(
  "banner/fetchBanners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/banners");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch banners");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const bannerSlice = createSlice({
  name: "banner",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBanners.fulfilled,
        (state, action: PayloadAction<Banner[]>) => {
          state.loading = false;
          state.banners = action.payload;
        },
      )
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = bannerSlice.actions;
export default bannerSlice.reducer;

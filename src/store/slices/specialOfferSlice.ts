import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface SpecialOffer {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  discountType: string;
  discountValue: number;
  originalPrice?: number;
  offerPrice?: number;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface SpecialOfferState {
  offers: SpecialOffer[];
  loading: boolean;
  error: string | null;
}

const initialState: SpecialOfferState = {
  offers: [],
  loading: false,
  error: null,
};

// Async thunk for fetching special offers
export const fetchSpecialOffers = createAsyncThunk(
  "specialOffer/fetchSpecialOffers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/special-offers");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch special offers");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const specialOfferSlice = createSlice({
  name: "specialOffer",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpecialOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSpecialOffers.fulfilled,
        (state, action: PayloadAction<SpecialOffer[]>) => {
          state.loading = false;
          state.offers = action.payload;
        },
      )
      .addCase(fetchSpecialOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = specialOfferSlice.actions;
export default specialOfferSlice.reducer;

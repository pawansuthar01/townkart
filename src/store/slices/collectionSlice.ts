import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  products: any[];
  type: string;
  filters?: any;
  image?: string;
  bannerImage?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  targetUsers: string;
  userSegments?: any;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  itemCount?: number;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface CollectionState {
  collections: Collection[];
  loading: boolean;
  error: string | null;
}

const initialState: CollectionState = {
  collections: [],
  loading: false,
  error: null,
};

// Async thunk for fetching collections
export const fetchCollections = createAsyncThunk(
  "collection/fetchCollections",
  async (params: { type?: string } = {}, { rejectWithValue }) => {
    try {
      const { type } = params;
      const url = type ? `/api/collections?type=${type}` : "/api/collections";
      const response = await fetch(url);
      const data = await response.json();
      console.log(data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch collections");
      }

      return data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for seeding collections
export const seedCollections = createAsyncThunk(
  "collection/seedCollections",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/seed", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to seed database");
      }
      // Wait a moment for seeding to complete, then fetch collections
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const fetchResponse = await fetch("/api/collections?type=featured");
      const data = await fetchResponse.json();
      return data.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const collectionSlice = createSlice({
  name: "collection",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCollections.fulfilled,
        (state, action: PayloadAction<Collection[]>) => {
          state.loading = false;
          state.collections = action.payload;
        },
      )
      .addCase(fetchCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(seedCollections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        seedCollections.fulfilled,
        (state, action: PayloadAction<Collection[]>) => {
          state.loading = false;
          state.collections = action.payload;
        },
      )
      .addCase(seedCollections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = collectionSlice.actions;
export default collectionSlice.reducer;

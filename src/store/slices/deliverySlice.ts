import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Delivery {
  id: string;
  orderId: string;
  riderId: string;
  pickupTime?: string;
  deliveryTime?: string;
  pickupOtp: string;
  deliveryOtp: string;
  deliveryStatus: string;
  proofPhotoUrl?: string;
  distanceKm: number;
  deliveryFee: number;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    deliveryAddress: object;
    totalAmount: number;
    customer: {
      id: string;
      fullName: string;
      phoneNumber: string;
    };
    store: {
      id: string;
      businessName: string;
      address: string;
      latitude: number;
      longitude: number;
    };
    orderItems: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      product: {
        id: string;
        productName: string;
        images: string[];
      };
    }>;
  };
  rider?: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
}

interface DeliveryState {
  deliveries: Delivery[];
  currentDelivery: Delivery | null;
  loading: boolean;
  error: string | null;
}

const initialState: DeliveryState = {
  deliveries: [],
  currentDelivery: null,
  loading: false,
  error: null,
};

// Fetch deliveries for a rider
export const fetchDeliveries = createAsyncThunk(
  "delivery/fetchDeliveries",
  async (riderId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/deliveries?riderId=${riderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch deliveries");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch available deliveries
export const fetchAvailableDeliveries = createAsyncThunk(
  "delivery/fetchAvailableDeliveries",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/deliveries/available");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch available deliveries");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Accept a delivery
export const acceptDelivery = createAsyncThunk(
  "delivery/acceptDelivery",
  async (deliveryId: string, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/deliveries/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deliveryId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept delivery");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Update delivery status
export const updateDeliveryStatus = createAsyncThunk(
  "delivery/updateDeliveryStatus",
  async (
    {
      deliveryId,
      status,
      proofPhotoUrl,
    }: {
      deliveryId: string;
      status: string;
      proofPhotoUrl?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deliveryStatus: status, proofPhotoUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update delivery status");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Fetch single delivery details
export const fetchDeliveryDetails = createAsyncThunk(
  "delivery/fetchDeliveryDetails",
  async (deliveryId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch delivery details");
      }

      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const deliverySlice = createSlice({
  name: "delivery",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentDelivery: (state) => {
      state.currentDelivery = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDeliveries.fulfilled,
        (state, action: PayloadAction<Delivery[]>) => {
          state.loading = false;
          state.deliveries = action.payload;
        }
      )
      .addCase(fetchDeliveries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAvailableDeliveries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAvailableDeliveries.fulfilled,
        (state, action: PayloadAction<Delivery[]>) => {
          state.loading = false;
          state.deliveries = action.payload;
        }
      )
      .addCase(fetchAvailableDeliveries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(acceptDelivery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        acceptDelivery.fulfilled,
        (state, action: PayloadAction<Delivery>) => {
          state.loading = false;
          // Update the delivery in the list
          const index = state.deliveries.findIndex(
            (d) => d.id === action.payload.id
          );
          if (index !== -1) {
            state.deliveries[index] = action.payload;
          }
        }
      )
      .addCase(acceptDelivery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDeliveryStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateDeliveryStatus.fulfilled,
        (state, action: PayloadAction<Delivery>) => {
          state.loading = false;
          // Update the delivery in the list
          const index = state.deliveries.findIndex(
            (d) => d.id === action.payload.id
          );
          if (index !== -1) {
            state.deliveries[index] = action.payload;
          }
          // Update current delivery if it's the same
          if (state.currentDelivery?.id === action.payload.id) {
            state.currentDelivery = action.payload;
          }
        }
      )
      .addCase(updateDeliveryStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDeliveryDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDeliveryDetails.fulfilled,
        (state, action: PayloadAction<Delivery>) => {
          state.loading = false;
          state.currentDelivery = action.payload;
        }
      )
      .addCase(fetchDeliveryDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentDelivery } = deliverySlice.actions;
export default deliverySlice.reducer;

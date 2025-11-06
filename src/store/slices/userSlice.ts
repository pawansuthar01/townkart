import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface UserProfile {
  id: string;
  phoneNumber: string;
  fullName: string | null;
  email: string | null;
  userRoles: string[];
  activeRole: string;
  profileImageUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Address {
  id: string;
  userId: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  addressType: "HOME" | "WORK" | "OTHER";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  favoriteCategory: string;
  averageRating: number;
  joinDate: string;
}

interface UserState {
  profile: UserProfile | null;
  addresses: Address[];
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  preferences: Record<string, any>;
}

const initialState: UserState = {
  profile: null,
  addresses: [],
  stats: null,
  isLoading: false,
  error: null,
  preferences: {},
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  "user/fetchProfile",
  async () => {
    // This would be handled by the service layer
    return {} as UserProfile;
  },
);

export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (profileData: Partial<UserProfile>) => {
    // This would be handled by the service layer
    return profileData;
  },
);

export const fetchUserAddresses = createAsyncThunk(
  "user/fetchAddresses",
  async () => {
    // This would be handled by the service layer
    return [] as Address[];
  },
);

export const addUserAddress = createAsyncThunk(
  "user/addAddress",
  async (
    addressData: Omit<Address, "id" | "userId" | "createdAt" | "updatedAt">,
  ) => {
    // This would be handled by the service layer
    return addressData;
  },
);

export const updateUserAddress = createAsyncThunk(
  "user/updateAddress",
  async ({
    addressId,
    addressData,
  }: {
    addressId: string;
    addressData: Partial<Address>;
  }) => {
    // This would be handled by the service layer
    return { addressId, addressData };
  },
);

export const deleteUserAddress = createAsyncThunk(
  "user/deleteAddress",
  async (addressId: string) => {
    // This would be handled by the service layer
    return addressId;
  },
);

export const fetchUserStats = createAsyncThunk("user/fetchStats", async () => {
  // This would be handled by the service layer
  return {} as UserStats;
});

export const updateUserPreferences = createAsyncThunk(
  "user/updatePreferences",
  async (preferences: Record<string, any>) => {
    // This would be handled by the service layer
    return preferences;
  },
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    setAddresses: (state, action: PayloadAction<Address[]>) => {
      state.addresses = action.payload;
    },
    addAddress: (state, action: PayloadAction<Address>) => {
      state.addresses.push(action.payload);
    },
    updateAddress: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Address> }>,
    ) => {
      const { id, updates } = action.payload;
      const addressIndex = state.addresses.findIndex(
        (address) => address.id === id,
      );
      if (addressIndex !== -1) {
        state.addresses[addressIndex] = {
          ...state.addresses[addressIndex],
          ...updates,
        };
      }
    },
    removeAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter(
        (address) => address.id !== action.payload,
      );
    },
    setStats: (state, action: PayloadAction<UserStats>) => {
      state.stats = action.payload;
    },
    setPreferences: (state, action: PayloadAction<Record<string, any>>) => {
      state.preferences = action.payload;
    },
    updatePreferences: (state, action: PayloadAction<Record<string, any>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearUserData: (state) => {
      state.profile = null;
      state.addresses = [];
      state.stats = null;
      state.preferences = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch profile";
      });

    // Update profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile = { ...state.profile, ...action.payload };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to update profile";
      });

    // Fetch addresses
    builder
      .addCase(fetchUserAddresses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch addresses";
      });

    // Add address
    builder
      .addCase(addUserAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addUserAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        // The address would be added with an ID from the API
        // For now, we'll assume it's handled by the service
      })
      .addCase(addUserAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to add address";
      });

    // Update address
    builder
      .addCase(updateUserAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        const { addressId, addressData } = action.payload;
        const addressIndex = state.addresses.findIndex(
          (address) => address.id === addressId,
        );
        if (addressIndex !== -1) {
          state.addresses[addressIndex] = {
            ...state.addresses[addressIndex],
            ...addressData,
          };
        }
      })
      .addCase(updateUserAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to update address";
      });

    // Delete address
    builder
      .addCase(deleteUserAddress.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUserAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        // The address would be removed by the service
      })
      .addCase(deleteUserAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to delete address";
      });

    // Fetch stats
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch stats";
      });

    // Update preferences
    builder
      .addCase(updateUserPreferences.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.isLoading = false;
        state.preferences = { ...state.preferences, ...action.payload };
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to update preferences";
      });
  },
});

export const {
  setProfile,
  updateProfile,
  setAddresses,
  addAddress,
  updateAddress,
  removeAddress,
  setStats,
  setPreferences,
  updatePreferences,
  setLoading,
  setError,
  clearUserData,
} = userSlice.actions;

export default userSlice.reducer;

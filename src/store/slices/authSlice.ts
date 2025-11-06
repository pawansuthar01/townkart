import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/api-client'
import { AuthResponse, User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  activeRole: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  activeRole: null,
}

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { phoneNumber: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/verify-otp', credentials)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: { phoneNumber: string; fullName: string; email?: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/register', userData)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  }
)

export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as any
      const refreshToken = state.auth.refreshToken

      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await apiClient.post('/auth/refresh-token', { refreshToken })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Token refresh failed')
    }
  }
)

export const switchUserRole = createAsyncThunk(
  'auth/switchRole',
  async (role: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/users/switch-role', { role })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Role switch failed')
    }
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error: any) {
      // Logout should succeed even if API call fails
      console.warn('Logout API call failed:', error)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
      state.activeRole = action.payload.user.activeRole
      state.error = null
    },
    clearAuthData: (state) => {
      state.user = null
      state.token = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.activeRole = null
      state.error = null
    },
    setActiveRole: (state, action: PayloadAction<string>) => {
      state.activeRole = action.payload
      if (state.user) {
        state.user.activeRole = action.payload as any
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.activeRole = action.payload.user.activeRole
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Refresh token
    builder
      .addCase(refreshAuthToken.pending, (state) => {
        state.isLoading = true
      })
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.isLoading = false
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.error = null
      })
      .addCase(refreshAuthToken.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        // Clear auth data on refresh failure
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.activeRole = null
      })

    // Switch role
    builder
      .addCase(switchUserRole.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(switchUserRole.fulfilled, (state, action) => {
        state.isLoading = false
        state.activeRole = action.payload.activeRole
        if (state.user) {
          state.user.activeRole = action.payload.activeRole
        }
        state.error = null
      })
      .addCase(switchUserRole.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.activeRole = null
        state.error = null
      })
  },
})

export const { setAuthData, clearAuthData, setActiveRole, setLoading, setError } = authSlice.actions

export default authSlice.reducer
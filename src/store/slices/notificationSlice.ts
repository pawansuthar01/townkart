import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  referenceId?: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  orderUpdates: boolean;
  deliveryUpdates: boolean;
  promotional: boolean;
  marketing: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  settings: {
    email: true,
    sms: true,
    push: true,
    orderUpdates: true,
    deliveryUpdates: true,
    promotional: false,
    marketing: false,
  },
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (
    params: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ) => {
    // This would be handled by the service layer
    return {} as any;
  },
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId: string) => {
    // This would be handled by the service layer
    return notificationId;
  },
);

export const markAllAsRead = createAsyncThunk(
  "notifications/markAllAsRead",
  async () => {
    // This would be handled by the service layer
    return true;
  },
);

export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId: string) => {
    // This would be handled by the service layer
    return notificationId;
  },
);

export const fetchNotificationSettings = createAsyncThunk(
  "notifications/fetchSettings",
  async () => {
    // This would be handled by the service layer
    return {} as NotificationSettings;
  },
);

export const updateNotificationSettings = createAsyncThunk(
  "notifications/updateSettings",
  async (settings: Partial<NotificationSettings>) => {
    // This would be handled by the service layer
    return settings;
  },
);

export const sendNotification = createAsyncThunk(
  "notifications/sendNotification",
  async (notificationData: {
    userId: string;
    title: string;
    message: string;
    type: string;
    referenceId?: string;
    priority?: "low" | "medium" | "high";
  }) => {
    // This would be handled by the service layer
    return notificationData;
  },
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    updateNotification: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Notification> }>,
    ) => {
      const { id, updates } = action.payload;
      const notificationIndex = state.notifications.findIndex(
        (notification) => notification.id === id,
      );
      if (notificationIndex !== -1) {
        const wasRead = state.notifications[notificationIndex].isRead;
        state.notifications[notificationIndex] = {
          ...state.notifications[notificationIndex],
          ...updates,
        };

        // Update unread count if read status changed
        if (!wasRead && updates.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else if (wasRead && updates.isRead === false) {
          state.unreadCount += 1;
        }
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload,
      );
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload,
      );
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    setSettings: (state, action: PayloadAction<NotificationSettings>) => {
      state.settings = action.payload;
    },
    updateSettings: (
      state,
      action: PayloadAction<Partial<NotificationSettings>>,
    ) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setPagination: (
      state,
      action: PayloadAction<Partial<NotificationsState["pagination"]>>,
    ) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
        state.unreadCount =
          action.payload.unreadCount ||
          state.notifications.filter((n) => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch notifications";
      });

    // Mark as read
    builder
      .addCase(markAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        const notificationId = action.payload;
        const notificationIndex = state.notifications.findIndex(
          (notification) => notification.id === notificationId,
        );
        if (
          notificationIndex !== -1 &&
          !state.notifications[notificationIndex].isRead
        ) {
          state.notifications[notificationIndex].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message || "Failed to mark notification as read";
      });

    // Mark all as read
    builder
      .addCase(markAllAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.isLoading = false;
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
        }));
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message || "Failed to mark all notifications as read";
      });

    // Delete notification
    builder
      .addCase(deleteNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        const notificationId = action.payload;
        const notification = state.notifications.find(
          (n) => n.id === notificationId,
        );
        if (notification && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(
          (notification) => notification.id !== notificationId,
        );
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to delete notification";
      });

    // Fetch settings
    builder
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message || "Failed to fetch notification settings";
      });

    // Update settings
    builder
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message || "Failed to update notification settings";
      });

    // Send notification
    builder
      .addCase(sendNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        // The notification would be added to the list if it's for the current user
        // This would typically be handled by WebSocket or polling
      })
      .addCase(sendNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to send notification";
      });
  },
});

export const {
  setNotifications,
  addNotification,
  updateNotification,
  removeNotification,
  setUnreadCount,
  setSettings,
  updateSettings,
  setLoading,
  setError,
  setPagination,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;

import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";

// Import slices
import authReducer from "./slices/authSlice";
import cartReducer from "./slices/cartSlice";
import orderReducer from "./slices/orderSlice";
import userReducer from "./slices/userSlice";
import notificationReducer from "./slices/notificationSlice";
import bannerReducer from "./slices/bannerSlice";
import adReducer from "./slices/adSlice";
import specialOfferReducer from "./slices/specialOfferSlice";
import statsReducer from "./slices/statsSlice";
import collectionReducer from "./slices/collectionSlice";
import wishlistReducer from "./slices/wishlistSlice";
import deliveryReducer from "./slices/deliverySlice";
import adminReducer from "./slices/adminSlice";

// Persist configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "cart", "user", "wishlist"], // Only persist these slices
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  orders: orderReducer,
  user: userReducer,
  notifications: notificationReducer,
  banners: bannerReducer,
  ads: adReducer,
  specialOffers: specialOfferReducer,
  stats: statsReducer,
  collections: collectionReducer,
  wishlist: wishlistReducer,
  delivery: deliveryReducer,
  admin: adminReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store and persistor
export default store;

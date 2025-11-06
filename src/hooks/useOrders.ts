import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { OrderService } from "@/services/order.service";
import {
  setOrders,
  addOrder,
  updateOrder,
  setLoading,
  setError,
} from "@/store/slices/orderSlice";
import { RootState } from "@/store";

export const useOrders = () => {
  const dispatch = useDispatch();
  const { orders, currentOrder, isLoading, error } = useSelector(
    (state: RootState) => state.orders,
  );

  // Fetch user orders
  const fetchOrders = useCallback(
    async (filters?: any) => {
      try {
        dispatch(setLoading(true));
        const response = await OrderService.getOrders(filters);
        dispatch(setOrders(response.data || response));
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Failed to fetch orders";
        dispatch(setError(message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  // Create new order
  const createOrder = useCallback(
    async (orderData: any) => {
      try {
        dispatch(setLoading(true));
        const response = await OrderService.createOrder(orderData);
        dispatch(addOrder(response));
        return { success: true, order: response };
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Failed to create order";
        dispatch(setError(message));
        return { success: false, message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  // Get order by ID
  const getOrderById = useCallback(async (orderId: string) => {
    try {
      dispatch(setLoading(true));
      const response = await OrderService.getOrderById(orderId);
      return { success: true, order: response };
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to get order";
      return { success: false, message };
    } finally {
      dispatch(setLoading(false));
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId: string, status: string, additionalData?: any) => {
      try {
        dispatch(setLoading(true));
        const response = await OrderService.updateOrderStatus(
          orderId,
          status,
          additionalData,
        );
        dispatch(updateOrder({ id: orderId, updates: response }));
        return { success: true, order: response };
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Failed to update order status";
        dispatch(setError(message));
        return { success: false, message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  // Cancel order
  const cancelOrder = useCallback(
    async (orderId: string, reason?: string) => {
      try {
        dispatch(setLoading(true));
        const response = await OrderService.cancelOrder(orderId, reason);
        dispatch(updateOrder({ id: orderId, updates: response }));
        return { success: true, order: response };
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Failed to cancel order";
        dispatch(setError(message));
        return { success: false, message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  // Get active orders
  const getActiveOrders = useCallback(async () => {
    try {
      const response = await OrderService.getActiveOrders();
      return { success: true, orders: response };
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to get active orders";
      return { success: false, message };
    }
  }, []);

  // Get order tracking
  const getOrderTracking = useCallback(async (orderId: string) => {
    try {
      const response = await OrderService.getOrderTracking(orderId);
      return { success: true, tracking: response };
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to get order tracking";
      return { success: false, message };
    }
  }, []);

  // Reorder
  const reorder = useCallback(
    async (orderId: string) => {
      try {
        dispatch(setLoading(true));
        const response = await OrderService.reorder(orderId);
        dispatch(addOrder(response));
        return { success: true, order: response };
      } catch (error: any) {
        const message = error.response?.data?.message || "Failed to reorder";
        dispatch(setError(message));
        return { success: false, message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch],
  );

  // Get order statistics
  const getOrderStats = useCallback(async () => {
    try {
      const response = await OrderService.getOrderStats();
      return { success: true, stats: response };
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to get order stats";
      return { success: false, message };
    }
  }, []);

  // Get orders by status
  const getOrdersByStatus = useCallback(
    (status: string) => {
      return orders.filter((order) => order.orderStatus === status);
    },
    [orders],
  );

  // Get recent orders
  const getRecentOrders = useCallback(
    (limit: number = 5) => {
      return orders
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, limit);
    },
    [orders],
  );

  // Get order by number
  const getOrderByNumber = useCallback(
    (orderNumber: string) => {
      return orders.find((order) => order.orderNumber === orderNumber);
    },
    [orders],
  );

  // Calculate order totals
  const calculateOrderTotal = useCallback((order: any) => {
    const subtotal = order.totalAmount || 0;
    const deliveryFee = order.deliveryFee || 0;
    const tax = order.taxAmount || 0;
    const discount = order.discountAmount || 0;

    return {
      subtotal,
      deliveryFee,
      tax,
      discount,
      total: subtotal + deliveryFee + tax - discount,
    };
  }, []);

  return {
    // State
    orders,
    currentOrder,
    isLoading,
    error,

    // Actions
    fetchOrders,
    createOrder,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    getActiveOrders,
    getOrderTracking,
    reorder,
    getOrderStats,

    // Utilities
    getOrdersByStatus,
    getRecentOrders,
    getOrderByNumber,
    calculateOrderTotal,
  };
};

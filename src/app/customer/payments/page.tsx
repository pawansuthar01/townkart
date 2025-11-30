"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  CreditCard,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
} from "lucide-react";

interface WalletData {
  id: string;
  currentBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  lastUpdatedAt: string;
}

interface Transaction {
  id: string;
  amount: number;
  transactionType: "CREDIT" | "DEBIT";
  description: string;
  balanceAfter: number;
  createdAt: string;
  orderId?: string;
}

interface CustomerStats {
  totalShopping: number;
  totalOrders: number;
}

export default function CustomerPaymentsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Fetch customer stats
  const fetchCustomerStats = async () => {
    try {
      const response = await fetch(
        `/api/orders?customerId=${user?.id}&limit=1000`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.orders) {
          const totalShopping = data.orders.reduce(
            (sum: number, order: any) => sum + order.finalAmount,
            0
          );
          setCustomerStats({
            totalShopping,
            totalOrders: data.orders.length,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching customer stats:", error);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/wallet/transactions?limit=20");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchCustomerStats(), fetchTransactions()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTransactionIcon = (type: string) => {
    return type === "CREDIT" ? (
      <ArrowDownLeft className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-red-600" />
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">Please login to access your wallet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-townkart-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Payment History
              </h1>
              <p className="text-gray-600 mt-1">
                View your shopping history and total spent
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Total Shopping Amount Card */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-townkart-primary to-townkart-secondary text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-8 w-8" />
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    Total Spent
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-white/80 text-sm">Total Shopping Amount</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(customerStats?.totalShopping || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Shopping Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Shopping Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Total Orders</span>
                  </div>
                  <span className="font-semibold text-blue-600">
                    {customerStats?.totalOrders || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">
                      Average Order Value
                    </span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {customerStats?.totalOrders
                      ? formatCurrency(
                          (customerStats.totalShopping || 0) /
                            customerStats.totalOrders
                        )
                      : formatCurrency(0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No transactions yet
                    </h3>
                    <p className="text-gray-600">
                      Your transaction history will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            {getTransactionIcon(transaction.transactionType)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.description}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${
                              transaction.transactionType === "CREDIT"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.transactionType === "CREDIT"
                              ? "+"
                              : "-"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                          <p className="text-xs text-gray-500">
                            Balance: {formatCurrency(transaction.balanceAfter)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

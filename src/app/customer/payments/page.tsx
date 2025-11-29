"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function CustomerPaymentsPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMoney, setIsAddingMoney] = useState(false);
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false);

  // Add money form
  const [addMoneyAmount, setAddMoneyAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      const response = await fetch("/api/wallet/balance");
      if (response.ok) {
        const data = await response.json();
        setWallet(data.wallet);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
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
      Promise.all([fetchWalletData(), fetchTransactions()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user]);

  // Handle add money
  const handleAddMoney = async () => {
    if (!addMoneyAmount || !paymentMethod) return;

    setIsAddingMoney(true);
    try {
      // This would integrate with payment gateway
      // For now, just show success message
      alert(
        `Adding ₹${addMoneyAmount} via ${paymentMethod} would be processed here`,
      );
      setShowAddMoneyDialog(false);
      setAddMoneyAmount("");
      setPaymentMethod("");
    } catch (error) {
      console.error("Error adding money:", error);
      alert("Failed to add money");
    } finally {
      setIsAddingMoney(false);
    }
  };

  // Handle withdraw money
  const handleWithdrawMoney = async () => {
    // This would be implemented with payout API
    alert("Withdrawal feature would be implemented here");
  };

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
              <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
              <p className="text-gray-600 mt-1">
                Manage your payments and transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wallet Balance Card */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-townkart-primary to-townkart-secondary text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Wallet className="h-8 w-8" />
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    Active
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-white/80 text-sm">Current Balance</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(wallet?.currentBalance || 0)}
                  </p>
                </div>
                <div className="mt-6 space-y-3">
                  <Dialog
                    open={showAddMoneyDialog}
                    onOpenChange={setShowAddMoneyDialog}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full bg-white text-townkart-primary hover:bg-gray-100">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Money
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Money to Wallet</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={addMoneyAmount}
                            onChange={(e) => setAddMoneyAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentMethod">Payment Method</Label>
                          <Select
                            value={paymentMethod}
                            onValueChange={setPaymentMethod}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="card">
                                Credit/Debit Card
                              </SelectItem>
                              <SelectItem value="netbanking">
                                Net Banking
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={handleAddMoney}
                          disabled={
                            isAddingMoney || !addMoneyAmount || !paymentMethod
                          }
                          className="w-full"
                        >
                          {isAddingMoney ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Add Money
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    className="w-full border-white/30 text-white hover:bg-white/10"
                    onClick={handleWithdrawMoney}
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Wallet Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Wallet Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Total Earned</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(wallet?.totalEarned || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-gray-600">
                      Total Withdrawn
                    </span>
                  </div>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(wallet?.totalWithdrawn || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">
                      Available Balance
                    </span>
                  </div>
                  <span className="font-semibold text-blue-600">
                    {formatCurrency(wallet?.currentBalance || 0)}
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

        {/* Payment Methods Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-2 border-dashed border-gray-300 hover:border-townkart-primary transition-colors cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Add Payment Method</p>
                </CardContent>
              </Card>

              {/* Sample payment methods - in real app, these would be fetched */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-gray-500">Expires 12/25</p>
                      </div>
                    </div>
                    <Badge>Primary</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <div className="text-green-600 font-bold text-sm">
                          UPI
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">user@upi</p>
                        <p className="text-sm text-gray-500">UPI ID</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

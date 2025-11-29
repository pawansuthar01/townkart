"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface WalletData {
  currentBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingPayout: number;
  nextPayoutDate: string;
}

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
}

export default function StoreWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      // Mock data for now
      const mockWallet: WalletData = {
        currentBalance: 12500,
        totalEarned: 45000,
        totalWithdrawn: 32500,
        pendingPayout: 2500,
        nextPayoutDate: "2024-01-15",
      };

      const mockTransactions: Transaction[] = [
        {
          id: "1",
          type: "credit",
          amount: 450,
          description: "Order #ORD-001 delivery completed",
          date: "2024-01-10",
          status: "completed",
        },
        {
          id: "2",
          type: "credit",
          amount: 380,
          description: "Order #ORD-002 delivery completed",
          date: "2024-01-09",
          status: "completed",
        },
        {
          id: "3",
          type: "debit",
          amount: 5000,
          description: "Weekly payout",
          date: "2024-01-08",
          status: "completed",
        },
        {
          id: "4",
          type: "credit",
          amount: 520,
          description: "Order #ORD-003 delivery completed",
          date: "2024-01-07",
          status: "completed",
        },
      ];

      setWallet(mockWallet);
      setTransactions(mockTransactions);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPayout = async () => {
    // In a real app, this would call an API
    alert(
      "Payout request submitted. Funds will be transferred within 24 hours.",
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load wallet data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Wallet</h1>
          <p className="text-gray-600">Manage your earnings and payouts</p>
        </div>
      </div>

      {/* Wallet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{wallet.currentBalance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{wallet.totalEarned.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Withdrawn
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{wallet.totalWithdrawn.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Paid out to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payout
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ₹{wallet.pendingPayout.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Next payout:{" "}
              {new Date(wallet.nextPayoutDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Request Instant Payout</p>
              <p className="text-sm text-gray-600">
                Transfer available balance to your bank account
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Minimum payout amount: ₹500 | Processing fee: ₹10
              </p>
            </div>
            <Button
              onClick={requestPayout}
              disabled={wallet.currentBalance < 500}
              className="bg-green-600 hover:bg-green-700"
            >
              Request Payout
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.type === "credit" ? "default" : "secondary"
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      transaction.type === "credit"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {transaction.type === "credit" ? "+" : "-"}₹
                    {transaction.amount}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.status === "completed" && (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Completed</span>
                        </>
                      )}
                      {transaction.status === "pending" && (
                        <>
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="text-yellow-600">Pending</span>
                        </>
                      )}
                      {transaction.status === "failed" && (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Failed</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payout Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Payout Schedule</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Weekly payouts every Monday</li>
                <li>• Minimum payout threshold: ₹500</li>
                <li>• Processing time: 24-48 hours</li>
                <li>• Instant payouts available (₹10 fee)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Commission Structure</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Platform fee: 10% of order value</li>
                <li>• Delivery fee: Paid by customer</li>
                <li>• No hidden charges</li>
                <li>• Transparent earnings tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

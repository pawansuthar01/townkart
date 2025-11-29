"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CashBalanceData {
  totalCollected: number;
  totalDeposited: number;
  outstandingAmount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  settlementRequired: boolean;
  nextSettlementDue?: Date;
}

interface CashBalanceCardProps {
  balance: CashBalanceData;
  onDepositClick?: () => void;
  className?: string;
}

export function CashBalanceCard({
  balance,
  onDepositClick,
  className,
}: CashBalanceCardProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "HIGH":
        return "text-red-600 bg-red-50 border-red-200";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "HIGH":
        return <AlertTriangle className="w-4 h-4" />;
      case "MEDIUM":
        return <Clock className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN")}`;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Cash Balance</span>
          <Badge
            variant="outline"
            className={cn("text-xs", getRiskColor(balance.riskLevel))}
          >
            {getRiskIcon(balance.riskLevel)}
            <span className="ml-1">{balance.riskLevel} RISK</span>
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Outstanding Amount - Primary Focus */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {formatCurrency(balance.outstandingAmount)}
          </div>
          <div className="text-sm text-blue-700 font-medium">
            Outstanding Cash
          </div>
          <div className="text-xs text-blue-600 mt-1">
            To be deposited at store
          </div>
        </div>

        {/* Balance Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-semibold text-green-600">
              {formatCurrency(balance.totalCollected)}
            </div>
            <div className="text-xs text-green-700">Collected</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-semibold text-orange-600">
              {formatCurrency(balance.totalDeposited)}
            </div>
            <div className="text-xs text-orange-700">Deposited</div>
          </div>
        </div>

        {/* Settlement Status */}
        {balance.nextSettlementDue && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Next Settlement</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {balance.nextSettlementDue.toLocaleDateString("en-IN")}
            </span>
          </div>
        )}

        {/* Risk Warnings */}
        {balance.settlementRequired && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-800">
                  Immediate Deposit Required
                </div>
                <div className="text-xs text-red-700 mt-1">
                  Outstanding cash exceeds limit. Please deposit at nearest
                  store.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={onDepositClick}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700"
          disabled={balance.outstandingAmount === 0}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {balance.outstandingAmount === 0
            ? "No Cash to Deposit"
            : "Deposit Cash Now"}
        </Button>

        {/* Helper Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Deposits are processed daily. Keep outstanding cash under ₹10,000.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

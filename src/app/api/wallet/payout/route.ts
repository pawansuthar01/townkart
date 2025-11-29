import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { walletManager } from "@/lib/walletManagement";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, method, accountDetails } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 },
      );
    }

    if (!method || !["bank_transfer", "upi", "wallet"].includes(method)) {
      return NextResponse.json(
        { error: "Valid payout method is required" },
        { status: 400 },
      );
    }

    // Get user's wallet
    const { prisma } = await import("@/lib/prisma");
    const wallet = await prisma.wallet.findFirst({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Process payout
    const payoutReference = await walletManager.processPayout({
      walletId: wallet.id,
      amount: parseFloat(amount),
      method,
      accountDetails,
    });

    return NextResponse.json({
      success: true,
      message: "Payout request submitted successfully",
      payoutReference,
    });
  } catch (error: any) {
    console.error("Payout request error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

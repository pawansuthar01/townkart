import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { walletManager } from "@/lib/walletManagement";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type") as "CREDIT" | "DEBIT" | null;
    const dateFrom = searchParams.get("dateFrom")
      ? new Date(searchParams.get("dateFrom")!)
      : undefined;
    const dateTo = searchParams.get("dateTo")
      ? new Date(searchParams.get("dateTo")!)
      : undefined;

    // Get user's wallet
    const wallet = await prisma.wallet.findFirst({
      where: { userId: session.user.id },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const transactions = await walletManager.getTransactionHistory(wallet.id, {
      limit,
      offset,
      type: type ? (type === "CREDIT" ? "credit" : "debit") : undefined,
      dateFrom,
      dateTo,
    });

    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Get wallet transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallet = await prisma.wallet.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        currentBalance: true,
        totalEarned: true,
        totalWithdrawn: true,
        lastUpdatedAt: true,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      wallet,
    });
  } catch (error) {
    console.error("Get wallet balance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

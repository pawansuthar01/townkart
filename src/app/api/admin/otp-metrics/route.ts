import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OTPService } from "@/lib/otpService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !["ADMIN", "STORE_MANAGER"].includes((session.user as any).activeRole)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange =
      (searchParams.get("timeRange") as "hour" | "day" | "week") || "day";

    const metrics = await OTPService.getOTPMetrics(timeRange);

    return NextResponse.json({
      success: true,
      metrics,
      timeRange,
    });
  } catch (error) {
    console.error("Error fetching OTP metrics:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch OTP metrics" },
      { status: 500 }
    );
  }
}

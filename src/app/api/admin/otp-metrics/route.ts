import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OTPService } from "@/lib/otpService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = (searchParams.get("timeRange") || "day") as
      | "hour"
      | "day"
      | "week";

    const metrics = await OTPService.getOTPMetrics(timeRange);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching OTP metrics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

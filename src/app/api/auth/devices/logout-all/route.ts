import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeviceTracker } from "@/middleware/deviceTracking";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current session ID from the session token
    const currentSession = await prisma.session.findFirst({
      where: {
        userId: session.user.id,
        sessionToken: (session as any).sessionToken,
      },
    });

    if (!currentSession) {
      return NextResponse.json(
        { success: false, message: "Current session not found" },
        { status: 404 }
      );
    }

    // Terminate all other sessions
    const terminatedCount = await DeviceTracker.terminateAllSessions(
      session.user.id,
      currentSession.id
    );

    return NextResponse.json({
      success: true,
      message: `Successfully logged out from ${terminatedCount} other device(s)`,
      data: {
        terminatedSessions: terminatedCount,
        currentSessionKept: currentSession.id,
      },
    });
  } catch (error: any) {
    console.error("Logout all devices error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeviceTracker } from "@/middleware/deviceTracking";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeSessions = await DeviceTracker.getActiveSessions(
      session.user.id,
    );

    return NextResponse.json({
      sessions: activeSessions.map((sess) => ({
        id: sess.id,
        deviceName: sess.device?.deviceName,
        deviceType: sess.device?.deviceType,
        os: sess.device?.os,
        browser: sess.device?.browser,
        ipAddress: sess.ipAddress,
        location: sess.location,
        lastActivity: sess.lastActivity,
        createdAt: sess.createdAt,
        isCurrentSession: false, // TODO: Implement current session detection
      })),
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, terminateAll } = await request.json();

    if (terminateAll) {
      const terminatedCount = await DeviceTracker.terminateAllSessions(
        session.user.id,
        // TODO: Pass current session ID to keep it active
      );

      return NextResponse.json({
        message: `Terminated ${terminatedCount} sessions`,
        terminatedCount,
      });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 },
      );
    }

    const terminated = await DeviceTracker.terminateSession(
      sessionId,
      session.user.id,
    );

    if (!terminated) {
      return NextResponse.json(
        { error: "Session not found or already terminated" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Session terminated successfully",
    });
  } catch (error) {
    console.error("Terminate session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

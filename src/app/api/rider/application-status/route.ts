import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // If user is logged in, check their rider profile and applications
    if (session?.user?.id) {
      // Check if user has an approved rider profile
      const riderProfile = await prisma.riderProfile.findUnique({
        where: { userId: session.user.id },
        select: { isActive: true, isVerified: true },
      });

      if (riderProfile?.isActive && riderProfile?.isVerified) {
        return NextResponse.json({ status: "approved" });
      }

      // Check application status for logged-in user
      const whereConditions: any[] = [{ userId: session.user.id }];
      if (session.user.email) {
        whereConditions.push({ email: session.user.email });
      }

      const application = await prisma.application.findFirst({
        where: {
          OR: whereConditions,
          role: "RIDER",
        },
        select: { status: true },
        orderBy: { submittedAt: "desc" },
      });

      if (application) {
        return NextResponse.json({ status: application.status.toLowerCase() });
      }
    }

    // For non-logged-in users or if no application found, check by email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (email) {
      const application = await prisma.application.findFirst({
        where: {
          email: email,
          role: "RIDER",
        },
        select: { status: true },
        orderBy: { submittedAt: "desc" },
      });

      if (application) {
        return NextResponse.json({ status: application.status.toLowerCase() });
      }
    }

    // No application found
    return NextResponse.json({ status: "no_application" });
  } catch (error) {
    console.error("Error checking application status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

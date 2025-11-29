import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const banner = await prisma.banner.create({
      data: body,
    });
    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ads = await prisma.advertisement.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: new Date() }, endDate: { gte: new Date() } },
          { startDate: { lte: new Date() }, endDate: null },
          { startDate: null, endDate: { gte: new Date() } },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(ads);
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    return NextResponse.json(
      { error: "Failed to fetch advertisements" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ad = await prisma.advertisement.create({
      data: body,
    });
    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error("Error creating advertisement:", error);
    return NextResponse.json(
      { error: "Failed to create advertisement" },
      { status: 500 },
    );
  }
}

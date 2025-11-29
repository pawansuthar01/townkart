import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const offers = await prisma.specialOffer.findMany({
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
    console.log(offers);
    return NextResponse.json(offers);
  } catch (error) {
    console.error("Error fetching special offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch special offers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const offer = await prisma.specialOffer.create({
      data: body,
    });
    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error("Error creating special offer:", error);
    return NextResponse.json(
      { error: "Failed to create special offer" },
      { status: 500 }
    );
  }
}

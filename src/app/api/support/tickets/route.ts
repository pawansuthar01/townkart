import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const where: any = {
      customerId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          take: 1,
          orderBy: {
            sentAt: "desc",
          },
          select: {
            message: true,
            sentAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalTickets = await prisma.supportTicket.count({
      where,
    });

    return NextResponse.json({
      success: true,
      data: {
        tickets,
        pagination: {
          page,
          limit,
          total: totalTickets,
          totalPages: Math.ceil(totalTickets / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Get support tickets error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description, category, priority, orderId, storeId } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { success: false, message: "Subject and description are required" },
        { status: 400 },
      );
    }

    // Generate ticket number
    const ticketNumber = `TICK-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerId: session.user.id,
        subject,
        description,
        category: category || "OTHER",
        priority: priority || "MEDIUM",
        orderId,
        storeId,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create initial message
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: session.user.id,
        senderType: "customer",
        message: description,
      },
    });

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error("Create support ticket error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

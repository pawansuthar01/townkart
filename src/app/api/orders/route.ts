import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, OrderStatus } from '@prisma/client'
import { createOrderSchema } from '@/lib/validation'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const merchantId = searchParams.get('merchantId')
    const riderId = searchParams.get('riderId')
    const status = searchParams.get('status') as OrderStatus
    const paymentStatus = searchParams.get('paymentStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (customerId) where.customerId = customerId
    if (merchantId) where.merchantId = merchantId
    if (riderId) {
      where.delivery = {
        riderId: riderId,
      }
    }
    if (status) where.orderStatus = status
    if (paymentStatus) where.paymentStatus = paymentStatus

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, fullName: true, phoneNumber: true },
          },
          merchant: {
            select: { id: true, businessName: true, address: true },
          },
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true, price: true },
              },
            },
          },
          delivery: {
            include: {
              rider: {
                select: { id: true, fullName: true, phoneNumber: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    const { merchantId, items, deliveryAddress, paymentMethod, specialInstructions } = validatedData

    // Get merchant and products
    const merchant = await prisma.merchantProfile.findUnique({
      where: { id: merchantId },
    })

    if (!merchant) {
      return NextResponse.json(
        { success: false, message: 'Merchant not found' },
        { status: 404 }
      )
    }

    // Calculate order total
    let totalAmount = 0
    const orderItems = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product || !product.isAvailable || product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { success: false, message: `Product ${product?.name || 'Unknown'} is not available` },
          { status: 400 }
        )
      }

      const subtotal = product.price * item.quantity
      totalAmount += subtotal

      orderItems.push({
        productId: item.productId,
        productSnapshot: {
          name: product.name,
          price: product.price,
          description: product.description,
        },
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
      })
    }

    // Calculate delivery fee and taxes
    const deliveryFee = 20 // Fixed delivery fee
    const taxAmount = Math.round(totalAmount * 0.05 * 100) / 100 // 5% tax
    const discountAmount = 0 // No discount for now
    const finalAmount = totalAmount + deliveryFee + taxAmount - discountAmount

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: 'customer-id', // This should come from auth
        merchantId,
        totalAmount,
        deliveryFee,
        taxAmount,
        discountAmount,
        finalAmount,
        paymentMethod,
        orderStatus: 'PENDING_CONFIRMATION',
        deliveryAddress,
        specialInstructions,
        orderItems: {
          create: orderItems,
        },
      },
      include: {
        orderItems: true,
        customer: {
          select: { id: true, fullName: true, phoneNumber: true },
        },
        merchant: {
          select: { id: true, businessName: true, address: true },
        },
      },
    })

    // Update product stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: {
            decrement: item.quantity,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      data: order,
    })
  } catch (error: any) {
    console.error('Create order error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input data',
          errors: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
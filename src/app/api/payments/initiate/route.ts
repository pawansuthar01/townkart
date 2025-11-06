import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { initiatePaymentSchema } from '@/lib/validation'
import { createRazorpayOrderData } from '@/types/payment.types'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, paymentMethod } = initiatePaymentSchema.parse(body)

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        merchant: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.paymentStatus === 'COMPLETED') {
      return NextResponse.json(
        { success: false, message: 'Payment already completed for this order' },
        { status: 400 }
      )
    }

    // Calculate final amount
    const finalAmount = order.finalAmount

    if (paymentMethod === 'CASH_ON_DELIVERY') {
      // For COD, just update the payment method
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: 'CASH_ON_DELIVERY',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Cash on delivery selected',
        data: {
          orderId,
          paymentMethod: 'CASH_ON_DELIVERY',
          amount: finalAmount,
        },
      })
    }

    // For online payments, create Razorpay order
    const razorpayOrderData = createRazorpayOrderData(finalAmount)

    // In production, call Razorpay API
    // For now, simulate the response
    const razorpayOrder = {
      id: `order_${Date.now()}`,
      entity: 'order',
      amount: razorpayOrderData.amount,
      amount_paid: 0,
      amount_due: razorpayOrderData.amount,
      currency: 'INR',
      receipt: razorpayOrderData.receipt,
      status: 'created',
      attempts: 0,
      notes: {},
      created_at: Math.floor(Date.now() / 1000),
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: finalAmount,
        paymentMethod,
        transactionId: razorpayOrder.id,
        gatewayOrderId: razorpayOrder.id,
        paymentStatus: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        orderId,
        paymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        amount: finalAmount,
        currency: 'INR',
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
    })
  } catch (error: any) {
    console.error('Payment initiation error:', error)

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
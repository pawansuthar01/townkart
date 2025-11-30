import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { notificationManager } from "@/lib/notificationSystem";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Signature missing" }, { status: 400 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const { event: eventType, data } = event;

    console.log("Razorpay webhook received:", eventType);

    switch (eventType) {
      case "payment.captured":
        await handlePaymentCaptured(data.payment);
        break;

      case "payment.failed":
        await handlePaymentFailed(data.payment);
        break;

      case "order.paid":
        await handleOrderPaid(data.order);
        break;

      default:
        console.log("Unhandled webhook event:", eventType);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any) {
  const { order_id, id: paymentId, amount } = payment;

  try {
    // Update payment status
    const paymentRecord = await prisma.payment.updateMany({
      where: { gatewayOrderId: order_id },
      data: {
        paymentStatus: "COMPLETED",
        gatewayPaymentId: paymentId,
        completedAt: new Date(),
      },
    });

    if (paymentRecord.count > 0) {
      // Update order status
      const payment = await prisma.payment.findFirst({
        where: { gatewayOrderId: order_id },
        include: { order: { include: { customer: true, store: true } } },
      });

      if (payment?.order) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "COMPLETED",
            orderStatus: "STORE_ASSIGNED", // Move to next status
          },
        });

        // Send notification to customer
        await notificationManager.sendNotification(
          payment.order.customerId,
          "payment_received",
          {
            orderId: payment.orderId,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
          }
        );

        // Send notification to store
        await notificationManager.sendNotification(
          payment.order.store.managerId!,
          "order_status_update",
          {
            orderId: payment.orderId,
            status: "STORE_ASSIGNED",
            customerName: payment.order.customer.fullName,
          }
        );
      }
    }
  } catch (error) {
    console.error("Error handling payment captured:", error);
  }
}

async function handlePaymentFailed(payment: any) {
  const { order_id, id: paymentId } = payment;

  try {
    // Update payment status
    await prisma.payment.updateMany({
      where: { gatewayOrderId: order_id },
      data: {
        paymentStatus: "FAILED",
        gatewayPaymentId: paymentId,
      },
    });

    // Update order status
    const payment = await prisma.payment.findFirst({
      where: { gatewayOrderId: order_id },
      include: { order: true },
    });

    if (payment?.order) {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: "FAILED",
        },
      });

      // Send notification to customer
      await notificationManager.sendNotification(
        payment.order.customerId,
        "payment_failed",
        {
          orderId: payment.orderId,
          amount: payment.amount,
          reason: "Payment failed",
        }
      );
    }
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

async function handleOrderPaid(order: any) {
  const { id: orderId } = order;

  try {
    // Update order payment status
    await prisma.order.updateMany({
      where: { id: orderId },
      data: {
        paymentStatus: "COMPLETED",
      },
    });

    // Update payment status
    await prisma.payment.updateMany({
      where: { gatewayOrderId: orderId },
      data: {
        paymentStatus: "COMPLETED",
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error handling order paid:", error);
  }
}

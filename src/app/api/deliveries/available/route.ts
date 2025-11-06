import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = parseFloat(searchParams.get('latitude') || '0')
    const longitude = parseFloat(searchParams.get('longitude') || '0')
    const radius = parseFloat(searchParams.get('radius') || '2') // 2km default

    // Find available deliveries within radius
    const deliveries = await prisma.delivery.findMany({
      where: {
        deliveryStatus: 'ASSIGNED',
        order: {
          orderStatus: {
            in: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
          },
        },
      },
      include: {
        order: {
          include: {
            customer: {
              select: { id: true, fullName: true, phoneNumber: true },
            },
            merchant: {
              select: {
                id: true,
                businessName: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
            orderItems: {
              include: {
                product: {
                  select: { id: true, name: true, price: true },
                },
              },
            },
          },
        },
      },
    })

    // Filter by distance from rider location
    const nearbyDeliveries = deliveries.filter((delivery) => {
      if (!delivery.order.merchant.latitude || !delivery.order.merchant.longitude) {
        return false
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        delivery.order.merchant.latitude,
        delivery.order.merchant.longitude
      )

      return distance <= radius
    })

    // Sort by distance
    nearbyDeliveries.sort((a, b) => {
      const distanceA = calculateDistance(
        latitude,
        longitude,
        a.order.merchant.latitude!,
        a.order.merchant.longitude!
      )
      const distanceB = calculateDistance(
        latitude,
        longitude,
        b.order.merchant.latitude!,
        b.order.merchant.longitude!
      )
      return distanceA - distanceB
    })

    return NextResponse.json({
      success: true,
      data: nearbyDeliveries,
      count: nearbyDeliveries.length,
    })
  } catch (error: any) {
    console.error('Get available deliveries error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}
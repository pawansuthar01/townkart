import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const latitude = parseFloat(searchParams.get('latitude') || '0')
    const longitude = parseFloat(searchParams.get('longitude') || '0')
    const radius = parseFloat(searchParams.get('radius') || '10') // 10km default
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {
      isActive: true,
      isVerified: true,
    }

    if (query) {
      where.OR = [
        { businessName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    // Get all merchants first
    const merchants = await prisma.merchantProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, phoneNumber: true },
        },
        _count: {
          select: { products: true, orders: true },
        },
      },
    })

    // Filter by distance if coordinates provided
    let filteredMerchants = merchants
    if (latitude && longitude) {
      filteredMerchants = merchants.filter((merchant) => {
        if (!merchant.latitude || !merchant.longitude) return false

        const distance = calculateDistance(
          latitude,
          longitude,
          merchant.latitude,
          merchant.longitude
        )

        // Add distance to merchant object for sorting
        ;(merchant as any).distance = distance
        return distance <= radius
      })

      // Sort by distance
      filteredMerchants.sort((a, b) => (a as any).distance - (b as any).distance)
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMerchants = filteredMerchants.slice(startIndex, endIndex)

    // Get products for each merchant
    const merchantsWithProducts = await Promise.all(
      paginatedMerchants.map(async (merchant) => {
        const products = await prisma.product.findMany({
          where: {
            merchantId: merchant.id,
            isAvailable: true,
          },
          take: 5, // Limit to 5 products per merchant
          select: {
            id: true,
            name: true,
            price: true,
            discountedPrice: true,
            images: true,
          },
        })

        return {
          ...merchant,
          products,
          distance: (merchant as any).distance,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: merchantsWithProducts,
      pagination: {
        page,
        limit,
        total: filteredMerchants.length,
        totalPages: Math.ceil(filteredMerchants.length / limit),
      },
    })
  } catch (error: any) {
    console.error('Get shops error:', error)
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
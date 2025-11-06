import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const subcategory = searchParams.get('subcategory')
    const merchantId = searchParams.get('merchantId')
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined
    const inStock = searchParams.get('inStock') === 'true'
    const sortBy = searchParams.get('sortBy') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {
      isAvailable: true,
    }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (subcategory) {
      where.subcategory = subcategory
    }

    if (merchantId) {
      where.merchantId = merchantId
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    if (inStock) {
      where.stockQuantity = { gt: 0 }
    }

    // Build orderBy
    let orderBy: any = { createdAt: 'desc' }
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'popularity':
        // This would require a popularity score field
        orderBy = { createdAt: 'desc' }
        break
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              address: true,
              latitude: true,
              longitude: true,
              averageRating: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      discountedPrice,
      stockQuantity,
      category,
      subcategory,
      images,
      isAvailable,
    } = body

    if (!name || !price || !category) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get merchant ID from auth (placeholder)
    const merchantId = 'merchant-id' // This should come from auth

    const product = await prisma.product.create({
      data: {
        merchantId,
        name,
        description,
        price: parseFloat(price),
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        stockQuantity: parseInt(stockQuantity) || 0,
        category,
        subcategory,
        images: images || [],
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            address: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      data: product,
    })
  } catch (error: any) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { generateOTP, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validation'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber } = loginSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        phoneNumber: true,
        fullName: true,
        userRoles: true,
        activeRole: true,
        phoneVerified: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found. Please register first.' },
        { status: 404 }
      )
    }

    // Generate OTP
    const otp = generateOTP()

    // In production, send OTP via SMS
    // For development, we'll log it
    console.log(`OTP for ${phoneNumber}: ${otp}`)

    // Store OTP in database (in production, use Redis or similar)
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your phone number',
      data: {
        phoneNumber,
        otpSent: true,
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)

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
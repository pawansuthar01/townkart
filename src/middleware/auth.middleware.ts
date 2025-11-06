import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/verify-otp',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/verify-otp',
    '/api/auth/refresh-token',
  ]

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Get token from Authorization header
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Verify token
    const decoded = verifyAccessToken(token)

    // Add user info to headers for use in API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decoded.userId)
    requestHeaders.set('x-user-roles', JSON.stringify(decoded.roles))
    requestHeaders.set('x-active-role', decoded.activeRole)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

export function roleBasedAccessControl(
  userRoles: string[],
  activeRole: string,
  requiredPermissions: string[]
): boolean {
  // Import permissions dynamically to avoid circular dependencies
  const { getRolePermissions } = require('@/lib/auth')

  // Check if user has the active role
  if (!userRoles.includes(activeRole)) {
    return false
  }

  // Get permissions for the active role
  const rolePermissions = getRolePermissions(activeRole as any)

  // Check if user has all required permissions
  return requiredPermissions.every(permission =>
    rolePermissions.includes(permission)
  )
}

// Middleware for specific routes
export function customerOnlyMiddleware(request: NextRequest) {
  const userRoles = JSON.parse(request.headers.get('x-user-roles') || '[]')
  const activeRole = request.headers.get('x-active-role') || ''

  if (!roleBasedAccessControl(userRoles, activeRole, ['view_products'])) {
    return NextResponse.json(
      { success: false, message: 'Customer access required' },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export function merchantOnlyMiddleware(request: NextRequest) {
  const userRoles = JSON.parse(request.headers.get('x-user-roles') || '[]')
  const activeRole = request.headers.get('x-active-role') || ''

  if (!roleBasedAccessControl(userRoles, activeRole, ['manage_products'])) {
    return NextResponse.json(
      { success: false, message: 'Merchant access required' },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export function riderOnlyMiddleware(request: NextRequest) {
  const userRoles = JSON.parse(request.headers.get('x-user-roles') || '[]')
  const activeRole = request.headers.get('x-active-role') || ''

  if (!roleBasedAccessControl(userRoles, activeRole, ['view_available_deliveries'])) {
    return NextResponse.json(
      { success: false, message: 'Rider access required' },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export function adminOnlyMiddleware(request: NextRequest) {
  const userRoles = JSON.parse(request.headers.get('x-user-roles') || '[]')
  const activeRole = request.headers.get('x-active-role') || ''

  if (!roleBasedAccessControl(userRoles, activeRole, ['manage_users'])) {
    return NextResponse.json(
      { success: false, message: 'Admin access required' },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

// Route-specific middleware configuration
export const routeMiddleware: Record<string, (request: NextRequest) => NextResponse> = {
  // Customer routes
  '/api/orders': customerOnlyMiddleware,
  '/api/users/profile': authMiddleware,
  '/api/users/addresses': authMiddleware,

  // Merchant routes
  '/api/products': merchantOnlyMiddleware,
  '/api/shops': merchantOnlyMiddleware,

  // Rider routes
  '/api/deliveries': riderOnlyMiddleware,

  // Admin routes
  '/api/admin': adminOnlyMiddleware,
}

// Main middleware function
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply auth middleware first
  const authResult = authMiddleware(request)
  if (authResult.status !== 200) {
    return authResult
  }

  // Apply route-specific middleware
  for (const [route, middlewareFn] of Object.entries(routeMiddleware)) {
    if (pathname.startsWith(route)) {
      const result = middlewareFn(request)
      if (result.status !== 200) {
        return result
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
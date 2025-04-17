import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const referrer = request.headers.get('referer') || ''

  // Check if the referrer contains "vercel"
  if (referrer.includes('vercel')) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex')
    return response
  }

  return NextResponse.next()
}

// Apply middleware to all routes
export const config = {
  matcher: '/:path*',
}

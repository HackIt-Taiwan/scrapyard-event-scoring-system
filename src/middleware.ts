import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = ['/login'];
  
  // Check if the requested path is public
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // If the path is public, allow the request to proceed
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Get the token from the cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // If there's no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    // Verify the token
    // In production, use environment variables for the secret
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-for-development'
    );
    
    const { payload } = await jwtVerify(token, secret);
    
    // Check if the token has expired
    const expiryTime = payload.exp ? payload.exp * 1000 : 0; // Convert to milliseconds
    if (expiryTime < Date.now()) {
      // Clear the cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
    
    // If the token is valid, allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error('JWT verification error:', error);
    
    // Clear the cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes that handle their own auth
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo*.svg (favicon and logos)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo*.svg).*)',
  ],
}; 
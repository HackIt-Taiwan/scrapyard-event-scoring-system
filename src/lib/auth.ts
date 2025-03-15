import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'cookie';
import { verifyToken, JwtPayload } from './jwt';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Interface for user data extracted from JWT token
export interface UserData {
  email: string;
  user_id: string;
  team_id: string;
  is_admin: boolean;
  is_judge: boolean;
  exp: number;
}

/**
 * Gets the current authenticated user from JWT token
 * @returns UserData | null - User data if authenticated, null otherwise
 */
export async function getCurrentUser(): Promise<UserData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    // Verify the token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key-for-development'
    );
    
    const { payload } = await jwtVerify(token, secret);
    
    // Check if the token has expired
    const expiryTime = payload.exp ? payload.exp as number * 1000 : 0; // Convert to milliseconds
    if (expiryTime < Date.now()) {
      return null;
    }
    
    // Return user data from payload
    return {
      email: payload.email as string,
      user_id: payload.user_id as string,
      team_id: payload.team_id as string,
      is_admin: payload.is_admin as boolean,
      is_judge: payload.is_judge as boolean,
      exp: payload.exp as number,
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Check if user has admin privileges
 * @returns boolean - true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user?.is_admin;
}

/**
 * Check if user has judge privileges
 * @returns boolean - true if user is judge, false otherwise
 */
export async function isJudge(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user?.is_judge;
}

/**
 * Decodes JWT token without verifying signature
 * Used client-side to extract user data from token
 * @param token JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeJwtToken(token: string): UserData | null {
  try {
    // Split token into parts
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return null;
    }
    
    // Decode the payload part (second part)
    const payload = JSON.parse(atob(tokenParts[1]));
    
    return {
      email: payload.email,
      user_id: payload.user_id,
      team_id: payload.team_id,
      is_admin: payload.is_admin,
      is_judge: payload.is_judge,
      exp: payload.exp,
    };
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

export async function getAuthUser(request: NextRequest): Promise<JwtPayload | null> {
  // Check for the auth cookie
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = parse(cookieHeader);
  const token = cookies.auth_token;
  if (!token) return null;

  // Verify the token
  return verifyToken(token);
}

export function authMiddleware(handler: (request: NextRequest, user: JwtPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await getAuthUser(request);
    
    // If user is not authenticated, return 401
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call the handler with the user
    return handler(request, user);
  };
}

// Helper middleware for checking if a user is a judge
export function judgeMiddleware(handler: (request: NextRequest, user: JwtPayload) => Promise<NextResponse>) {
  return authMiddleware(async (request, user) => {
    if (!user.is_judge) {
      return NextResponse.json(
        { error: 'Judge access required' },
        { status: 403 }
      );
    }

    return handler(request, user);
  });
}

// Helper middleware for checking if a user is an admin
export function adminMiddleware(handler: (request: NextRequest, user: JwtPayload) => Promise<NextResponse>) {
  return authMiddleware(async (request, user) => {
    if (!user.is_admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return handler(request, user);
  });
} 
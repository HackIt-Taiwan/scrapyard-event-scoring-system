import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { serialize } from 'cookie';
import connectToDatabase from '@/lib/db';
import { getMember } from '@/lib/databaseAPI';

// GET /api/v1/auth/login?auth=jwt
export async function GET(request: NextRequest) {
  try {
    // Get token from query parameter
    const searchParams = request.nextUrl.searchParams;
    const auth = searchParams.get('auth');

    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication token is required' },
        { status: 400 }
      );
    }

    // Verify the token
    const payload = verifyToken(auth);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find user by email (additional verification)
    const user = await getMember(payload.user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Set JWT in cookie
    const cookie = serialize('auth_token', auth, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    // Create response with user data
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.user_id,
        email: user.email,
        team_id: user.team_id,
        is_admin: user.is_admin,
        is_judge: user.is_judge,
      },
    });

    // Set the cookie in the response
    response.headers.set('Set-Cookie', cookie);

    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
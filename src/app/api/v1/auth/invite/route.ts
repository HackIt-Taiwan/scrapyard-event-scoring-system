import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { generateToken } from '@/lib/jwt';
import { v4 as uuidv4 } from 'uuid';

// POST /api/v1/auth/invite
export async function POST(request: NextRequest) {
  try {
    const { email, team_id } = await request.json();

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    let user = await User.findOne({ email });

    // If user doesn't exist, create a new one
    if (!user) {
      user = new User({
        user_id: uuidv4(),
        email,
        team_id: team_id || null,
        is_judge: true, // for this system, most users will be judges
        is_admin: false,
      });
      
      await user.save();
    } else {
      // Update team_id if provided
      if (team_id) {
        user.team_id = team_id;
        await user.save();
      }
    }

    // Generate JWT token
    const jwt = generateToken({
      email: user.email,
      user_id: user.user_id,
      team_id: user.team_id,
      is_admin: user.is_admin,
      is_judge: user.is_judge,
    });

    // In a real system, you would send this token via email
    // For demonstration, we'll just return it
    return NextResponse.json({
      message: 'Invitation sent successfully',
      jwt,
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
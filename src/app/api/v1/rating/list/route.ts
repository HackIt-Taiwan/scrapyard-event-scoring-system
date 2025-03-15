import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Team from '@/models/Team';
import Rating from '@/models/Rating';
import { judgeMiddleware } from '@/lib/auth';

// GET /api/v1/rating/list - Get list of all teams
export const GET = judgeMiddleware(async (request: NextRequest, user) => {
  try {
    await connectToDatabase();

    // Get all teams sorted by index
    const teams = await Team.find().sort({ index: 1 });

    // Get all ratings by this user
    const userRatings = await Rating.find({ user_id: user.user_id });

    // Create a set of team IDs that the user has already rated
    const ratedTeams = new Set(userRatings.map(rating => rating.team_id));

    // Map teams to the response format
    const teamList = teams.map(team => ({
      index: team.index,
      team_id: team.team_id,
      team_name: team.team_name,
      active: team.active,
      can_vote: team.active && !ratedTeams.has(team.team_id),
    }));

    return NextResponse.json(teamList);
  } catch (error) {
    console.error('Error fetching team list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 
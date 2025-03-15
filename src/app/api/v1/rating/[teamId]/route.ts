import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Rating from '@/models/Rating';
import { judgeMiddleware } from '@/lib/auth';
import { getTeamDetails } from '@/lib/databaseAPI';

// GET /api/v1/rating/:teamId - Get rating for a specific team
export const GET = judgeMiddleware(async (request: NextRequest, user) => {
  const teamIdParam = request.url.split('/').pop();

  if (!teamIdParam) {
    return NextResponse.json(
      { error: 'Team ID is required' },
      { status: 400 }
    );
  }

  const teamId = teamIdParam;

  try {
    // Fetch team details using the existing helper function
    const teamData = await getTeamDetails(teamId);

    if (!teamData) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Connect to database for ratings
    await connectToDatabase();

    // Check if user has already rated this team
    const existingRating = await (Rating.findOne as any)({
      team_id: teamId,
      user_id: user.user_id,
    });

    // Get all ratings for this team to calculate average
    // @ts-expect-error - Bypassing TypeScript error for Mongoose query
    const allRatings = await Rating.find({ team_id: teamId });

    // Calculate average ratings
    const avgRatings = allRatings.reduce(
      (acc, rating) => {
        acc.creativity += rating.creativity;
        acc.completeness += rating.completeness;
        acc.presentation += rating.presentation;
        return acc;
      },
      { creativity: 0, completeness: 0, presentation: 0 }
    );

    const count = allRatings.length;
    if (count > 0) {
      avgRatings.creativity /= count;
      avgRatings.completeness /= count;
      avgRatings.presentation /= count;
    }

    return NextResponse.json({
      team_id: teamData._id || teamId,
      team_name: teamData.team_name || 'Unknown Team',
      ratings: avgRatings,
      user_rating: existingRating ? {
        creativity: existingRating.creativity,
        completeness: existingRating.completeness,
        presentation: existingRating.presentation,
        comments: existingRating.comments || '',
      } : null,
      team_data: teamData.team, // Include additional team data from external API
    });
  } catch (error) {
    console.error('Error fetching team with score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// POST /api/v1/rating/:teamId - Submit a new rating
export const POST = judgeMiddleware(async (request: NextRequest, user) => {
  const teamIdParam = request.url.split('/').pop();
  
  if (!teamIdParam) {
    return NextResponse.json(
      { error: 'Team ID is required' },
      { status: 400 }
    );
  }
  
  const teamId = teamIdParam;
  
  try {
    const { creativity, completeness, presentation, comments } = await request.json();

    // Validate required fields
    if (!creativity || !completeness || !presentation) {
      return NextResponse.json(
        { error: 'All rating fields are required' },
        { status: 400 }
      );
    }

    // Validate rating values (1-10)
    const validateRating = (value: number) => value >= 1 && value <= 10;
    if (
      !validateRating(creativity) ||
      !validateRating(completeness) ||
      !validateRating(presentation)
    ) {
      return NextResponse.json(
        { error: 'Ratings must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Fetch team details to verify team exists
    const teamData = await getTeamDetails(teamId);
    
    if (!teamData) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    await connectToDatabase();

    // Check if user has already rated this team
    const existingRating = await (Rating.findOne as any)({
      team_id: teamId,
      user_id: user.user_id,
    });

    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this team. Use PUT to update.' },
        { status: 400 }
      );
    }

    // Create new rating
    const rating = new Rating({
      team_id: teamId,
      user_id: user.user_id,
      creativity,
      completeness,
      presentation,
      comments: comments || '',
    });

    await rating.save();

    return NextResponse.json({
      message: 'Rating submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/v1/rating/:teamId - Update an existing rating
export const PUT = judgeMiddleware(async (request: NextRequest, user) => {
  const teamIdParam = request.url.split('/').pop();

  if (!teamIdParam) {
    return NextResponse.json(
      { error: 'Team ID is required' },
      { status: 400 }
    );
  }

  const teamId = teamIdParam;

  try {
    const { creativity, completeness, presentation, comments } = await request.json();

    // Validate required fields
    if (!creativity || !completeness || !presentation) {
      return NextResponse.json(
        { error: 'All rating fields are required' },
        { status: 400 }
      );
    }

    // Validate rating values (1-10)
    const validateRating = (value: number) => value >= 1 && value <= 10;
    if (
      !validateRating(creativity) ||
      !validateRating(completeness) ||
      !validateRating(presentation)
    ) {
      return NextResponse.json(
        { error: 'Ratings must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Fetch team details to verify team exists
    const teamData = await getTeamDetails(teamId);

    if (!teamData) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    await connectToDatabase();

    // Check if rating already exists for update
    // @ts-expect-error - Bypassing TypeScript error for Mongoose query
    const existingRating = await Rating.findOne({
      team_id: teamId,
      user_id: user.user_id,
    });

    if (!existingRating) {
      return NextResponse.json(
        { error: 'You have not yet rated this team. Use POST to create a new rating.' },
        { status: 400 }
      );
    }

    // Update the rating
    existingRating.creativity = creativity;
    existingRating.completeness = completeness;
    existingRating.presentation = presentation;
    existingRating.comments = comments || existingRating.comments || '';

    await existingRating.save();

    return NextResponse.json({
      message: 'Rating updated successfully',
    });
  } catch (error) {
    console.error('Error updating rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Add a new endpoint to get a single team with its score
export const GET_SINGLE_TEAM = judgeMiddleware(async (request: NextRequest, _user) => {
  const teamIdParam = request.url.split('/').pop();

  if (!teamIdParam) {
    return NextResponse.json(
      { error: 'Team ID is required' },
      { status: 400 }
    );
  }

  const teamId = teamIdParam;

  try {
    // Fetch team details using the existing helper function
    const teamData = await getTeamDetails(teamId);

    if (!teamData) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Connect to database for ratings
    await connectToDatabase();

    // Get all ratings for this team to calculate average
    // @ts-expect-error - Bypassing TypeScript error for Mongoose query
    const allRatings = await Rating.find({ team_id: teamId });

    // Calculate average ratings
    const avgRatings = allRatings.reduce(
      (acc, rating) => {
        acc.creativity += rating.creativity;
        acc.completeness += rating.completeness;
        acc.presentation += rating.presentation;
        return acc;
      },
      { creativity: 0, completeness: 0, presentation: 0 }
    );

    const count = allRatings.length;
    if (count > 0) {
      avgRatings.creativity /= count;
      avgRatings.completeness /= count;
      avgRatings.presentation /= count;
    }

    return NextResponse.json({
      team_id: teamData._id || teamId,
      team_name: teamData.team_name || 'Unknown Team',
      ratings: avgRatings,
      team_data: teamData.team, // Include additional team data from external API
    });
  } catch (error) {
    console.error('Error fetching team with score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 
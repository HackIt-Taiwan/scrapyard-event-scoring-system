import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Project from '@/models/Project';
import { adminMiddleware, judgeMiddleware } from '@/lib/auth';

// GET /api/v1/projects/:teamId - Get project data for a specific team
export const GET = judgeMiddleware(async (request: NextRequest) => {
  const teamIdParam = request.url.split('/').pop();

  if (!teamIdParam) {
    return NextResponse.json(
      { error: 'Team ID is required' },
      { status: 400 }
    );
  }

  const teamId = teamIdParam;

  try {
    await connectToDatabase();

    // Find project data for this team
    const project = await Project.findOne({ team_id: teamId });

    if (!project) {
      return NextResponse.json(
        { message: 'No project data found for this team', data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: project
    });
  } catch (error) {
    console.error('Error fetching project data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PUT /api/v1/projects/:teamId - Update project data (admin only)
export const PUT = adminMiddleware(async (request: NextRequest) => {
  const teamIdParam = request.url.split('/').pop();

  if (!teamIdParam) {
    return NextResponse.json(
      { error: 'Team ID is required' },
      { status: 400 }
    );
  }

  const teamId = teamIdParam;

  try {
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find existing project or create new one
    let project = await Project.findOne({ team_id: teamId });

    if (project) {
      // Update existing project
      project.title = body.title;
      project.description = body.description;
      project.narrative = body.narrative || '';
      project.keywords = body.keywords || [];
      project.technologies = body.technologies || [];
      project.github_url = body.github_url;
      project.demo_url = body.demo_url;
      project.image_url = body.image_url;
      
      await project.save();
    } else {
      // Create new project
      project = await Project.create({
        team_id: teamId,
        title: body.title,
        description: body.description,
        narrative: body.narrative || '',
        keywords: body.keywords || [],
        technologies: body.technologies || [],
        github_url: body.github_url,
        demo_url: body.demo_url,
        image_url: body.image_url,
      });
    }

    return NextResponse.json({
      message: 'Project data updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Error updating project data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}); 
/**
 * API client functions for interacting with the backend
 */

import type { TeamDetails } from '@/app/dashboard/[teamId]/page';

// Types for API responses and requests
export interface Team {
  id: string;
  team_id: string;
  team_name: string;
  index: number;
  active: boolean;
  scoredAt?: Date;
  canVote: boolean;
  presentation_time?: string; // Optional presentation time
}

export interface TeamResponse {
  index: number;
  team_id: string;
  team_name: string;
  active: boolean;
  can_vote: boolean;
}

export interface ScoreSubmission {
  team_id: string;
  scores: {
    creativity: number;
    completeness: number;
    presentation: number;
  };
  feedback?: string;
}

export interface ScoreData {
  team_id: string;
  user_id: string;
  creativity: number;
  completeness: number;
  presentation: number;
  comments: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoresResponse {
  scores: ScoreData[];
}

/**
 * Fetch all teams for scoring
 */
export async function fetchTeams(): Promise<Team[]> {
  try {
    const response = await fetch('/api/v1/rating/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Include credentials to send cookies with request
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as TeamResponse[];
    
    // Map the API response to our Team interface
    return data.map((team: TeamResponse) => ({
      id: team.team_id, // Use team_id as id for compatibility
      team_id: team.team_id,
      team_name: team.team_name,
      index: team.index,
      active: team.active,
      canVote: team.can_vote,
      scoredAt: undefined, // API doesn't provide this, will be updated if needed
    }));
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

/**
 * Fetch all teams for scoring
 */
export async function getTeam(): Promise<Team[]> {
  try {
    const response = await fetch('/api/v1/rating/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json() as TeamResponse[];
    
    // Map the API response to our Team interface
    return data.map((team: TeamResponse) => ({
      id: team.team_id, // Use team_id as id for compatibility
      team_id: team.team_id,
      team_name: team.team_name,
      index: team.index,
      active: team.active,
      canVote: team.can_vote,
      scoredAt: undefined, // API doesn't provide this, will be updated if needed
    }));
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

/**
 * Submit scores for a team
 */
export async function submitTeamScore(submission: ScoreSubmission): Promise<{ success: boolean }> {
  try {
    // First, check if this is a new rating or an update by checking the current rating
    const currentRating = await fetch(`/api/v1/rating/${submission.team_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const ratingData = await currentRating.json();
    const isUpdate = ratingData.user_rating !== null;
    
    // Use PUT for updates, POST for new ratings
    const method = isUpdate ? 'PUT' : 'POST';
    
    const response = await fetch(`/api/v1/rating/${submission.team_id}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        creativity: submission.scores.creativity,
        completeness: submission.scores.completeness,
        presentation: submission.scores.presentation,
        comments: submission.feedback || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
}

/**
 * Get all scores (for admin)
 */
export async function fetchAllScores(): Promise<ScoresResponse> {
  try {
    const response = await fetch('/api/v1/rating/scores', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching scores:', error);
    throw error;
  }
}

// Fetch a single team with its score and user's rating
export async function fetchTeamWithScore(teamId: string): Promise<{ 
  team_id: string; 
  team_name: string; 
  ratings: { 
    creativity: number; 
    completeness: number; 
    presentation: number; 
  }; 
  user_rating: { 
    creativity: number; 
    completeness: number; 
    presentation: number; 
    comments: string; 
  } | null; 
  team_data: TeamDetails;
}> {
  try {
    const response = await fetch(`/api/v1/rating/${teamId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching team with score:', error);
    throw error;
  }
}

/**
 * Fetch project narrative data for a team
 */
export async function fetchProjectData(teamId: string): Promise<{
  title: string;
  description: string;
  narrative: string;
  keywords: string[];
  technologies: string[];
  github_url?: string;
  demo_url?: string;
  image_url?: string;
} | null> {
  try {
    const response = await fetch(`/api/v1/projects/${teamId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status === 404) {
      // No project data found
      return null;
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching project data:', error);
    return null;
  }
} 
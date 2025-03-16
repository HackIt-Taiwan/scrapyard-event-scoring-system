'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// import Sidebar from '@/components/dashboard/sidebar';
import ScoringPanel from '@/components/dashboard/scoring-panel';
// import { useMediaQuery } from '@/hooks/use-media-query';
import { useParams, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { fetchTeams, submitTeamScore, fetchTeamWithScore, fetchProjectData } from '@/lib/api-client';
import type { Team, ScoreSubmission } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import useSWR, { mutate } from 'swr';

export interface TeamDetails {
  team_id: string;
  team_name: string;
  index: number;
  active: boolean;
  members?: Array<{
    name_zh: string;
    name_en: string;
    email: string;
  }>;
  presentation_time?: string;
  current_votes?: number;
  description?: string; // Add support for team description
  project_narrative?: string; // Add support for project narrative
}

// Interface for user's existing rating data
interface UserRating {
  creativity: number;
  completeness: number;
  presentation: number;
  comments: string;
}

export default function Dashboard() {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  
  // Check authentication
  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);
  
  // Fetch teams data with SWR
  const { data: teamsData, error: teamsError } = useSWR('teams', fetchTeams, {
    refreshInterval: 10000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  // Update current team when teams data changes or teamId changes
  useEffect(() => {
    if (!teamsData) return;
    
    // Map the API response to our Team interface
    const mappedTeams = teamsData.map(team => ({
      id: team.team_id,
      team_id: team.team_id,
      team_name: team.team_name,
      index: team.index,
      active: team.active,
      canVote: true, // Force canVote to always be true
      scoredAt: undefined,
    }));
    
    // Find the team that matches the URL parameter
    const matchedTeam = mappedTeams.find(team => team.team_id === teamId);
    if (matchedTeam) {
      setCurrentTeam(matchedTeam);
    }
  }, [teamsData, teamId]);
  
  // Fetch team details and user rating with SWR
  const { data: teamWithScoreData, isValidating: loadingRating } = useSWR(
    currentTeam ? `team-with-score-${currentTeam.team_id}` : null,
    () => currentTeam ? fetchTeamWithScore(currentTeam.team_id) : null,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // Fetch project data with SWR
  const { data: projectData } = useSWR(
    currentTeam ? `project-data-${currentTeam.team_id}` : null,
    () => currentTeam ? fetchProjectData(currentTeam.team_id) : null,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  // Update user rating and team details when team score data changes
  useEffect(() => {
    if (teamWithScoreData) {
      // Set user rating if available
      if (teamWithScoreData.user_rating) {
        setUserRating(teamWithScoreData.user_rating);
      } else {
        setUserRating(null);
      }
      
      // Set team details
      if (teamWithScoreData.team_data) {
        const newTeamDetails: TeamDetails = {
          ...teamWithScoreData.team_data,
          // Ensure required properties are present
          team_id: teamWithScoreData.team_data.team_id,
          team_name: teamWithScoreData.team_data.team_name,
          index: teamWithScoreData.team_data.index,
          active: teamWithScoreData.team_data.active
        };
        
        setTeamDetails(prevDetails => 
          prevDetails ? { ...prevDetails, ...newTeamDetails } : newTeamDetails
        );
      }
    }
  }, [teamWithScoreData]);

  // Update team details with project data when available
  useEffect(() => {
    if (projectData && teamDetails) {
      setTeamDetails(prevDetails => {
        if (!prevDetails) return null;
        
        return {
          ...prevDetails,
          description: projectData.description,
          project_narrative: projectData.narrative
        };
      });
    }
  }, [projectData]);
  
  const handleScoreSubmit = async (scoreData: ScoreSubmission) => {
    try {
      await submitTeamScore(scoreData);
      
      // Update the user rating state with the new values
      setUserRating({
        creativity: scoreData.scores.creativity,
        completeness: scoreData.scores.completeness,
        presentation: scoreData.scores.presentation,
        comments: scoreData.feedback || ''
      });
      
      // Trigger revalidation of data
      mutate('teams');
      if (currentTeam) {
        mutate(`team-with-score-${currentTeam.team_id}`);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to submit score:', err);
      return false;
    }
  };

  // Set error from SWR
  useEffect(() => {
    if (teamsError) {
      console.error('Teams error:', teamsError);
      setError('無法加載隊伍數據。請刷新頁面或稍後再試。');
    } else {
      setError(null);
    }
  }, [teamsError]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm max-w-md">
          <h2 className="text-xl font-semibold mb-2">發生錯誤</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium"
          >
            重新加載
          </button>
        </div>
      </div>
    );
  }

  const isLoading = !teamsData;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen bg-background"
    >

      {/* Main Scoring Panel */}
      <motion.div 
        className="flex-1 p-6 md:p-8"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading && !currentTeam ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-10 h-10 border-t-2 border-primary rounded-full animate-spin mb-4"></div>
            <p className="text-muted-foreground">加載中...</p>
          </div>
        ) : currentTeam ? (
          <div className="max-w-4xl mx-auto">
            {/* Scoring Panel */}
            <ScoringPanel 
              team={currentTeam} 
              onScoreSubmit={handleScoreSubmit} 
              userRating={userRating}
              isLoadingRating={loadingRating}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">請選擇一個隊伍進行評分</p>
            <Button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium"
            >
              重新加載
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

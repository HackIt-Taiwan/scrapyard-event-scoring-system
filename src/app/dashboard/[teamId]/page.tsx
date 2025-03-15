'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// import Sidebar from '@/components/dashboard/sidebar';
import ScoringPanel from '@/components/dashboard/scoring-panel';
// import { useMediaQuery } from '@/hooks/use-media-query';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { fetchTeams, submitTeamScore, fetchTeamWithScore, fetchProjectData } from '@/lib/api-client';
import type { Team, ScoreSubmission } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [loadingRating, setLoadingRating] = useState(false);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const router = useRouter();
  // const params = useParams();
  // const teamId = params.teamId as string;
  
  // Check authentication
  useEffect(() => {
    const token = Cookies.get('auth_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);
  
  // Fetch teams data
  useEffect(() => {
    const getTeams = async () => {
      try {
        setIsLoading(true);
        const teamsData = await fetchTeams();
        
        // Map the API response to our Team interface
        const mappedTeams = teamsData.map(team => ({
          id: team.team_id,
          team_id: team.team_id,
          team_name: team.team_name,
          index: team.index,
          active: team.active,
          canVote: true, // Force canVote to always be true so teams are always editable
          scoredAt: undefined, // This will be updated when we get the rating data
        }));
        
        if (mappedTeams.length > 0 && !currentTeam) {
          // Just select the first team - don't filter by canVote
          setCurrentTeam(mappedTeams[0]);
        } else if (currentTeam) {
          // Update the current team with the latest data, but keep canVote true
          const updatedTeam = mappedTeams.find(team => team.team_id === currentTeam.team_id);
          if (updatedTeam) {
            setCurrentTeam({
              ...updatedTeam,
              canVote: true // Ensure it's always editable
            });
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        setError('無法加載隊伍數據。請刷新頁面或稍後再試。');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Initial fetch
    getTeams();
    
    // Set up polling for updates
    const intervalId = setInterval(getTeams, 5000);
    return () => clearInterval(intervalId);
  }, [currentTeam]);
  
  // Fetch the detailed team data with user's rating when currentTeam changes
  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!currentTeam) return;
      
      try {
        setLoadingRating(true);
        
        // Fetch team data and user rating
        const teamData = await fetchTeamWithScore(currentTeam.team_id);
        
        // If user has a previous rating, set it
        if (teamData.user_rating) {
          setUserRating(teamData.user_rating);
        } else {
          // Reset the user rating if there's none for this team
          setUserRating(null);
        }
        
        // Set team details for the narrative component
        if (teamData.team_data) {
          setTeamDetails(teamData.team_data);
        }
        
        // Fetch project data if available
        const project = await fetchProjectData(currentTeam.team_id);
        if (project && teamDetails) {
          // Update team details with project data if available
          setTeamDetails({
            ...teamDetails,
            description: project.description,
            project_narrative: project.narrative
          });
        }
        
      } catch (err) {
        console.error('Failed to fetch team details:', err);
        // Don't set an error here as it might disrupt the UI
      } finally {
        setLoadingRating(false);
      }
    };
    
    fetchTeamDetails();
  }, [currentTeam?.team_id]);
  
  const handleScoreSubmit = async (scoreData: ScoreSubmission) => {
    try {
      await submitTeamScore(scoreData);
      
      // Refetch teams after successful score submission
      const teamsData = await fetchTeams();
      
      // Map the API response to our Team interface
      const mappedTeams = teamsData.map(team => ({
        id: team.team_id,
        team_id: team.team_id,
        team_name: team.team_name,
        index: team.index,
        active: team.active,
        canVote: true, // Force canVote to always be true
        scoredAt: new Date(), // Set the scoredAt date to now
      }));
      
      // Update current team with new data
      const updatedCurrentTeam = mappedTeams.find(t => t.team_id === currentTeam?.team_id);
      if (updatedCurrentTeam) {
        // Set the current team with canVote always true
        setCurrentTeam(updatedCurrentTeam);
        
        // Update the user rating state with the new values
        setUserRating({
          creativity: scoreData.scores.creativity,
          completeness: scoreData.scores.completeness,
          presentation: scoreData.scores.presentation,
          comments: scoreData.feedback || ''
        });
      }
      
      return true;
    } catch (err) {
      console.error('Failed to submit score:', err);
      return false;
    }
  };

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

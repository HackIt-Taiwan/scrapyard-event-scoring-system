'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// import Sidebar from '@/components/dashboard/sidebar';
import ScoringPanel from '@/components/dashboard/scoring-panel';
// import { useMediaQuery } from '@/hooks/use-media-query';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { fetchTeams, submitTeamScore } from '@/lib/api-client';
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
}

export default function Dashboard() {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          canVote: team.canVote,
          scoredAt: undefined, // This will be updated when we get the rating data
        }));
        
        if (mappedTeams.length > 0 && !currentTeam) {
          // Select first team that can be voted on, or just first team if none are votable
          const firstVotableTeam = mappedTeams.find(team => team.canVote) || mappedTeams[0];
          setCurrentTeam(firstVotableTeam);
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
        canVote: team.canVote,
        scoredAt: undefined, // This will be updated when we get the rating data
      }));
      
      // Update current team with new data
      const updatedCurrentTeam = mappedTeams.find(t => t.team_id === currentTeam?.team_id);
      if (updatedCurrentTeam) {
        // If the current team can no longer be voted on, find the next votable team
        if (!updatedCurrentTeam.canVote) {
          const nextVotableTeam = mappedTeams.find(team => team.canVote && team.team_id !== currentTeam?.team_id);
          if (nextVotableTeam) {
            setCurrentTeam(nextVotableTeam);
          }
        } else {
          setCurrentTeam(updatedCurrentTeam);
        }
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
          <ScoringPanel team={currentTeam} onScoreSubmit={handleScoreSubmit} />
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

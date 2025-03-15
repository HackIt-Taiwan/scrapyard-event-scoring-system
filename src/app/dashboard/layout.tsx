"use client"
import { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/dashboard/sidebar';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { fetchTeams,  } from '@/lib/api-client';
import type { Team } from '@/lib/api-client';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract current teamId from the pathname
  const pathSegments = pathname?.split('/') || [];
  const pathTeamId = pathSegments.length > 2 ? pathSegments[pathSegments.length - 1] : undefined;

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
        
        setTeams(mappedTeams);
        
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
  
  const handleSelectTeam = (team: Team) => {
    setCurrentTeam(team);
    if (!isDesktop) {
      setSidebarOpen(false);
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
      {/* Mobile sidebar toggle */}
      {!isDesktop && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-6 left-6 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}
      
      {/* Main content wrapper */}
      <div className="flex flex-grow w-full">
        {/* Sidebar */}
        <Sidebar 
          teams={teams}
          currentViewedTeamId={pathTeamId}
          onSelectTeam={handleSelectTeam}
          open={isDesktop || sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        {/* Main content area */}
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

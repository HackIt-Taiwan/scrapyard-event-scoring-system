'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Team as ApiTeam } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  teams: ApiTeam[];
  currentViewedTeamId?: string;
  onSelectTeam: (team: ApiTeam) => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ teams, currentViewedTeamId, onSelectTeam, open, onClose }: SidebarProps) {
  const router = useRouter();

  // Sort teams by their index
  const sortedTeams = [...teams].sort((a, b) => a.index - b.index);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile overlay */}
          <motion.div
            className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            className="fixed md:relative w-[80%] md:w-[25%] max-w-sm h-[95vh] my-6 mx-2 md:mx-4 bg-card border border-border rounded-xl shadow-xl z-50 md:z-auto overflow-y-auto"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300 
            }}
            whileHover={{ 
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
            }}
          >
            <div className="flex flex-col h-full border-r border-border bg-card">
              <div className="flex flex-col h-full overflow-y-auto">
                {/* Header with title and close button */}
                <div className="p-4 border-b border-border rounded-t-xl bg-muted/30 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">隊伍列表</h2>
                    <p className="text-sm text-muted-foreground">選擇一個隊伍進行評分</p>
                  </div>
                  
                  {/* Close button for mobile */}
                  <button 
                    onClick={onClose} 
                    className="md:hidden p-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                {/* Legend for team indices */}
                <div className="px-4 pt-2 pb-1 text-xs text-muted-foreground flex justify-between border-b border-border/50">
                  <span className="flex items-center">
                    <span className="inline-flex items-center justify-center bg-muted rounded-full w-4 h-4 text-[10px] mr-1">#</span>
                    隊伍編號順序
                  </span>
                  <span>{sortedTeams.length} 隊</span>
                </div>

                <div className="p-4 space-y-3">
                  {sortedTeams.map((team) => {
                    const isCurrentlyViewed = currentViewedTeamId === team.team_id;
                    
                    return (
                      <div 
                        key={team.team_id} 
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md cursor-pointer group transition-colors',
                          isCurrentlyViewed 
                            ? 'bg-primary/10 hover:bg-primary/15 text-foreground' 
                            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                        )}
                        onClick={() => {
                          router.push(`/dashboard/${team.team_id}`);
                          onSelectTeam(team);
                        }}
                      >
                        {/* Team index badge */}
                        <span 
                          className={cn(
                            'flex-shrink-0 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 text-xs font-medium rounded transition-colors',
                            isCurrentlyViewed 
                              ? 'bg-primary/15 text-primary font-semibold' 
                              : 'bg-muted text-muted-foreground group-hover:bg-muted/70'
                          )}
                        >
                          {team.index}
                        </span>
                        
                        {/* Team name */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <h3 className={cn(
                            "text-sm font-medium truncate",
                            isCurrentlyViewed && "text-primary font-semibold"
                          )}>
                            {team.team_name}
                          </h3>
                        </div>
                        
                        {/* Status badge */}
                        <span
                          className={cn(
                            'flex-shrink-0 px-2 py-0.5 text-xs rounded-full',
                            team.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {team.active ? '可評分' : '已截止'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
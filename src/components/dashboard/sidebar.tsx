'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Team as ApiTeam } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

// Use the Team interface from api-client.ts
type Team = ApiTeam;

interface SidebarProps {
  teams: Team[];
  currentTeam: Team | null;
  onSelectTeam: (team: Team) => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ teams, currentTeam, open, onClose }: SidebarProps) {
  const router = useRouter()
  // Sort teams by scoredAt (most recent first)
  const sortedTeams = [...teams].sort((a, b) => {
    if (a.scoredAt && b.scoredAt) {
      return b.scoredAt.getTime() - a.scoredAt.getTime();
    }
    if (a.scoredAt) return -1;
    if (b.scoredAt) return 1;
    return 0;
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile overlay */}
          <motion.div
            className="md:hidden fixed inset-0 bg-black/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            className="fixed md:relative w-[80%] md:w-[20%] max-w-xs h-full bg-card border-r border-border shadow-md z-50 md:z-auto overflow-y-auto"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold">隊伍列表</h2>
              <p className="text-sm text-muted-foreground">選擇一個隊伍進行評分</p>
            </div>

            <div className="p-2">
              {sortedTeams.map((team) => (
                <motion.div
                  key={team.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => router.push("/dashboard/" + team.id)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                    currentTeam?.id === team.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-card hover:bg-muted border border-border'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{team.team_name}</h3>
                      {team.scoredAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          已評分於 {format(team.scoredAt, 'MM/dd HH:mm', { locale: zhTW })}
                        </p>
                      )}
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      team.canVote 
                        ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {team.canVote ? '可評分' : '已評分'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
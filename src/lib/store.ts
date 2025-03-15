import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Team {
  id: string
  name: string
  scores?: TeamScore
  timestamp?: number
}

export interface TeamScore {
  innovation: number
  execution: number
  presentation: number
}

interface ScoreState {
  currentTeam: Team | null
  scoredTeams: Team[]
  setCurrentTeam: (team: Team) => void
  updateCurrentTeamScore: (scoreKey: keyof TeamScore, value: number) => void
  submitScore: () => void
}

export const useScoreStore = create<ScoreState>()(
  persist(
    (set, get) => ({
      currentTeam: null,
      scoredTeams: [],
      
      setCurrentTeam: (team) => set({ currentTeam: team }),
      
      updateCurrentTeamScore: (scoreKey, value) => {
        const { currentTeam } = get()
        
        if (!currentTeam) return
        
        set({
          currentTeam: {
            ...currentTeam,
            scores: {
              ...currentTeam.scores,
              [scoreKey]: value,
            },
          },
        })
      },
      
      submitScore: () => {
        const { currentTeam, scoredTeams } = get()
        
        if (!currentTeam || !currentTeam.scores) return
        
        // Add timestamp to the scored team
        const scoredTeam = {
          ...currentTeam,
          timestamp: Date.now(),
        }
        
        // Add to scoredTeams, with newest at the beginning
        set({
          scoredTeams: [scoredTeam, ...scoredTeams],
          currentTeam: null,
        })
      },
    }),
    {
      name: 'scoring-system-storage',
    }
  )
) 
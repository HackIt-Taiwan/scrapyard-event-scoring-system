import { Team } from "./store"
import { v4 as uuidv4 } from "uuid"

// Simulated team data for demonstration
const demoTeams = [
  { id: uuidv4(), name: "隊伍 Alpha" },
  { id: uuidv4(), name: "隊伍 Beta" },
  { id: uuidv4(), name: "隊伍 Gamma" },
  { id: uuidv4(), name: "隊伍 Delta" },
  { id: uuidv4(), name: "隊伍 Epsilon" },
]

interface FetchTeamResponse {
  team: Team | null
  error?: string
}

/**
 * Simulates fetching a team from the API
 * In a real application, this would make a fetch request to a backend
 */
export async function fetchCurrentTeam(): Promise<FetchTeamResponse> {
  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    // Randomly decide whether to return a team or null (simulating no new team available)
    const shouldReturnTeam = Math.random() > 0.3
    
    if (!shouldReturnTeam) {
      return { team: null }
    }
    
    // Get a random team from the demo list
    const randomIndex = Math.floor(Math.random() * demoTeams.length)
    const team = { 
      ...demoTeams[randomIndex],
      id: uuidv4() // Generate a new ID to ensure uniqueness
    }
    
    return { team }
  } catch (error) {
    return { 
      team: null, 
      error: "Failed to fetch team data"
    }
  }
} 
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names and merges Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(timestamp: number): string {
  const now = Date.now()
  const diffInSeconds = Math.floor((now - timestamp) / 1000)
  
  if (diffInSeconds < 60) {
    return "剛剛"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} 分鐘前`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} 小時前`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} 天前`
  }
}

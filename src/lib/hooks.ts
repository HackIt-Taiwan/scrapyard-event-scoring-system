"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

export function useAuthCheck() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get("auth_token")
      
      if (!token) {
        router.push("/login")
        return
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [router])
  
  return { isLoading }
} 
"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/auth-store"

/**
 * Auth Provider Component
 * Checks and validates authentication state on app load
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    // Validate token and get user profile on mount
    checkAuth()
  }, [checkAuth])

  return <>{children}</>
}

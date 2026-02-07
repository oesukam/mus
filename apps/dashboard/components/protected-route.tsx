"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, isLoading, user, logout, isHydrated, checkAuth } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      // Wait for hydration
      if (!isHydrated) {
        return
      }

      // If we have a token, verify it's still valid
      if (isAuthenticated) {
        try {
          await checkAuth()
        } catch (error) {
          // checkAuth will handle clearing auth state if invalid
          console.error("Auth check failed:", error)
        }
      }

      setIsChecking(false)
    }

    initAuth()
  }, [isHydrated, isAuthenticated, checkAuth])

  useEffect(() => {
    if (!isLoading && !isChecking && isHydrated) {
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      // Check if user has required roles (admin or seller)
      if (user && user.roles) {
        const hasRequiredRole = user.roles.includes("admin") || user.roles.includes("seller")
        if (!hasRequiredRole) {
          // User doesn't have required role, log them out and redirect
          logout()
          router.push("/login?error=access_denied")
        }
      }
    }
  }, [isAuthenticated, isLoading, isChecking, isHydrated, user, router, logout])

  // Show loading during hydration or auth check
  if (!isHydrated || isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Double-check roles before rendering protected content
  if (user && user.roles) {
    const hasRequiredRole = user.roles.includes("admin") || user.roles.includes("seller")
    if (!hasRequiredRole) {
      return null
    }
  }

  return <>{children}</>
}

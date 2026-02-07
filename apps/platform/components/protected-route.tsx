"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Protected Route Component
 * Redirects to home page if user is not authenticated
 * Shows loading state while checking authentication
 */
export function ProtectedRoute({ children, redirectTo = "/" }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Wait a moment for the auth state to be hydrated from storage
    const timer = setTimeout(() => {
      setIsChecking(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isChecking && !isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isChecking, isLoading, isAuthenticated, router, redirectTo])

  if (isChecking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

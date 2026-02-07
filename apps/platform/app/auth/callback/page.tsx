"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Loader2 } from "lucide-react"
import type { AuthUser } from "@/lib/auth-api"

/**
 * OAuth Callback Page
 * Handles Google OAuth redirect and stores auth data
 */
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get token and user data from URL params
        const token = searchParams.get("token")
        const userStr = searchParams.get("user")

        if (!token || !userStr) {
          setError("Invalid authentication response. Please try again.")
          setTimeout(() => router.push("/"), 3000)
          return
        }

        // Parse user data
        const user: AuthUser = JSON.parse(decodeURIComponent(userStr))

        // Store token in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", token)
        }

        // Update auth store with user data and token
        useAuthStore.setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })

        // Redirect to home page
        router.push("/")
      } catch (err) {
        console.error("OAuth callback error:", err)
        setError("Failed to complete authentication. Please try again.")
        setTimeout(() => router.push("/"), 3000)
      }
    }

    handleOAuthCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-2xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Authentication Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <p className="mt-4 text-sm text-muted-foreground">Redirecting to home page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
        <h2 className="mb-2 text-xl font-semibold text-foreground">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we authenticate you</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <h2 className="mb-2 text-xl font-semibold text-foreground">Loading...</h2>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

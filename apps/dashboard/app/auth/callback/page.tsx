"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    const userStr = searchParams.get("user")

    if (!token || !userStr) {
      router.push("/login?error=auth_failed")
      return
    }

    try {
      const user = JSON.parse(decodeURIComponent(userStr))

      // Verify user has admin or seller role
      if (!user.roles || (!user.roles.includes("admin") && !user.roles.includes("seller"))) {
        console.warn("User does not have required roles:", user.roles)
        router.push("/login?error=access_denied")
        return
      }

      // Store token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_auth_token", token)
      }

      // Update auth store
      useAuthStore.setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to authenticate with Google:", error)
      router.push("/login?error=auth_failed")
    }
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}

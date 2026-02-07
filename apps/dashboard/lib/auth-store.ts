import { create } from "zustand"
import { persist } from "zustand/middleware"
import { authApi, type AdminUser } from "./auth-api"
import { ApiError } from "./api-client"

interface AuthStore {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isHydrated: false,

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated })
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login({ email, password })

          // Store token in localStorage for API client
          if (typeof window !== "undefined") {
            localStorage.setItem("admin_auth_token", response.accessToken)
          }

          set({
            user: response.user,
            token: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          let errorMessage = "Login failed. Please try again."

          if (error instanceof Error) {
            // Check if it's a role-based access error
            if (error.message.includes("Access denied") || error.message.includes("privileges required")) {
              errorMessage = "Access denied. You need admin or seller privileges to access this dashboard."
            } else if (error instanceof ApiError) {
              errorMessage = error.message
            } else {
              errorMessage = error.message
            }
          }

          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      logout: () => {
        // Clear token from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("admin_auth_token")
        }
        set({ user: null, token: null, isAuthenticated: false, error: null })
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false })
          return
        }

        set({ isLoading: true })
        try {
          const response = await authApi.getProfile(token)
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          // Token is invalid or expired, or user is not admin
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
          if (typeof window !== "undefined") {
            localStorage.removeItem("admin_auth_token")
          }
        }
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: "admin-auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Sync token with localStorage for API client
          if (state.token && typeof window !== "undefined") {
            localStorage.setItem("admin_auth_token", state.token)
          }
          // Mark as hydrated
          state.setHydrated(true)
        }
      },
    },
  ),
)

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { authApi, type AuthUser } from "./auth-api"
import { ApiError } from "./api-client"

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  loginWithGoogle: () => void
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login({ email, password })

          // Store token in localStorage for API client
          if (typeof window !== "undefined") {
            localStorage.setItem("auth_token", response.accessToken)
          }

          set({
            user: response.user,
            token: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof ApiError ? error.message : "Login failed. Please try again."
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.signup({ email, password, name })

          // Store token in localStorage for API client
          if (typeof window !== "undefined") {
            localStorage.setItem("auth_token", response.accessToken)
          }

          set({
            user: response.user,
            token: response.accessToken,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof ApiError ? error.message : "Signup failed. Please try again."
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      loginWithGoogle: () => {
        // Redirect to Google OAuth endpoint
        authApi.googleLogin()
      },

      logout: () => {
        // Clear token from localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token")
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
          // Token is invalid or expired
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
          if (typeof window !== "undefined") {
            localStorage.removeItem("auth_token")
          }
        }
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

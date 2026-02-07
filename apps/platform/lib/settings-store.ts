import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserSettings } from "./types"
import { settingsApi } from "./settings-api"
import { ApiError } from "./api-client"

interface SettingsStore extends UserSettings {
  isLoading: boolean
  error: string | null
  fetchSettings: () => Promise<void>
  updateNotificationSettings: (settings: Partial<UserSettings["notifications"]>) => Promise<void>
  updatePrivacySettings: (settings: Partial<UserSettings["privacy"]>) => Promise<void>
  updatePreferences: (settings: Partial<UserSettings["preferences"]>) => Promise<void>
  updateAllSettings: (settings: Partial<UserSettings>) => Promise<void>
  resetToDefaults: () => void
  clearError: () => void
}

const defaultSettings: UserSettings = {
  notifications: {
    orderUpdates: true,
    promotions: true,
    wishlistAlerts: true,
    newsletter: false,
  },
  privacy: {
    showProfile: true,
    shareData: false,
  },
  preferences: {
    currency: "USD",
    language: "en",
  },
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      isLoading: false,
      error: null,

      fetchSettings: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await settingsApi.getSettings()
          set({
            ...response.settings,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof ApiError ? error.message : "Failed to fetch settings"
          set({ error: errorMessage, isLoading: false })
        }
      },

      updateNotificationSettings: async (settings) => {
        set({ isLoading: true, error: null })
        try {
          const currentState = get()
          const updatedNotifications = { ...currentState.notifications, ...settings }

          const response = await settingsApi.updateSettings({
            notifications: updatedNotifications,
          })

          set({
            ...response.settings,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof ApiError ? error.message : "Failed to update settings"
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      updatePrivacySettings: async (settings) => {
        set({ isLoading: true, error: null })
        try {
          const currentState = get()
          const updatedPrivacy = { ...currentState.privacy, ...settings }

          const response = await settingsApi.updateSettings({
            privacy: updatedPrivacy,
          })

          set({
            ...response.settings,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof ApiError ? error.message : "Failed to update settings"
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      updatePreferences: async (settings) => {
        set({ isLoading: true, error: null })
        try {
          const currentState = get()
          const updatedPreferences = { ...currentState.preferences, ...settings }

          const response = await settingsApi.updateSettings({
            preferences: updatedPreferences,
          })

          set({
            ...response.settings,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof ApiError ? error.message : "Failed to update settings"
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      updateAllSettings: async (settings) => {
        set({ isLoading: true, error: null })
        try {
          const response = await settingsApi.updateSettings(settings)
          set({
            ...response.settings,
            isLoading: false,
          })
        } catch (error) {
          const errorMessage = error instanceof ApiError ? error.message : "Failed to update settings"
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      resetToDefaults: () => set(defaultSettings),

      clearError: () => set({ error: null }),
    }),
    {
      name: "settings-storage",
      partialize: (state) => ({
        notifications: state.notifications,
        privacy: state.privacy,
        preferences: state.preferences,
      }),
    },
  ),
)

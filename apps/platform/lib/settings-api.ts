/**
 * Settings API service
 * Handles all settings-related API calls to the backend
 */

import { apiClient } from './api-client'
import type { UserSettings } from './types'

export const settingsApi = {
  /**
   * Get user settings
   */
  async getSettings(): Promise<{ settings: UserSettings }> {
    return apiClient.get<{ settings: UserSettings }>('/api/v1/users/settings')
  },

  /**
   * Update user settings (partial update)
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<{ message: string; settings: UserSettings }> {
    return apiClient.patch<{ message: string; settings: UserSettings }>('/api/v1/users/settings', settings)
  },
}

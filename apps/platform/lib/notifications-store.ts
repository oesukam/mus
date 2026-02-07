import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Notification } from "./types"

interface NotificationsStore {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  removeNotification: (notificationId: string) => void
  clearAll: () => void
  getUnreadCount: () => number
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: "notif-1",
          type: "order",
          title: "Order Delivered",
          message: "Your order ORD-1704123456-ABC123 has been delivered successfully!",
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          link: "/orders/ORD-1704123456-ABC123",
        },
        {
          id: "notif-2",
          type: "order",
          title: "Order Shipped",
          message: "Your order ORD-1704567890-XYZ789 is on the way!",
          read: false,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          link: "/orders/ORD-1704567890-XYZ789/tracking",
        },
        {
          id: "notif-3",
          type: "promotion",
          title: "Special Offer",
          message: "Get 20% off on all electronics this weekend!",
          read: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          link: "/search?category=Electronics",
        },
        {
          id: "notif-4",
          type: "wishlist",
          title: "Price Drop Alert",
          message: "An item in your wishlist is now on sale!",
          read: false,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          link: "/wishlist",
        },
      ],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: `notif-${Date.now()}`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...state.notifications,
          ],
        })),
      markAsRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif,
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
        })),
      removeNotification: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.id !== notificationId),
        })),
      clearAll: () => set({ notifications: [] }),
      getUnreadCount: () => {
        const { notifications } = get()
        return notifications.filter((notif) => !notif.read).length
      },
    }),
    {
      name: "notifications-storage",
    },
  ),
)

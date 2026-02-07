"use client"

import type React from "react"

import { Bell, Package, Tag, Heart, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { useNotificationsStore } from "@/lib/notifications-store"
import { formatDistanceToNow } from "date-fns"
import type { NotificationType } from "@/lib/types"
import Link from "next/link"

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  order: <Package className="h-5 w-5" />,
  promotion: <Tag className="h-5 w-5" />,
  wishlist: <Heart className="h-5 w-5" />,
  system: <Info className="h-5 w-5" />,
}

export default function NotificationsPage() {
  const notifications = useNotificationsStore((state) => state.notifications)
  const unreadCount = useNotificationsStore((state) => state.getUnreadCount())
  const markAsRead = useNotificationsStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead)
  const removeNotification = useNotificationsStore((state) => state.removeNotification)

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">You have {unreadCount} unread notifications</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                When you receive notifications about orders, promotions, or wishlist items, they'll appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-colors ${!notification.read ? "border-primary/50 bg-accent/20" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === "order"
                          ? "bg-blue-100 text-blue-600"
                          : notification.type === "promotion"
                            ? "bg-green-100 text-green-600"
                            : notification.type === "wishlist"
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          onClick={() => handleNotificationClick(notification.id)}
                          className="block group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-base font-semibold group-hover:text-primary transition-colors">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="flex-shrink-0 h-2 w-2 bg-primary rounded-full mt-2" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </Link>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-base font-semibold">{notification.title}</h3>
                            {!notification.read && (
                              <span className="flex-shrink-0 h-2 w-2 bg-primary rounded-full mt-2" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

"use client"

import type React from "react"

import { Bell, Package, Tag, Heart, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useNotificationsStore } from "@/lib/notifications-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { NotificationType } from "@/lib/types"

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  order: <Package className="h-4 w-4" />,
  promotion: <Tag className="h-4 w-4" />,
  wishlist: <Heart className="h-4 w-4" />,
  system: <Info className="h-4 w-4" />,
}

export function NotificationsDropdown() {
  const notifications = useNotificationsStore((state) => state.notifications)
  const unreadCount = useNotificationsStore((state) => state.getUnreadCount())
  const markAsRead = useNotificationsStore((state) => state.markAsRead)
  const markAllAsRead = useNotificationsStore((state) => state.markAllAsRead)
  const removeNotification = useNotificationsStore((state) => state.removeNotification)

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full"
              suppressHydrationWarning
            >
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-xs"
              suppressHydrationWarning
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]" suppressHydrationWarning>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y" suppressHydrationWarning>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 transition-colors ${!notification.read ? "bg-accent/20" : ""}`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
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
                          className="block"
                        >
                          <h4 className="text-sm font-medium mb-1">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground mb-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </Link>
                      ) : (
                        <>
                          <h4 className="text-sm font-medium mb-1">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground mb-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 flex-shrink-0"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="border-t p-2" suppressHydrationWarning>
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/notifications">View all notifications</Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

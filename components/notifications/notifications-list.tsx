"use client"
import { useNotifications } from "@/hooks/use-notifications"
import { NotificationItem } from "./notification-item"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

export function NotificationsList() {
  const { notifications, isLoading, markAsRead, deleteNotification } = useNotifications()
  const router = useRouter()

  const handleNotificationClick = (notification: any) => {
    if (notification.link) {
      router.push(notification.link)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start space-x-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
          <span className="text-2xl">🔔</span>
        </div>
        <p className="text-muted-foreground mb-2">Nenhuma notificação ainda.</p>
        <p className="text-sm text-muted-foreground">
          Você receberá notificações sobre vagas e atualizações importantes aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={() => handleNotificationClick(notification)}
          onMarkAsRead={markAsRead}
          onDelete={deleteNotification}
        />
      ))}
    </div>
  )
}

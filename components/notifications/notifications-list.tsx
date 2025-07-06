"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Trash2, CheckCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Notification } from "@/types/notification"
import { NotificationItem } from "./notification-item"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications } from "@/hooks/use-notifications"

interface NotificationsListProps {
  userId: string
}

export function NotificationsList({ userId }: NotificationsListProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const router = useRouter()
  const { notifications, isLoading, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications()

  const filteredNotifications = filter === "all" ? notifications : notifications.filter((n) => !n.is_read)

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    if (notification.link) {
      router.push(notification.link)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">Você não tem notificações</p>
        <p className="text-sm text-muted-foreground">Quando houver novidades, elas aparecerão aqui</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">Não lidas</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="text-xs h-8">
            <CheckCheck className="w-3 h-3 mr-1" />
            Marcar todas
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} className="text-xs h-8">
            <Trash2 className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma notificação {filter === "unread" ? "não lida" : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
              onMarkAsRead={() => markAsRead(notification.id)}
              onDelete={() => deleteNotification(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

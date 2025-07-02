"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Notification {
  id: string
  title: string
  content: string
  is_read: boolean
  created_at: string
}

interface NotificationsListProps {
  userId: string
}

export function NotificationsList({ userId }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar notificações:", error)
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

      if (!error) {
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === notificationId ? { ...notif, is_read: true } : notif)),
        )
      }
    } catch (error) {
      console.error("Erro ao marcar como lida:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

      if (!error) {
        setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId))
      }
    } catch (error) {
      console.error("Erro ao deletar notificação:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhuma notificação encontrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 cursor-pointer transition-colors ${
            notification.is_read ? "bg-white" : "bg-blue-50 border-blue-200"
          }`}
          onClick={() => !notification.is_read && markAsRead(notification.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{notification.title}</h3>
                {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{notification.content}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), {
                  locale: ptBR,
                  addSuffix: true,
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                deleteNotification(notification.id)
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Trash2, MessageCircle, Briefcase, Bell, FileText } from "lucide-react"
import type { Notification } from "@/types/notification"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface NotificationItemProps {
  notification: Notification
  onClick: () => void
  onMarkAsRead: () => void
  onDelete: () => void
}

export function NotificationItem({ notification, onClick, onMarkAsRead, onDelete }: NotificationItemProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment_reply":
        return <MessageCircle className="w-5 h-5 text-blue-500" />
      case "job_match":
        return <Briefcase className="w-5 h-5 text-green-500" />
      case "new_application":
        return <FileText className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch (error) {
      return "recentemente"
    }
  }

  return (
    <Card
      className={`${notification.is_read ? "bg-white" : "bg-blue-50"} hover:bg-gray-50 transition-colors cursor-pointer`}
    >
      <CardContent className="p-4" onClick={onClick}>
        <div className="flex gap-3">
          <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-sm">{notification.title}</h3>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                {formatTime(notification.created_at)}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mt-1">{notification.content}</p>

            <div className="flex justify-end gap-2 mt-2">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkAsRead()
                  }}
                  className="h-7 text-xs"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Marcar como lida
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

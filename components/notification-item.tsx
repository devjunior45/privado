"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface NotificationItemProps {
  notification: {
    id: string
    title: string
    content: string
    is_read: boolean
    created_at: string
  }
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const queryClient = useQueryClient()

  const { mutate: deleteNotification, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      await api.delete(`/notifications/${notification.id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Notificação apagada!")
    },
    onError: () => {
      toast.error("Falha ao apagar notificação!")
    },
  })

  return (
    <Card
      className={`${notification.is_read ? "bg-white dark:bg-background" : "bg-blue-50 dark:bg-blue-950/20"} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer`}
    >
      <div className="flex items-center gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-bold text-sm">{notification.title}</h1>
          <p className="text-xs text-muted-foreground line-clamp-1">{notification.content}</p>
          <time className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), {
              locale: ptBR,
              addSuffix: true,
            })}
          </time>
        </div>

        <Button
          variant={"ghost"}
          className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-gray-800"
          onClick={() => deleteNotification()}
          disabled={isDeleting}
        >
          Apagar
        </Button>
      </div>
    </Card>
  )
}

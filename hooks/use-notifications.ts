"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@/types/notification"

// Global subscription manager to prevent multiple subscriptions
const subscriptionManager = {
  channel: null as any,
  subscribers: new Set<string>(),
  isSubscribed: false,
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()
  const hookId = useRef(Math.random().toString(36).substr(2, 9))

  const handleRealtimeUpdate = useCallback(
    (payload: any) => {
      // Verificar se a notificação é para o usuário atual
      if (payload.new?.user_id !== currentUserId && payload.old?.user_id !== currentUserId) {
        return
      }

      if (payload.eventType === "INSERT") {
        const newNotification = payload.new as Notification
        setNotifications((prev) => [newNotification, ...prev])
        setUnreadCount((prev) => prev + 1)
        showBrowserNotification(newNotification)
      } else if (payload.eventType === "UPDATE") {
        const updatedNotification = payload.new as Notification
        setNotifications((prev) => prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n)))

        const oldNotification = payload.old as Notification
        if (oldNotification.is_read !== updatedNotification.is_read) {
          setUnreadCount((prev) => (updatedNotification.is_read ? prev - 1 : prev + 1))
        }
      } else if (payload.eventType === "DELETE") {
        const deletedNotification = payload.old as Notification
        setNotifications((prev) => prev.filter((n) => n.id !== deletedNotification.id))

        if (!deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      }
    },
    [currentUserId],
  )

  const setupGlobalSubscription = useCallback(async () => {
    if (subscriptionManager.isSubscribed || !currentUserId) return

    try {
      // Criar canal global para notificações
      const channel = supabase.channel("notifications-global").on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        handleRealtimeUpdate,
      )

      // Aguardar a subscription ser estabelecida
      const subscriptionStatus = await new Promise((resolve) => {
        channel.subscribe((status) => {
          resolve(status)
        })
      })

      if (subscriptionStatus === "SUBSCRIBED") {
        subscriptionManager.channel = channel
        subscriptionManager.isSubscribed = true
        console.log("Subscription estabelecida com sucesso")
      }
    } catch (error) {
      console.error("Erro ao configurar subscription:", error)
    }
  }, [supabase, handleRealtimeUpdate, currentUserId])

  useEffect(() => {
    async function initializeNotifications() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setNotifications([])
          setUnreadCount(0)
          setIsLoading(false)
          setCurrentUserId(null)
          return
        }

        setCurrentUserId(user.id)

        // Buscar notificações
        const { data: notificationsData } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)

        // Contar não lidas
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false)

        setNotifications(notificationsData || [])
        setUnreadCount(count || 0)

        // Registrar este hook como subscriber
        subscriptionManager.subscribers.add(hookId.current)

        // Configurar subscription global se ainda não existir
        await setupGlobalSubscription()
      } catch (error) {
        console.error("Erro ao inicializar notificações:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeNotifications()

    return () => {
      // Remover este hook dos subscribers
      subscriptionManager.subscribers.delete(hookId.current)

      // Se não há mais subscribers, limpar a subscription
      if (subscriptionManager.subscribers.size === 0 && subscriptionManager.channel) {
        supabase.removeChannel(subscriptionManager.channel)
        subscriptionManager.channel = null
        subscriptionManager.isSubscribed = false
        console.log("Subscription removida - sem mais subscribers")
      }
    }
  }, [supabase, setupGlobalSubscription])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setNotifications([])
        setUnreadCount(0)
        return
      }

      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false)

      setNotifications(notificationsData || [])
      setUnreadCount(count || 0)
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId).eq("user_id", user.id)

      // Atualizar estado local imediatamente
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false)

      // Atualizar estado local
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from("notifications").delete().eq("id", notificationId).eq("user_id", user.id)

      // Atualizar estado local
      const notification = notifications.find((n) => n.id === notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))

      if (notification && !notification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Erro ao excluir notificação:", error)
    }
  }

  const clearAll = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from("notifications").delete().eq("user_id", user.id)

      // Atualizar estado local
      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error("Erro ao limpar todas notificações:", error)
    }
  }

  // Função para mostrar notificação do navegador
  const showBrowserNotification = (notification: Notification) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.content,
          icon: "/icon-192x192.png",
        })
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission()
      }
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications,
  }
}

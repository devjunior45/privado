"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Notification } from "@/types/notification"

export async function getNotifications() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("Erro ao buscar notificações:", error)
    return []
  }

  return notifications as Notification[]
}

export async function getUnreadNotificationsCount() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return 0
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    console.error("Erro ao buscar contagem de notificações:", error)
    return 0
  }

  return count || 0
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Erro ao marcar notificação como lida:", error)
    throw new Error("Erro ao marcar notificação como lida")
  }

  revalidatePath("/notifications")
}

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    console.error("Erro ao marcar todas notificações como lidas:", error)
    throw new Error("Erro ao marcar todas notificações como lidas")
  }

  revalidatePath("/notifications")
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { error } = await supabase.from("notifications").delete().eq("id", notificationId).eq("user_id", user.id)

  if (error) {
    console.error("Erro ao excluir notificação:", error)
    throw new Error("Erro ao excluir notificação")
  }

  revalidatePath("/notifications")
}

export async function clearAllNotifications() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { error } = await supabase.from("notifications").delete().eq("user_id", user.id)

  if (error) {
    console.error("Erro ao limpar todas notificações:", error)
    throw new Error("Erro ao limpar todas notificações")
  }

  revalidatePath("/notifications")
}

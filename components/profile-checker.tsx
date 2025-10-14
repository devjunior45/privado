"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function ProfileChecker() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkProfile()
  }, [pathname])

  const checkProfile = async () => {
    // Rotas que não precisam de verificação
    const exemptRoutes = [
      "/login",
      "/complete-profile",
      "/complete-profile-info",
      "/setup-account",
      "/confirm-email",
      "/forgot-password",
      "/reset-password",
      "/auth/callback",
    ]

    if (exemptRoutes.some((route) => pathname.startsWith(route))) {
      return
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return // Não logado, deixa outras proteções lidarem
    }

    // Buscar perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, city_id, user_type")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return
    }

    // Verificar se falta alguma informação obrigatória
    const needsName = !profile.full_name || profile.full_name.trim() === ""
    const needsCity = !profile.city_id
    const needsUserType = !profile.user_type

    if (needsUserType) {
      // Sem tipo de usuário, vai para setup completo
      router.push("/setup-account")
    } else if (needsName || needsCity) {
      // Falta nome ou cidade, vai para complete-profile-info
      router.push("/complete-profile-info")
    }
  }

  return null
}

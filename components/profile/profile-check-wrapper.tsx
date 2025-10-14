"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CompleteProfileModal } from "./complete-profile-modal"

export function ProfileCheckWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [missingField, setMissingField] = useState<"name" | "city" | null>(null)
  const [currentName, setCurrentName] = useState("")
  const [currentCityId, setCurrentCityId] = useState<number | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Páginas que não precisam de verificação
  const excludedPaths = [
    "/login",
    "/auth",
    "/complete-profile",
    "/confirm-email",
    "/forgot-password",
    "/reset-password",
  ]

  useEffect(() => {
    async function checkProfile() {
      // Não verificar em páginas excluídas
      if (excludedPaths.some((path) => pathname?.startsWith(path))) {
        setIsChecking(false)
        return
      }

      const supabase = createClient()

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsChecking(false)
          return
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("full_name, city_id")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Erro ao buscar perfil:", error)
          setIsChecking(false)
          return
        }

        setCurrentName(profile?.full_name || "")
        setCurrentCityId(profile?.city_id || null)

        // Verificar campos obrigatórios
        if (!profile?.full_name || profile.full_name.trim() === "") {
          setMissingField("name")
          setIsOpen(true)
        } else if (!profile?.city_id) {
          setMissingField("city")
          setIsOpen(true)
        }
      } catch (err) {
        console.error("Erro na verificação do perfil:", err)
      } finally {
        setIsChecking(false)
      }
    }

    checkProfile()
  }, [pathname])

  const handleComplete = () => {
    setIsOpen(false)

    // Verificar se precisa do próximo modal
    setTimeout(async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, city_id")
          .eq("id", user.id)
          .single()

        if (profile) {
          // Se completou o nome, verificar cidade
          if (missingField === "name" && !profile.city_id) {
            setCurrentCityId(profile.city_id)
            setMissingField("city")
            setIsOpen(true)
          }
          // Se completou a cidade e não tinha nome
          else if (missingField === "city" && (!profile.full_name || profile.full_name.trim() === "")) {
            setCurrentName(profile.full_name)
            setMissingField("name")
            setIsOpen(true)
          }
        }
      }
    }, 500)
  }

  if (isChecking) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <CompleteProfileModal
        isOpen={isOpen}
        missingField={missingField}
        currentName={currentName}
        currentCityId={currentCityId}
        onComplete={handleComplete}
      />
    </>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export function SettingsDropdown() {
  const router = useRouter()

  const handleOpenSettings = () => {
    router.push("/settings")
  }

  return (
    <Button
      variant="ghost"
      onClick={handleOpenSettings}
      className="w-full justify-start text-left px-3 py-3 h-auto text-sm hover:bg-muted"
    >
      <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
      <span className="truncate">Configurações</span>
    </Button>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Settings, User, Shield, Eye, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useMobile } from "@/hooks/use-mobile"

export function SettingsSheet() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const isMobile = useMobile()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    setOpen(false)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  const handleSettingsClick = () => {
    if (isMobile) {
      // No mobile, vai direto para a página de settings
      router.push("/settings")
    } else {
      // No desktop, abre o sheet
      setOpen(true)
    }
  }

  if (isMobile) {
    // No mobile, renderiza apenas o botão que navega diretamente
    return (
      <Button variant="ghost" size="sm" onClick={handleSettingsClick}>
        <Settings className="w-5 h-5" />
      </Button>
    )
  }

  // No desktop, renderiza o sheet completo
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Configurações</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-1">
          <Button
            variant="ghost"
            onClick={() => handleNavigation("/profile")}
            className="w-full justify-start text-left px-3 py-3 h-auto text-sm hover:bg-muted"
          >
            <User className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Perfil</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleNavigation("/settings")}
            className="w-full justify-start text-left px-3 py-3 h-auto text-sm hover:bg-muted"
          >
            <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Configurações</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleNavigation("/settings#privacy")}
            className="w-full justify-start text-left px-3 py-3 h-auto text-sm hover:bg-muted"
          >
            <Eye className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Privacidade</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleNavigation("/settings#security")}
            className="w-full justify-start text-left px-3 py-3 h-auto text-sm hover:bg-muted"
          >
            <Shield className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Segurança</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-left px-3 py-3 h-auto text-sm hover:bg-muted text-red-600 hover:text-red-700"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="truncate">Sair</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

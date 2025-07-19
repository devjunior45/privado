"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function SettingsDropdown() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })

      router.push("/login")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer logout.",
        variant: "destructive",
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-left px-3 py-3 h-auto text-sm hover:bg-muted">
          <Settings className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="truncate">Configurações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoggingOut ? "Saindo..." : "Sair da conta"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

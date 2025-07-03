"use client"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Settings, LogOut, Moon, Sun } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useState } from "react"

export function SettingsSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push("/")
    router.refresh()
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          <Settings className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle className="text-center">Configurações</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <Button
            variant="outline"
            onClick={toggleTheme}
            className="w-full justify-start text-left h-12 bg-transparent"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5 mr-3" />
                Ativar modo claro
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 mr-3" />
                Ativar modo escuro
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start text-left h-12 text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair da conta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

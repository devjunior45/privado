"use client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SettingsSheet } from "@/components/ui/settings-sheet"

interface HeaderProps {
  title?: string
  showBack?: boolean
  userProfile?: any
  isLoggedIn?: boolean
  showSettings?: boolean
}

export function Header({
  title,
  showBack = false,
  userProfile,
  isLoggedIn = false,
  showSettings = false,
}: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleBack = () => {
    router.back()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          {title && <h1 className="font-semibold">{title}</h1>}
        </div>

        <div className="flex items-center gap-2">
          {showSettings && isLoggedIn && <SettingsSheet />}
          {!showSettings && isLoggedIn && (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="p-2">
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

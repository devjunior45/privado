"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { SettingsSheet } from "@/components/ui/settings-sheet"
import { useNotifications } from "@/hooks/use-notifications"

interface HeaderProps {
  title?: string
  showBack?: boolean
  showSearch?: boolean
  showSettings?: boolean
  isLoggedIn?: boolean
  userProfile?: {
    avatar_url?: string | null
    full_name?: string | null
    username?: string | null
  } | null
}

export function Header({
  title = "Galeria Empregos",
  showBack = false,
  showSearch = false,
  showSettings = false,
  isLoggedIn = false,
  userProfile = null,
}: HeaderProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const { unreadCount } = useNotifications()

  const handleBack = () => {
    router.back()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/feed?q=${encodeURIComponent(searchTerm)}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="max-w-md mx-auto flex h-14 items-center px-4">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2 h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-lg font-semibold truncate">{title}</h1>

          <div className="flex items-center gap-2">
            {showSearch && (
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 w-32 pl-8 text-sm"
                  />
                </div>
              </form>
            )}

            {isLoggedIn && (
              <>
                {userProfile && (
                  <Avatar className="h-8 w-8 cursor-pointer" onClick={() => router.push("/profile")}>
                    <AvatarImage src={userProfile.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="text-xs">
                      {(userProfile.full_name || userProfile.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </>
            )}

            

            {!isLoggedIn && (
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")} className="h-8 px-3 text-sm">
                Entrar
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

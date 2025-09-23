"use client"

import type React from "react"
import { Search, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { CitySelect } from "@/components/ui/city-select"

interface DesktopHeaderProps {
  user?: any
  className?: string
}

export function DesktopHeader({ user, className }: DesktopHeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)

      return count || 0
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/feed?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 ${className}`}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/feed")}
            className="font-bold text-lg text-blue-600 hover:text-blue-700 p-0"
          >
            GaleriaEmpregos
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar vagas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </form>
        </div>

        {/* City Select */}
        <div className="hidden md:block">
          <CitySelect />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => router.push("/feed")} className="text-sm font-medium px-3">
            Vagas
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/saved")} className="text-sm font-medium px-3">
            Salvos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/applications")}
            className="text-sm font-medium px-3"
          >
            Candidaturas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/notifications")}
            className="relative text-sm font-medium px-3"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* User Avatar */}
        {user ? (
          <Avatar className="h-8 w-8 cursor-pointer" onClick={() => router.push("/profile")}>
            <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="text-xs">
              {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Button variant="outline" size="sm" onClick={() => router.push("/login")} className="text-sm">
            <User className="h-4 w-4 mr-1" />
            Entrar
          </Button>
        )}
      </div>
    </header>
  )
}

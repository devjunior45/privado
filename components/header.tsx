"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface BasicUser {
  full_name?: string | null
  username: string
}

interface HeaderProps {
  /**
   * Old prop - kept for backward-compatibility.
   * Used by pages that already fetch the logged-in user.
   */
  user?: BasicUser
  /**
   * New prop – full profile of the logged-in user (or the profile being viewed).
   */
  userProfile?: BasicUser | null
  /** Whether the visitor is authenticated (used to decide if the LogOut button shows). */
  isLoggedIn?: boolean
  /** Show a back arrow on the left (e.g. when viewing someone else’s profile). */
  showBackButton?: boolean
  /** Override the centre/left title text. */
  title?: string
  /** Optional extra CSS classes. */
  className?: string
}

export function Header({
  user,
  userProfile,
  isLoggedIn = false,
  showBackButton = false,
  title,
  className,
}: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  // Prefer explicit title, otherwise fall back to profile name, otherwise site name.
  const heading = title ?? userProfile?.full_name ?? userProfile?.username ?? "Empregos"

  const displayUser = user ?? userProfile ?? null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header
      className={cn("px-4 md:px-6 py-3 flex items-center justify-between h-14 border-b bg-background", className)}
    >
      <div className="flex items-center gap-2 min-w-0">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 shrink-0">
            <ChevronLeft className="w-4 h-4" />
            <span className="sr-only">Voltar</span>
          </Button>
        )}

        <h1 className={cn("text-xl font-bold truncate", showBackButton ? "" : "text-primary")}>{heading}</h1>
      </div>

      {isLoggedIn && displayUser && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:block text-sm text-muted-foreground truncate max-w-[10rem]">
            Olá, {displayUser.full_name || displayUser.username}
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8">
            <LogOut className="w-4 h-4" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      )}
    </header>
  )
}

"use client"
import { Button } from "@/components/ui/button"
import React from "react"
import { Search, User, Briefcase, LayoutDashboard, Bookmark, Bell } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useTransition, useState, useEffect, useCallback } from "react"
import { UserTypeDialog } from "./auth/user-type-dialog"
import { useNotifications } from "@/hooks/use-notifications"

interface NavigationProps {
  isLoggedIn: boolean
  userProfile: {
    city_id?: number | null
    user_type?: string | null
    username?: string | null
  } | null
}

export function Navigation({ isLoggedIn, userProfile }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<string>("")
  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false)
  const [clickedButton, setClickedButton] = useState<string | null>(null)

  const { unreadCount } = useNotifications()
  const displayUnreadCount = isLoggedIn ? unreadCount : 0

  // Verificar se está visualizando perfil de outra pessoa
  const isOwnProfile =
    pathname === "/profile" || (userProfile?.username && pathname === `/profile/${userProfile.username}`)

  useEffect(() => {
    if (pathname === "/feed" || pathname === "/" || pathname.startsWith("/job/")) {
      setActiveTab("opportunities")
    } else if (isOwnProfile) {
      setActiveTab("profile")
    } else if (pathname.startsWith("/applications")) {
      setActiveTab("applications")
    } else if (pathname.startsWith("/notifications")) {
      setActiveTab("notifications")
    } else if (pathname.startsWith("/dashboard")) {
      setActiveTab("dashboard")
    } else if (pathname.startsWith("/saved")) {
      setActiveTab("saved")
    } else {
      setActiveTab("")
    }
  }, [pathname, isOwnProfile])

  const tabs = React.useMemo(() => {
    const baseTabs = [
      { id: "opportunities", label: "Vagas", icon: Search, path: "/feed" },
      { id: "saved", label: "Salvos", icon: Bookmark, path: "/saved" },
    ]

    if (isLoggedIn) {
      if (userProfile?.user_type === "candidate") {
        baseTabs.push(
          { id: "applications", label: "Candidaturas", icon: Briefcase, path: "/applications" },
          {
            id: "notifications",
            label: "Notificações",
            icon: Bell,
            path: "/notifications",
            badge: displayUnreadCount > 0 ? displayUnreadCount : undefined,
          },
        )
      } else if (userProfile?.user_type === "recruiter") {
        baseTabs.push(
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
          {
            id: "notifications",
            label: "Notificações",
            icon: Bell,
            path: "/notifications",
            badge: displayUnreadCount > 0 ? displayUnreadCount : undefined,
          },
        )
      }
      baseTabs.push({ id: "profile", label: "Perfil", icon: User, path: "/profile" })
    } else {
      // Para usuários não logados, mostrar todas as opções
      baseTabs.push(
        { id: "applications", label: "Candidaturas", icon: Briefcase, path: "/applications" },
        { id: "notifications", label: "Notificações", icon: Bell, path: "/notifications" },
        { id: "profile", label: "Perfil", icon: User, path: "/profile" },
      )
    }

    return baseTabs
  }, [isLoggedIn, userProfile?.user_type, displayUnreadCount])

  useEffect(() => {
    tabs.forEach((tab) => {
      if (tab.path) router.prefetch(tab.path)
    })
  }, [router, tabs])

  const handleNavigation = useCallback(
    (tab: (typeof tabs)[0]) => {
      // Feedback visual de clique
      setClickedButton(tab.id)
      setTimeout(() => setClickedButton(null), 150)

      if (activeTab === tab.id && pathname === tab.path) return

      setActiveTab(tab.id)
      startTransition(() => {
        router.push(tab.path)
      })
    },
    [activeTab, pathname, router],
  )

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="max-w-md mx-auto px-2 py-1">
          <div className="flex justify-around">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isClicked = clickedButton === tab.id
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(tab)}
                  className={`flex flex-col items-center gap-1 h-auto py-2 relative flex-1 transition-all duration-150 ${
                    isClicked ? "scale-95 bg-muted" : ""
                  }`}
                  disabled={isPending && activeTab === tab.id}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] leading-tight">{tab.label}</span>
                  {tab.badge && (
                    <span className="absolute top-0 right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </div>
      </nav>
      <UserTypeDialog open={isUserTypeDialogOpen} onOpenChange={setIsUserTypeDialogOpen} />
    </>
  )
}

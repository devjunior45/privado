"use client"
import { Button } from "@/components/ui/button"
import React from "react"

import { Input } from "@/components/ui/input"
import { Search, User, Briefcase, LogIn, LayoutDashboard, Bookmark, Bell, MapPin } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect, useCallback } from "react"
import { UserTypeDialog } from "./auth/user-type-dialog"
import { createClient } from "@/lib/supabase/client"
import { useNotifications } from "@/hooks/use-notifications"
import useMobile from "@/hooks/use-mobile"
import { CityModal } from "@/components/ui/city-modal"
import { useCities } from "@/hooks/use-cities"
import { formatCityDisplay } from "@/utils/city-utils"

interface NavigationProps {
  isLoggedIn: boolean
  userProfile: {
    city_id?: number | null
    user_type?: string | null
    username?: string | null
  } | null
}

export function Navigation({ isLoggedIn, userProfile }: NavigationProps) {
  const isMobile = useMobile()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<string>("")
  const [isUserTypeDialogOpen, setIsUserTypeDialogOpen] = useState(false)
  const [isCityModalOpen, setIsCityModalOpen] = useState(false)
  const [clickedButton, setClickedButton] = useState<string | null>(null)

  const supabase = createClient()
  const { cities } = useCities()

  const { unreadCount } = useNotifications()
  const displayUnreadCount = isLoggedIn ? unreadCount : 0

  // Sidebar specific states
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState("")
  const [sidebarSelectedCityId, setSidebarSelectedCityId] = useState<number | null>(null)

  // Verificar se está visualizando perfil de outra pessoa
  const isViewingOtherProfile = pathname.startsWith("/profile/") && pathname !== "/profile"
  const isOwnProfile =
    pathname === "/profile" || (userProfile?.username && pathname === `/profile/${userProfile.username}`)

  useEffect(() => {
    const currentSearch = searchParams.get("q") || ""
    const currentCityParam = searchParams.get("city")

    setSidebarSearchTerm(currentSearch)

    let initialCityId = null
    if (currentCityParam) {
      initialCityId = Number.parseInt(currentCityParam)
    } else if (!isMobile && userProfile?.city_id && (pathname === "/feed" || pathname === "/")) {
      initialCityId = userProfile.city_id
    }
    setSidebarSelectedCityId(initialCityId)
  }, [searchParams, isMobile, userProfile, pathname])

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
    const baseTabs = [{ id: "opportunities", label: "Vagas", icon: Search, path: "/feed" }]

    if (isLoggedIn) {
      const loggedInTabs = [...baseTabs, { id: "saved", label: "Salvos", icon: Bookmark, path: "/saved" }]
      if (userProfile?.user_type === "candidate") {
        loggedInTabs.push(
          { id: "applications", label: "Candidaturas", icon: Briefcase, path: "/applications" },
          { id: "notifications", label: "Notificações", icon: Bell, path: "/notifications", badge: displayUnreadCount },
        )
      } else if (userProfile?.user_type === "recruiter") {
        loggedInTabs.push(
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
          { id: "notifications", label: "Notificações", icon: Bell, path: "/notifications", badge: displayUnreadCount },
        )
      }
      loggedInTabs.push({ id: "profile", label: "Perfil", icon: User, path: "/profile" })
      return loggedInTabs
    } else {
      return [...baseTabs, { id: "login", label: "Entrar", icon: LogIn, path: "/login" }]
    }
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

      if (!isLoggedIn && ["profile", "applications", "dashboard", "saved", "notifications"].includes(tab.id)) {
        setIsUserTypeDialogOpen(true)
        return
      }

      // Para desktop, se clicar em "Vagas", abrir a caixa de pesquisa também
      if (!isMobile && tab.id === "opportunities") {
        setIsSearchExpanded(true)
      }

      if (activeTab === tab.id && pathname === tab.path) return

      setActiveTab(tab.id)
      startTransition(() => {
        router.push(tab.path)
      })
    },
    [isLoggedIn, activeTab, pathname, router, isMobile],
  )

  const handleSidebarCityChange = (cityId: number | null) => {
    setSidebarSelectedCityId(cityId)
    const newParams = new URLSearchParams(searchParams.toString())
    if (cityId) {
      newParams.set("city", cityId.toString())
    } else {
      newParams.delete("city")
    }
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
  }

  const handleSidebarSearch = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    const newParams = new URLSearchParams(searchParams.toString())
    if (sidebarSearchTerm) {
      newParams.set("q", sidebarSearchTerm)
    } else {
      newParams.delete("q")
    }
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
    if (!isMobile) setIsSearchExpanded(false)
  }

  const selectedCity = cities.find((city) => city.id === sidebarSelectedCityId)

  if (isMobile) {
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
                    {tab.badge && tab.badge > 0 && (
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

  // Desktop Layout - Instagram Style
  return (
    <>
      {/* Left Sidebar - Instagram Style */}
      <nav className="hidden md:fixed md:top-0 md:left-0 md:h-full md:w-64 bg-background border-r-2 border-border z-[60] md:flex md:flex-col shadow-sm">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div
            className="text-xl font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors"
            onClick={() => router.push("/")}
          >
            Galeria Empregos
          </div>
        </div>

        {/* City Selection */}
        <div className="p-4 border-b border-border">
          <Button
            variant="outline"
            onClick={() => setIsCityModalOpen(true)}
            className="w-full justify-start text-left px-3 py-2 h-auto text-sm hover:bg-muted transition-colors"
          >
            <MapPin className="w-4 h-4 mr-3 flex-shrink-0" />
            <span className="truncate">{selectedCity ? formatCityDisplay(selectedCity) : "Selecionar cidade..."}</span>
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isClicked = clickedButton === tab.id
            return (
              <div key={tab.id}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(tab)}
                  className={`w-full justify-start text-left px-3 py-3 h-auto text-sm relative transition-all duration-150 hover:bg-muted ${
                    isClicked ? "scale-95 bg-muted" : ""
                  }`}
                  disabled={isPending && activeTab === tab.id}
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </Button>

                {/* Search Box - Shows right below Vagas button when expanded */}
                {tab.id === "opportunities" && isSearchExpanded && activeTab === "opportunities" && (
                  <div className="mt-2 p-3 bg-muted/30 rounded-md border">
                    <form onSubmit={handleSidebarSearch} className="space-y-2">
                      <Input
                        type="search"
                        placeholder="Cargo, empresa..."
                        value={sidebarSearchTerm}
                        onChange={(e) => setSidebarSearchTerm(e.target.value)}
                        className="w-full text-sm h-9"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" className="flex-1 h-9">
                          Buscar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsSearchExpanded(false)}
                          className="h-9"
                        >
                          ✕
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* City Modal */}
      <CityModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        value={sidebarSelectedCityId}
        onValueChange={handleSidebarCityChange}
      />

      <UserTypeDialog open={isUserTypeDialogOpen} onOpenChange={setIsUserTypeDialogOpen} />
    </>
  )
}

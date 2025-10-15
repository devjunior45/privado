"use client"
import { Button } from "@/components/ui/button"
import type React from "react"

import { Input } from "@/components/ui/input"
import { Search, Bookmark, Briefcase, MapPin, User, X, Bell } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { CityModal } from "@/components/ui/city-modal"
import { useCities } from "@/hooks/use-cities"
import { formatCityDisplay } from "@/utils/city-utils"
import { useNotifications } from "@/hooks/use-notifications"

interface DesktopHeaderProps {
  isLoggedIn: boolean
  userProfile: {
    city_id?: number | null
    user_type?: string | null
    username?: string | null
  } | null
}

export function DesktopHeader({ isLoggedIn, userProfile }: DesktopHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { cities } = useCities()
  const { unreadCount } = useNotifications()

  const [searchValue, setSearchValue] = useState("")
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [isCityModalOpen, setIsCityModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("feed")

  // Verificar se está visualizando perfil de outra pessoa
  const isOwnProfile =
    pathname === "/profile" || (userProfile?.username && pathname === `/profile/${userProfile.username}`)

  // Initialize states from URL params
  useEffect(() => {
    const currentSearch = searchParams.get("q") || ""
    const currentCityParam = searchParams.get("city")

    setSearchValue(currentSearch)

    let initialCityId = null
    if (currentCityParam) {
      initialCityId = Number.parseInt(currentCityParam)
    } else if (userProfile?.city_id && (pathname === "/feed" || pathname === "/")) {
      initialCityId = userProfile.city_id
    }
    setSelectedCityId(initialCityId)
  }, [searchParams, userProfile, pathname])

  // Set active tab based on pathname
  useEffect(() => {
    if (pathname === "/feed" || pathname === "/" || pathname.startsWith("/job/")) {
      setActiveTab("feed")
    } else if (pathname.startsWith("/saved")) {
      setActiveTab("saved")
    } else if (pathname.startsWith("/applications")) {
      setActiveTab("applications")
    } else if (pathname.startsWith("/notifications")) {
      setActiveTab("notifications")
    } else if (pathname.startsWith("/dashboard")) {
      setActiveTab("dashboard")
    } else if (isOwnProfile) {
      setActiveTab("profile")
    }
  }, [pathname, isOwnProfile])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    // Atualizar URL em tempo real
    const newParams = new URLSearchParams(searchParams.toString())
    if (value.trim()) {
      newParams.set("q", value)
    } else {
      newParams.delete("q")
    }
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
  }

  const handleClearSearch = () => {
    setSearchValue("")
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete("q")
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
  }

  const handleCityChange = (cityId: number | null) => {
    setSelectedCityId(cityId)
    const newParams = new URLSearchParams(searchParams.toString())
    if (cityId) {
      newParams.set("city", cityId.toString())
    } else {
      newParams.delete("city")
    }
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
  }

  const handleTabClick = (tab: string, path: string) => {
    setActiveTab(tab)
    router.push(path)
  }

  const selectedCity = cities.find((city) => city.id === selectedCityId)

  const tabs = [
    { id: "feed", label: "Vagas", icon: Search, path: "/feed" },
    { id: "saved", label: "Salvos", icon: Bookmark, path: "/saved" },
  ]

  if (isLoggedIn) {
    if (userProfile?.user_type === "candidate") {
      tabs.push(
        { id: "applications", label: "Candidaturas", icon: Briefcase, path: "/applications" },
        {
          id: "notifications",
          label: "Notificações",
          icon: Bell,
          path: "/notifications",
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
      )
    } else if (userProfile?.user_type === "recruiter") {
      tabs.push(
        { id: "dashboard", label: "Dashboard", icon: Briefcase, path: "/dashboard" },
        {
          id: "notifications",
          label: "Notificações",
          icon: Bell,
          path: "/notifications",
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
      )
    }
    tabs.push({ id: "profile", label: "Perfil", icon: User, path: "/profile" })
  } else {
    // Para usuários não logados
    tabs.push(
      { id: "applications", label: "Candidaturas", icon: Briefcase, path: "/applications" },
      { id: "notifications", label: "Notificações", icon: Bell, path: "/notifications" },
      { id: "profile", label: "Perfil", icon: User, path: "/profile" },
    )
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => router.push("/")}
            >
              <img src="/logo.png" alt="Busca Empregos" className="h-8 w-auto" />
            </div>

            {/* Search and City */}
            <div className="flex items-center gap-3 flex-1 max-w-xl mx-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Buscar vagas..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="pl-10 pr-10 h-9"
                />
                {searchValue && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setIsCityModalOpen(true)}
                className="flex items-center gap-2 min-w-[160px] justify-start h-9"
              >
                <MapPin className="w-4 h-4" />
                <span className="truncate text-sm">{selectedCity ? formatCityDisplay(selectedCity) : "Cidade"}</span>
              </Button>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleTabClick(tab.id, tab.path)}
                    className="flex items-center gap-2 relative px-3 py-1.5 h-9"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="text-sm">{tab.label}</span>
                    {tab.badge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {tab.badge > 99 ? "99+" : tab.badge}
                      </span>
                    )}
                  </Button>
                )
              })}
            </nav>
          </div>
        </div>
      </header>

      <CityModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        value={selectedCityId}
        onValueChange={handleCityChange}
      />
    </>
  )
}

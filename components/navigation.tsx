"use client"
import { Button } from "@/components/ui/button"
import React from "react"

import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Search,
  User,
  Briefcase,
  LayoutDashboard,
  Bookmark,
  Bell,
  MapPin,
  Plus,
  ShieldCheck,
  Building,
  Award,
  GraduationCap,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect, useCallback } from "react"
import { UserTypeDialog } from "./auth/user-type-dialog"
import { createClient } from "@/lib/supabase/client"
import { useNotifications } from "@/hooks/use-notifications"
import useMobile from "@/hooks/use-mobile"
import { CityModal } from "@/components/ui/city-modal"
import { useCities } from "@/hooks/use-cities"
import { formatCityDisplay } from "@/utils/city-utils"
import { SettingsDropdown } from "@/components/ui/settings-dropdown"
import { CityDisplay } from "@/components/ui/city-display"
import Link from "next/link"

interface NavigationProps {
  isLoggedIn: boolean
  userProfile: {
    id?: string
    city_id?: number | null
    user_type?: string | null
    username?: string | null
    full_name?: string | null
    avatar_url?: string | null
    professional_summary?: string | null
    company_name?: string | null
    is_verified?: boolean
    skills?: string[]
    experiences?: any[]
    education?: any[]
    courses?: any[]
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
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null)
  const [userJobs, setUserJobs] = useState<any[]>([])

  // Sidebar specific states for desktop
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [sidebarSearchTerm, setSidebarSearchTerm] = useState("")
  const [sidebarSelectedCityId, setSidebarSelectedCityId] = useState<number | null>(null)

  const supabase = createClient()
  const { cities } = useCities()
  const { unreadCount } = useNotifications()
  const displayUnreadCount = isLoggedIn ? unreadCount : 0

  // Verificar se está visualizando perfil de outra pessoa
  const isViewingOtherProfile = pathname.startsWith("/profile/") && pathname !== "/profile"
  const isOwnProfile =
    pathname === "/profile" || (userProfile?.username && pathname === `/profile/${userProfile.username}`)

  // Carregar vagas do recrutador
  useEffect(() => {
    if (isLoggedIn && userProfile?.user_type === "recruiter" && userProfile.id) {
      const loadRecruiterJobs = async () => {
        try {
          const { data: jobs } = await supabase
            .from("job_posts")
            .select("id, title, status, created_at, applications_count, views_count, likes_count")
            .eq("author_id", userProfile.id)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(5)

          setUserJobs(jobs || [])
        } catch (error) {
          console.error("Erro ao carregar vagas:", error)
        }
      }
      loadRecruiterJobs()
    }
  }, [isLoggedIn, userProfile, supabase])

  useEffect(() => {
    const currentSearch = searchParams.get("q") || ""
    const currentCityParam = searchParams.get("city")

    // Desktop search states
    setSearchTerm(currentSearch)
    setSelectedCityId(currentCityParam ? Number.parseInt(currentCityParam) : userProfile?.city_id || null)

    // Mobile sidebar states
    setSidebarSearchTerm(currentSearch)
    let initialCityId = null
    if (currentCityParam) {
      initialCityId = Number.parseInt(currentCityParam)
    } else if (!isMobile && userProfile?.city_id && (pathname === "/feed" || pathname === "/")) {
      initialCityId = userProfile.city_id
    }
    setSidebarSelectedCityId(initialCityId)
  }, [searchParams, userProfile, isMobile, pathname])

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
      setActiveTab("opportunities")
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
    [activeTab, pathname, router, isMobile],
  )

  // Desktop search handlers
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const newParams = new URLSearchParams()
    if (searchTerm.trim()) newParams.set("q", searchTerm.trim())
    if (selectedCityId) newParams.set("city", selectedCityId.toString())

    const queryString = newParams.toString()
    router.push(`/feed${queryString ? `?${queryString}` : ""}`)
    setActiveTab("opportunities")
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleCityChange = (cityId: number | null) => {
    setSelectedCityId(cityId)
    setIsCityModalOpen(false)

    const newParams = new URLSearchParams(searchParams.toString())
    if (cityId) {
      newParams.set("city", cityId.toString())
    } else {
      newParams.delete("city")
    }
    router.replace(`${pathname}?${newParams.toString()}`, { scroll: false })
  }

  // Mobile sidebar handlers (versão 56)
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

  const selectedCity = cities.find((city) => city.id === selectedCityId)
  const sidebarSelectedCity = cities.find((city) => city.id === sidebarSelectedCityId)

  if (isMobile) {
    // Mobile Layout - Versão 56 restaurada
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

  // Desktop Layout - Header + Sidebar fixos
  return (
    <>
      {/* Header Global Fixo */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b z-50 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push("/")}>
            <img src="/logo.jpg" alt="Galeria de Empregos" className="h-8 w-auto" />
          </div>

          {/* Barra de Pesquisa e Filtros */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="search"
                  placeholder="Buscar vagas, empresas..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-10"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCityModalOpen(true)}
                className="min-w-[180px] justify-start"
              >
                <MapPin className="w-4 h-4 mr-2" />
                <span className="truncate">{selectedCity ? formatCityDisplay(selectedCity) : "Todas as cidades"}</span>
              </Button>
            </div>
          </div>

          {/* Botões de Navegação */}
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleNavigation(tab)}
                  className="relative"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </Button>
              )
            })}

            {isLoggedIn && <SettingsDropdown />}
          </div>
        </div>
      </header>

      {/* Sidebar Esquerda Fixa - Perfil do Usuário */}
      <aside className="fixed left-0 top-16 bottom-0 w-80 bg-background border-r overflow-y-auto z-40">
        <div className="p-6">
          {isLoggedIn && userProfile ? (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={userProfile.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-lg">
                        {(userProfile.full_name || userProfile.company_name || userProfile.username || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {userProfile.is_verified && (
                      <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                        <ShieldCheck className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {userProfile.full_name || userProfile.company_name || userProfile.username}
                      </h3>
                      {userProfile.is_verified && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Verificado
                        </Badge>
                      )}
                    </div>

                    {userProfile.city_id && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <CityDisplay cityId={userProfile.city_id} className="text-sm" />
                      </div>
                    )}
                  </div>
                </div>

                {userProfile.professional_summary && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{userProfile.professional_summary}</p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Candidato - Informações do Perfil */}
                {userProfile.user_type === "candidate" && (
                  <>
                    {/* Habilidades */}
                    {userProfile.skills && userProfile.skills.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Habilidades
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {userProfile.skills.slice(0, 6).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {userProfile.skills.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{userProfile.skills.length - 6}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Experiência */}
                    {userProfile.experiences && userProfile.experiences.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Experiência
                        </h4>
                        <div className="space-y-2">
                          {userProfile.experiences.slice(0, 3).map((exp: any, index: number) => (
                            <div key={index} className="text-sm">
                              <p className="font-medium">{exp.position}</p>
                              {exp.company && <p className="text-muted-foreground text-xs">{exp.company}</p>}
                            </div>
                          ))}
                          {userProfile.experiences.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{userProfile.experiences.length - 3} experiências
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Formação */}
                    {userProfile.education && userProfile.education.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          Formação
                        </h4>
                        <div className="space-y-2">
                          {userProfile.education.slice(0, 2).map((edu: any, index: number) => (
                            <div key={index} className="text-sm">
                              <p className="font-medium">{edu.courseName || edu.level}</p>
                              <p className="text-muted-foreground text-xs">{edu.institution}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Primeiro Emprego */}
                    {userProfile.is_first_job && (
                      <div>
                        <Badge className="bg-blue-100 text-blue-800">Primeiro Emprego</Badge>
                        <p className="text-xs text-muted-foreground mt-1">Em busca da primeira oportunidade</p>
                      </div>
                    )}
                  </>
                )}

                {/* Recrutador - Vagas Publicadas */}
                {userProfile.user_type === "recruiter" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Vagas Ativas
                      </h4>
                      <Button size="sm" asChild>
                        <Link href="/create-job">
                          <Plus className="w-3 h-3 mr-1" />
                          Nova
                        </Link>
                      </Button>
                    </div>

                    {userJobs.length > 0 ? (
                      <div className="space-y-2">
                        {userJobs.map((job) => (
                          <Link key={job.id} href={`/post/${job.id}`}>
                            <div className="p-2 border rounded hover:bg-muted/50 transition-colors">
                              <p className="font-medium text-sm line-clamp-1">{job.title}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <span>👥 {job.applications_count || 0}</span>
                                <span>👁️ {job.views_count || 0}</span>
                                <span>❤️ {job.likes_count || 0}</span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma vaga ativa</p>
                    )}
                  </div>
                )}

                {/* Botão Ver Perfil Completo */}
                <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                  <Link href="/profile">
                    <User className="w-4 h-4 mr-2" />
                    Ver Perfil Completo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Usuário não logado */
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Faça login para ver seu perfil</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Acesse suas candidaturas, vagas salvas e muito mais
                </p>
                <Button asChild className="w-full">
                  <Link href="/login">Entrar</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </aside>

      {/* Modais */}
      <CityModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        value={selectedCityId}
        onValueChange={handleCityChange}
      />
      <UserTypeDialog open={isUserTypeDialogOpen} onOpenChange={setIsUserTypeDialogOpen} />
    </>
  )
}

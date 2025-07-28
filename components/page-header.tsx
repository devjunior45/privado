"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, ChevronDown, Filter, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useCities, preloadCities } from "@/hooks/use-cities"
import { useSectors } from "@/hooks/use-sectors"
import { formatCityDisplay } from "@/utils/city-utils"
import { createClient } from "@/lib/supabase/client"

interface PageHeaderProps {
  title?: string
  showSearch?: boolean
  showFilters?: boolean
  enableStickyBehavior?: boolean
  onSearchChange?: (search: string) => void
  selectedCityId?: number | null
  onCityChange?: (cityId: number | null) => void
  onFilterChange?: (filters: { locations: number[]; salaryRanges: string[]; sectors: number[] }) => void
  availableSalaryRanges?: string[]
  userProfile?: any
  showBackButton?: boolean
}

export function PageHeader({
  title,
  showSearch = false,
  showFilters = false,
  enableStickyBehavior = false,
  onSearchChange,
  selectedCityId = null,
  onCityChange,
  onFilterChange,
  availableSalaryRanges = [],
  userProfile,
  showBackButton = false,
}: PageHeaderProps) {
  const [searchValue, setSearchValue] = useState("")
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<number[]>([])
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState<string[]>([])
  const [selectedSectors, setSelectedSectors] = useState<number[]>([])
  const [currentSelectedCityId, setCurrentSelectedCityId] = useState<number | null>(selectedCityId)
  const [isVisible, setIsVisible] = useState(true)
  const [isSticky, setIsSticky] = useState(false)
  const lastScrollYRef = useRef(0)
  const ticking = useRef(false)
  const { cities, isLoading: isLoadingCities } = useCities()
  const { sectors, isLoading: isLoadingSectors } = useSectors()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    preloadCities()
  }, [])

  useEffect(() => {
    async function setDefaultCity() {
      if (currentSelectedCityId !== null) return
      if (!userProfile) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            const { data: profile } = await supabase.from("profiles").select("city_id").eq("id", user.id).single()
            if (profile?.city_id) {
              setCurrentSelectedCityId(profile.city_id)
              onCityChange?.(profile.city_id)
            }
          }
        } catch (error) {
          console.error("Erro ao buscar perfil:", error)
        }
      } else if (userProfile.city_id) {
        setCurrentSelectedCityId(userProfile.city_id)
        onCityChange?.(userProfile.city_id)
      }
    }
    setDefaultCity()
  }, [userProfile, currentSelectedCityId, onCityChange, supabase])

  useEffect(() => {
    setCurrentSelectedCityId(selectedCityId)
  }, [selectedCityId])

  useEffect(() => {
    if (!enableStickyBehavior) return
    const updateScrollBehavior = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > 200) {
        setIsSticky(true)
        if (currentScrollY > lastScrollYRef.current) {
          setIsVisible(false)
        } else if (currentScrollY < lastScrollYRef.current - 30) {
          setIsVisible(true)
        }
      } else {
        setIsSticky(false)
        setIsVisible(true)
      }
      lastScrollYRef.current = currentScrollY
      ticking.current = false
    }
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(updateScrollBehavior)
        ticking.current = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [enableStickyBehavior])

  const selectedCity = cities.find((city) => city.id === currentSelectedCityId)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    onSearchChange?.(e.target.value)
  }

  const handleCityChange = (cityId: number | null) => {
    setCurrentSelectedCityId(cityId)
    if (onCityChange) {
      onCityChange(cityId)
    }
  }

  const handleLocationToggle = (cityId: number) => {
    const newLocations = selectedLocations.includes(cityId)
      ? selectedLocations.filter((id) => id !== cityId)
      : [...selectedLocations, cityId]
    setSelectedLocations(newLocations)
    onFilterChange?.({
      locations: newLocations,
      salaryRanges: selectedSalaryRanges,
      sectors: selectedSectors,
    })
  }

  const handleSalaryToggle = (salary: string) => {
    const newSalaries = selectedSalaryRanges.includes(salary)
      ? selectedSalaryRanges.filter((s) => s !== salary)
      : [...selectedSalaryRanges, salary]
    setSelectedSalaryRanges(newSalaries)
    onFilterChange?.({
      locations: selectedLocations,
      salaryRanges: newSalaries,
      sectors: selectedSectors,
    })
  }

  const handleSectorToggle = (sectorId: number) => {
    const newSectors = selectedSectors.includes(sectorId)
      ? selectedSectors.filter((id) => id !== sectorId)
      : [...selectedSectors, sectorId]
    setSelectedSectors(newSectors)
    onFilterChange?.({
      locations: selectedLocations,
      salaryRanges: selectedSalaryRanges,
      sectors: newSectors,
    })
  }

  const clearFilters = () => {
    setSelectedLocations([])
    setSelectedSalaryRanges([])
    setSelectedSectors([])
    onFilterChange?.({
      locations: [],
      salaryRanges: [],
      sectors: [],
    })
  }

  const hasActiveFilters = selectedLocations.length > 0 || selectedSalaryRanges.length > 0 || selectedSectors.length > 0
  const totalFilters = selectedLocations.length + selectedSalaryRanges.length + selectedSectors.length

  const handleBack = () => {
    // Verifica se há histórico de navegação no browser
    if (window.history.length > 1) {
      // Verifica se há um referrer e se é do mesmo domínio
      if (document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer)
          const currentUrl = new URL(window.location.href)

          // Se o referrer é do mesmo domínio, volta para a página anterior
          if (referrerUrl.origin === currentUrl.origin) {
            router.back()
            return
          }
        } catch (error) {
          // Se houver erro ao processar URLs, redireciona para o feed
          router.push("/feed")
          return
        }
      } else {
        // Se não há referrer mas há histórico, ainda assim tenta voltar
        // (pode ser navegação interna sem referrer)
        router.back()
        return
      }
    }

    // Se não há histórico ou o referrer não é do mesmo domínio,
    // redireciona para o feed
    router.push("/feed")
  }

  return (
    <div>
      <div className="bg-white dark:bg-black border-b sticky top-0 z-50 px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="ghost" size="sm" onClick={handleBack} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="font-semibold text-lg">{title}</h1>
        </div>
      </div>
      <div
        className={`
          bg-white dark:bg-background transition-all duration-300 ease-out
          ${enableStickyBehavior ? "md:sticky md:top-0" : ""}
          ${enableStickyBehavior && isSticky ? "fixed top-0 left-0 right-0 w-full z-50 border-b border-gray-200" : "relative"}
          ${enableStickyBehavior && isVisible ? "translate-y-0 opacity-100" : enableStickyBehavior ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}
        `}
      >
        <div className="w-full px-4 py-3 md:max-w-md md:mx-auto md:px-2 md:py-2">
          {showSearch && (
            <div className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar vagas..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="pl-10 pr-10 h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                />
                {showFilters && (
                  <Button
                    variant={hasActiveFilters ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 rounded-md"
                  >
                    <Filter className="h-4 w-4" />
                    {totalFilters > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                        {totalFilters}
                      </span>
                    )}
                  </Button>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 h-10 px-3 border-gray-300 hover:border-blue-500 rounded-lg bg-transparent"
                    disabled={isLoadingCities}
                  >
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm max-w-[70px] truncate">
                      {isLoadingCities ? "..." : selectedCity ? selectedCity.name : "Todas"}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
                  <DropdownMenuItem
                    onClick={() => handleCityChange(null)}
                    className={`${!currentSelectedCityId ? "bg-blue-50 dark:bg-gray-700" : ""} hover:bg-gray-100 dark:hover:bg-gray-700`}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Todas as cidades
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isLoadingCities ? (
                    <div className="p-2 text-center">
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    </div>
                  ) : (
                    cities.map((city) => (
                      <DropdownMenuItem
                        key={city.id}
                        onClick={() => handleCityChange(city.id)}
                        className={`${currentSelectedCityId === city.id ? "bg-blue-50 dark:bg-gray-700" : ""} hover:bg-gray-100 dark:hover:bg-gray-700`}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        {formatCityDisplay(city)}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {showFilters && isFiltersVisible && (
            <div className="w-full mt-3">
              <Card className="border-gray-200 rounded-lg">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900">Filtros</h3>
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={clearFilters} className="h-7 text-xs bg-transparent">
                        <X className="h-3 w-3 mr-1" />
                        Limpar
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-between h-9 text-xs w-full bg-transparent"
                        >
                          <span>Setor</span>
                          {selectedSectors.length > 0 && (
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">
                              {selectedSectors.length}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                        <DropdownMenuLabel>Filtrar por setor</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isLoadingSectors ? (
                          <DropdownMenuItem disabled>Carregando...</DropdownMenuItem>
                        ) : (
                          sectors.map((sector) => (
                            <DropdownMenuCheckboxItem
                              key={sector.id}
                              checked={selectedSectors.includes(sector.id)}
                              onCheckedChange={() => handleSectorToggle(sector.id)}
                            >
                              {sector.name}
                            </DropdownMenuCheckboxItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {!showSearch && (
            <div className="flex h-[40px] items-center justify-center">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, ChevronDown, Filter, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useCities, preloadCities } from "@/hooks/use-cities"
import { formatCityDisplay } from "@/utils/city-utils"
import { createClient } from "@/lib/supabase/client"

interface PageHeaderProps {
  title?: string
  showSearch?: boolean
  showFilters?: boolean
  enableStickyBehavior?: boolean // Nova prop
  onSearchChange?: (search: string) => void
  selectedCityId?: number | null
  onCityChange?: (cityId: number | null) => void
  onFilterChange?: (filters: { locations: number[]; salaryRanges: string[] }) => void
  availableSalaryRanges?: string[]
  userProfile?: any
}

export function PageHeader({
  title,
  showSearch = false,
  showFilters = false,
  enableStickyBehavior = false, // Valor padrão false
  onSearchChange,
  selectedCityId = null,
  onCityChange,
  onFilterChange,
  availableSalaryRanges = [],
  userProfile,
}: PageHeaderProps) {
  const [searchValue, setSearchValue] = useState("")
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<number[]>([])
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState<string[]>([])
  const [currentSelectedCityId, setCurrentSelectedCityId] = useState<number | null>(selectedCityId)
  const [isVisible, setIsVisible] = useState(true)
  const [isSticky, setIsSticky] = useState(false)
  const lastScrollYRef = useRef(0)
  const ticking = useRef(false)
  const { cities, isLoading } = useCities()
  const supabase = createClient()

  // Pré-carregar cidades quando o componente monta
  useEffect(() => {
    preloadCities()
  }, [])

  // Definir cidade padrão baseada no perfil do usuário
  useEffect(() => {
    async function setDefaultCity() {
      // Se já tem uma cidade selecionada, não alterar
      if (currentSelectedCityId !== null) return

      // Se não tem perfil de usuário, buscar
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

  // Atualizar cidade selecionada quando prop mudar
  useEffect(() => {
    setCurrentSelectedCityId(selectedCityId)
  }, [selectedCityId])

  // Controlar visibilidade e posição da barra - apenas se enableStickyBehavior for true
  useEffect(() => {
    if (!enableStickyBehavior) return

    const updateScrollBehavior = () => {
      const currentScrollY = window.scrollY

      // Só ativa o comportamento sticky após rolar 200px
      if (currentScrollY > 200) {
        setIsSticky(true)

        // Se rolou para baixo, esconder imediatamente
        if (currentScrollY > lastScrollYRef.current) {
          setIsVisible(false)
        }
        // Se rolou para cima pelo menos 30px, mostrar
        else if (currentScrollY < lastScrollYRef.current - 30) {
          setIsVisible(true)
        }
      } else {
        // Antes de 200px, sempre visível e não sticky
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

  // Encontrar cidade selecionada
  const selectedCity = cities.find((city) => city.id === currentSelectedCityId)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    onSearchChange?.(e.target.value)
  }

  const handleCityChange = (cityId: number | null) => {
    setCurrentSelectedCityId(cityId)
    // Chamar o callback imediatamente
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
    })
  }

  const clearFilters = () => {
    setSelectedLocations([])
    setSelectedSalaryRanges([])
    onFilterChange?.({
      locations: [],
      salaryRanges: [],
    })
  }

  const hasActiveFilters = selectedLocations.length > 0 || selectedSalaryRanges.length > 0
  const totalFilters = selectedLocations.length + selectedSalaryRanges.length

  return (
    <div
      className={`
        bg-white dark:bg-background transition-all duration-300 ease-out
        ${enableStickyBehavior ? "md:sticky md:top-0" : ""}
        ${enableStickyBehavior && isSticky ? "fixed top-0 left-0 right-0 w-full z-50 border-b border-gray-200" : "relative"}
        ${enableStickyBehavior && isVisible ? "translate-y-0 opacity-100" : enableStickyBehavior ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}
      `}
    >
      {/* Container interno com padding apenas no mobile */}
      <div className="w-full px-4 py-3 md:max-w-md md:mx-auto md:px-2 md:py-2">
        {/* Campo de Busca e Seletor de Cidade */}
        {showSearch && (
          <div className="flex items-center gap-2 w-full">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar vagas..."
                value={searchValue}
                onChange={handleSearchChange}
                className="pl-10 pr-10 h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
              />

              {/* Botão de Filtros */}
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

            {/* Seletor de Cidade */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 h-10 px-3 border-gray-300 hover:border-blue-500 rounded-lg bg-transparent"
                  disabled={isLoading}
                >
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm max-w-[70px] truncate">
                    {isLoading ? "..." : selectedCity ? selectedCity.name : "Todas"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => handleCityChange(null)}
                  className={!currentSelectedCityId ? "bg-blue-50" : ""}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Todas as cidades
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {isLoading ? (
                  <div className="p-2 text-center">
                    <p className="text-sm text-muted-foreground">Carregando cidades...</p>
                  </div>
                ) : (
                  cities.map((city) => (
                    <DropdownMenuItem
                      key={city.id}
                      onClick={() => handleCityChange(city.id)}
                      className={currentSelectedCityId === city.id ? "bg-blue-50" : ""}
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

        {/* Filtros Expandidos */}
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

                <div className="grid grid-cols-2 gap-3">
                  {/* Filtro de Localização */}
                  {cities.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-between h-9 text-xs w-full bg-transparent"
                        >
                          <span>Localização</span>
                          {selectedLocations.length > 0 && (
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">
                              {selectedLocations.length}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Filtrar por localização</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {cities.map((city) => (
                          <DropdownMenuCheckboxItem
                            key={city.id}
                            checked={selectedLocations.includes(city.id)}
                            onCheckedChange={() => handleLocationToggle(city.id)}
                          >
                            {formatCityDisplay(city)}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {/* Filtro de Salário */}
                  {availableSalaryRanges.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-between h-9 text-xs w-full bg-transparent"
                        >
                          <span>Salário</span>
                          {selectedSalaryRanges.length > 0 && (
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">
                              {selectedSalaryRanges.length}
                            </span>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Filtrar por salário</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {availableSalaryRanges.map((salary) => (
                          <DropdownMenuCheckboxItem
                            key={salary}
                            checked={selectedSalaryRanges.includes(salary)}
                            onCheckedChange={() => handleSalaryToggle(salary)}
                          >
                            {salary}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Tags de Filtros Ativos */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap gap-2">
                    {selectedLocations.map((cityId) => {
                      const city = cities.find((c) => c.id === cityId)
                      return city ? (
                        <div
                          key={cityId}
                          className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1"
                        >
                          {formatCityDisplay(city)}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-blue-600"
                            onClick={() => handleLocationToggle(cityId)}
                          />
                        </div>
                      ) : null
                    })}
                    {selectedSalaryRanges.map((salary) => (
                      <div
                        key={salary}
                        className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1"
                      >
                        {salary}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-blue-600"
                          onClick={() => handleSalaryToggle(salary)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Título da página (se fornecido e não for busca) */}
        {title && !showSearch && (
          <div className="flex h-[40px] items-center justify-center">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
        )}
      </div>
    </div>
  )
}

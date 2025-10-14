"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { Check, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCities } from "@/hooks/use-cities"
import { groupCitiesByRegion } from "@/utils/city-utils"

interface CityModalProps {
  isOpen: boolean
  onClose: () => void
  value?: number | null
  onValueChange: (value: number | null) => void
}

export function CityModal({ isOpen, onClose, value, onValueChange }: CityModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const { cities, isLoading } = useCities()

  const selectedCity = useMemo(() => {
    return value ? cities.find((city) => city.id === value) : null
  }, [value, cities])

  const filteredCities = useMemo(() => {
    if (!searchTerm) return cities
    return cities.filter(
      (city) =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.state.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [cities, searchTerm])

  const groupedCities = useMemo(() => {
    return groupCitiesByRegion(filteredCities)
  }, [filteredCities])

  const handleSelect = (cityId: number | null) => {
    onValueChange(cityId)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Selecionar Cidade</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cidade ou estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Carregando cidades...</div>
          ) : (
            <div className="p-2">
              {/* Opção "Todas as cidades" */}
              <div className="mb-2">
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-left hover:bg-accent rounded-md transition-colors cursor-pointer",
                    value === null && "bg-accent",
                  )}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === null ? "opacity-100" : "opacity-0")} />
                  <span className="font-medium">Todas as cidades</span>
                </button>
              </div>

              {/* Cidades agrupadas por região */}
              {groupedCities.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Nenhuma cidade encontrada.</div>
              ) : (
                groupedCities.map((group) => (
                  <div key={group.region} className="mb-4">
                    <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.region}
                    </div>
                    <div className="space-y-1">
                      {group.cities.map((city) => (
                        <button
                          key={city.value}
                          type="button"
                          onClick={() => handleSelect(city.value)}
                          className={cn(
                            "w-full flex items-center px-3 py-2 text-left hover:bg-accent rounded-md transition-colors cursor-pointer",
                            value === city.value && "bg-accent",
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 flex-shrink-0",
                              value === city.value ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="flex-1">{city.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

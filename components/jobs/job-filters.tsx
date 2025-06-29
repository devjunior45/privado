"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Filter, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

interface JobFiltersProps {
  onFilterChange: (filters: {
    locations: string[]
    salaryRanges: string[]
  }) => void
  locations: string[]
  salaryRanges: string[]
}

export function JobFilters({ onFilterChange, locations, salaryRanges }: JobFiltersProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState<string[]>([])
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)

  const handleLocationToggle = (location: string) => {
    const newLocations = selectedLocations.includes(location)
      ? selectedLocations.filter((l) => l !== location)
      : [...selectedLocations, location]

    setSelectedLocations(newLocations)
    onFilterChange({
      locations: newLocations,
      salaryRanges: selectedSalaryRanges,
    })
  }

  const handleSalaryToggle = (salary: string) => {
    const newSalaries = selectedSalaryRanges.includes(salary)
      ? selectedSalaryRanges.filter((s) => s !== salary)
      : [...selectedSalaryRanges, salary]

    setSelectedSalaryRanges(newSalaries)
    onFilterChange({
      locations: selectedLocations,
      salaryRanges: newSalaries,
    })
  }

  const clearFilters = () => {
    setSelectedLocations([])
    setSelectedSalaryRanges([])
    onFilterChange({
      locations: [],
      salaryRanges: [],
    })
  }

  const hasActiveFilters = selectedLocations.length > 0 || selectedSalaryRanges.length > 0

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2 justify-between items-center">
          <Button
            variant={isFiltersVisible ? "default" : "outline"}
            size="sm"
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {hasActiveFilters && ` (${selectedLocations.length + selectedSalaryRanges.length})`}
          </Button>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>

        {isFiltersVisible && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Localização {selectedLocations.length > 0 && `(${selectedLocations.length})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Filtrar por localização</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {locations.map((location) => (
                  <DropdownMenuCheckboxItem
                    key={location}
                    checked={selectedLocations.includes(location)}
                    onCheckedChange={() => handleLocationToggle(location)}
                  >
                    {location}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Salário {selectedSalaryRanges.length > 0 && `(${selectedSalaryRanges.length})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Filtrar por salário</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {salaryRanges.map((salary) => (
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
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {selectedLocations.map((location) => (
              <div key={location} className="bg-muted text-xs px-2 py-1 rounded-full flex items-center gap-1">
                {location}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleLocationToggle(location)} />
              </div>
            ))}
            {selectedSalaryRanges.map((salary) => (
              <div key={salary} className="bg-muted text-xs px-2 py-1 rounded-full flex items-center gap-1">
                {salary}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleSalaryToggle(salary)} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

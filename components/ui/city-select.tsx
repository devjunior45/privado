"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCities } from "@/hooks/use-cities"
import { formatCityDisplay, groupCitiesByRegion } from "@/utils/city-utils"

interface CitySelectProps {
  value?: number | null
  onValueChange: (value: number | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  name?: string
}

export function CitySelect({
  value,
  onValueChange,
  placeholder = "Selecione uma cidade...",
  className,
  disabled = false,
  name,
}: CitySelectProps) {
  const [open, setOpen] = React.useState(false)
  const { cities, isLoading } = useCities()

  const selectedCity = React.useMemo(() => {
    return value ? cities.find((city) => city.id === value) : null
  }, [value, cities])

  const groupedCities = React.useMemo(() => {
    return groupCitiesByRegion(cities)
  }, [cities])

  const handleSelect = (cityId: number | null) => {
    console.log("City selected in CitySelect:", cityId)
    onValueChange(cityId)
    setOpen(false)
  }

  if (isLoading) {
    return (
      <Button variant="outline" className={cn("w-full justify-between", className)} disabled>
        Carregando cidades...
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={value || ""} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
          >
            {selectedCity ? formatCityDisplay(selectedCity) : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Buscar cidade..." />
            <CommandList>
              <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>

              {/* Opção "Todas as cidades" */}
              <CommandGroup>
                <CommandItem value="all-cities" onSelect={() => handleSelect(null)}>
                  <Check className={cn("mr-2 h-4 w-4", value === null ? "opacity-100" : "opacity-0")} />
                  Todas as cidades
                </CommandItem>
              </CommandGroup>

              {/* Cidades agrupadas por região */}
              {groupedCities.map((group) => (
                <CommandGroup key={group.region} heading={group.region}>
                  {group.cities.map((city) => (
                    <CommandItem key={city.value} value={city.label} onSelect={() => handleSelect(city.value)}>
                      <Check className={cn("mr-2 h-4 w-4", value === city.value ? "opacity-100" : "opacity-0")} />
                      {city.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}

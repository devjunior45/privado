"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCities } from "@/hooks/use-cities"

interface CitySelectProps {
  value: number | null
  onValueChange: (value: number | null) => void
  placeholder?: string
  className?: string
}

export function CitySelect({ value, onValueChange, placeholder = "Selecione uma cidade", className }: CitySelectProps) {
  const [open, setOpen] = React.useState(false)
  const { cities, isLoading } = useCities()

  const selectedCity = React.useMemo(() => {
    return cities.find((city) => city.id === value)
  }, [cities, value])

  const handleSelect = (cityId: number) => {
    console.log("CitySelect handleSelect:", cityId)
    onValueChange(cityId === value ? null : cityId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando cidades...
            </>
          ) : selectedCity ? (
            `${selectedCity.name} - ${selectedCity.state}`
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cidade..." />
          <CommandList>
            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem key={city.id} value={`${city.name} ${city.state}`} onSelect={() => handleSelect(city.id)}>
                  <Check className={cn("mr-2 h-4 w-4", value === city.id ? "opacity-100" : "opacity-0")} />
                  {city.name} - {city.state}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

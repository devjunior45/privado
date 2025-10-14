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
    onValueChange(cityId)
    setOpen(false)
  }

  if (isLoading) {
    return (
      <Button variant="outline" className={cn("w-full justify-between", className)} disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando cidades...
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCity ? `${selectedCity.name} - ${selectedCity.state}` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cidade..." className="h-9" />
          <CommandList>
            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            <CommandGroup>
              {cities.map((city) => (
                <CommandItem
                  key={city.id}
                  value={city.id.toString()}
                  onSelect={() => {
                    handleSelect(city.id)
                  }}
                >
                  {city.name} - {city.state}
                  <Check className={cn("ml-auto h-4 w-4", value === city.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

import type { City, CityGroup } from "@/types/city"

export function formatCityDisplay(city: City): string {
  return `${city.name}, ${city.state}`
}

export function formatCityName(city: City): string {
  return `${city.name} - ${city.state}`
}

export function findCityById(cities: City[], id: number): City | null {
  return cities.find((city) => city.id === id) || null
}

export function filterCitiesByTerm(cities: City[], searchTerm: string): City[] {
  if (!searchTerm.trim()) return cities

  const term = searchTerm.toLowerCase()
  return cities.filter((city) => city.name.toLowerCase().includes(term) || city.state.toLowerCase().includes(term))
}

export function groupCitiesByRegion(cities: City[]): CityGroup[] {
  const groups: Record<string, City[]> = {}

  cities.forEach((city) => {
    if (!groups[city.region]) {
      groups[city.region] = []
    }
    groups[city.region].push(city)
  })

  return Object.entries(groups).map(([region, cities]) => ({
    region,
    cities: cities.map((city) => ({
      value: city.id,
      label: formatCityDisplay(city),
    })),
  }))
}

export function getCityNameById(cities: City[], cityId: number | null): string | null {
  if (!cityId) return null
  const city = findCityById(cities, cityId)
  return city ? formatCityDisplay(city) : null
}

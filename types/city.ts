export interface City {
  id: number
  name: string
  state: string
  region: string
}

export interface CityOption {
  value: number
  label: string
}

export interface CityGroup {
  region: string
  cities: CityOption[]
}

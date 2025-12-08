// Tipo para vagas do recrutador com estatísticas otimizadas
export interface RecruiterJobWithStats {
  id: string
  title: string
  company: string
  location: string
  city_id: number | null
  salary: string | null
  description: string
  image_url: string | null
  background_color: string
  allow_platform_applications: boolean
  author_id: string
  status: "active" | "paused" | "closed"
  created_at: string
  updated_at: string
  views_count: number
  likes_count: number
  sector_ids: number[] | null
  // Contadores calculados pela VIEW
  applications_count: number
  platform_applications_count: number
  external_applications_count: number
  pending_count: number
  interview_count: number
  hired_count: number
  rejected_count: number
}

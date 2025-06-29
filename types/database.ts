export interface Profile {
  id: string
  updated_at?: string | null
  username: string | null
  full_name?: string | null
  avatar_url?: string | null
  website?: string | null
  email: string | null
}

export interface JobPost {
  id: string
  created_at?: string
  company: string
  title: string
  location: string
  description: string
  salary_min: number
  salary_max: number
  remote: boolean
  user_id: string
}

export interface JobPostWithProfile extends JobPost {
  profiles: Profile
  is_liked?: boolean
  is_saved?: boolean
  has_applied?: boolean
  application_date?: string | null
}

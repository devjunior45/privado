export interface Experience {
  position: string
  company?: string
  startDate?: string
  endDate?: string
  isCurrentJob?: boolean
  activities?: string
}

export interface Education {
  level: string
  institution: string
  completionYear?: string
  isComplete: boolean
  courseName?: string
}

export interface Course {
  name: string
  institution: string
  completionYear?: string
  duration?: string
  isComplete: boolean
}

export type UserType = "candidate" | "recruiter"

export interface UserProfile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  city: string | null
  state: string | null
  city_id: number | null
  whatsapp: string | null
  email: string | null
  professional_summary: string | null
  skills: string[] | null
  experiences: Experience[] | null
  education: Education[] | null
  courses: Course[] | null
  cnh_types: string[] | null
  resume_pdf_url: string | null
  created_at: string
  user_type: UserType
  company_name?: string | null
  company_location?: string | null
  cnpj?: string | null
  is_verified?: boolean
}

export interface JobApplication {
  id: string
  user_id: string
  post_id: string
  message: string | null
  created_at: string
  job_posts: {
    title: string
    company: string
    location: string
  }
}

export interface VerificationRequest {
  id: string
  user_id: string
  company_name: string
  cnpj?: string
  contact_phone: string
  contact_email?: string
  message?: string
  status: "pending" | "approved" | "rejected"
  admin_notes?: string
  created_at: string
  updated_at: string
}

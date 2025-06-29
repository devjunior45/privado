export interface DashboardStats {
  totalActiveJobs: number
  totalPausedJobs: number
  totalClosedJobs: number
  totalViews: number
  totalLikes: number
  applicationsToday: number
  applicationsThisWeek: number
  applicationsThisMonth: number
  totalApplications: number
}

export interface JobStatusCounts {
  jobId: string
  jobTitle: string
  pending: number
  reviewing: number
  shortlisted: number
  rejected: number
  hired: number
}

export interface JobView {
  id: string
  job_id: string
  user_id: string | null
  created_at: string
  ip_address?: string
  user_agent?: string
  profiles?: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

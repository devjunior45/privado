export interface Notification {
  id: string
  user_id: string
  type: "comment_reply" | "job_match" | "new_application" | "system"
  title: string
  content: string
  link?: string
  related_id?: string
  is_read: boolean
  created_at: string
}

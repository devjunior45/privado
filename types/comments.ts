export interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  likes_count: number
  created_at: string
  updated_at: string
  is_liked: boolean
  profiles?: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  } | null
  replies?: Comment[]
}

export interface JobPost {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  description: string
  imageUrl?: string
  backgroundColor?: string
  author: {
    name: string
    avatar: string
    username: string
  }
  createdAt: Date
  likes: number
  isLiked: boolean
}

export interface CreateJobPostData {
  title: string
  company: string
  location: string
  salary?: string
  description: string
  imageUrl?: string
  backgroundColor?: string
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Send, X } from "lucide-react"
import { createComment } from "@/app/actions/comments"
import { createClient } from "@/lib/supabase/client"
import type { Comment } from "@/types/comments"
import { getRelativeDate } from "@/utils/date-utils"
import { getComments } from "@/app/actions/comments"

interface CommentsSheetProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  initialComments?: Comment[]
}

export function CommentsSheet({ isOpen, onClose, postId, initialComments = [] }: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, postId])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const fetchedComments = await getComments(postId) // server action handles join
      setComments(fetchedComments)
    } catch (error) {
      console.error("Erro ao buscar comentários:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("postId", postId)
      formData.append("content", newComment.trim())

      const result = await createComment(formData)
      if (result.success) {
        setNewComment("")
        await fetchComments()
      }
    } catch (error) {
      console.error("Erro ao enviar comentário:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] bg-white dark:bg-black px-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-white">Comentários</SheetTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-4">
            {comments.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum comentário ainda</p>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={comment.profiles?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {comment.profiles?.full_name?.charAt(0) || comment.profiles?.username?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {comment.profiles?.full_name || comment.profiles?.username || "Usuário"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {getRelativeDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comment Input */}
          {user && (
            <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="flex-1 text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                  disabled={isSubmitting}
                />
                <Button type="submit" size="sm" disabled={!newComment.trim() || isSubmitting} className="px-3">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

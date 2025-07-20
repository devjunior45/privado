"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Send, Heart, MessageCircle, ChevronDown, ChevronUp } from "lucide-react"
import { createComment, toggleCommentLike } from "@/app/actions/comments"
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [visibleReplies, setVisibleReplies] = useState<Set<string>>(new Set())

  // Drag to close functionality
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragCurrentY, setDragCurrentY] = useState(0)
  const [translateY, setTranslateY] = useState(0)
  const sheetRef = useRef<HTMLDivElement>(null)

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
      setTranslateY(0)
      setVisibleReplies(new Set())
    }
  }, [isOpen, postId])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      const fetchedComments = await getComments(postId)
      setComments(fetchedComments)
    } catch (error) {
      console.error("Erro ao buscar comentários:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRepliesVisibility = (commentId: string) => {
    const newVisibleReplies = new Set(visibleReplies)
    if (newVisibleReplies.has(commentId)) {
      newVisibleReplies.delete(commentId)
    } else {
      newVisibleReplies.add(commentId)
    }
    setVisibleReplies(newVisibleReplies)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStartY(touch.clientY)
    setDragCurrentY(touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return

    const touch = e.touches[0]
    const deltaY = touch.clientY - dragStartY

    // Only allow dragging down
    if (deltaY > 0) {
      setDragCurrentY(touch.clientY)
      setTranslateY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return

    const deltaY = dragCurrentY - dragStartY

    // If dragged down more than 100px, close the sheet
    if (deltaY > 100) {
      onClose()
    } else {
      // Snap back to original position
      setTranslateY(0)
    }

    setIsDragging(false)
    setDragStartY(0)
    setDragCurrentY(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("postId", postId)
      formData.append("content", newComment.trim())

      await createComment(formData)
      setNewComment("")
      await fetchComments()
    } catch (error) {
      console.error("Erro ao enviar comentário:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim() || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("postId", postId)
      formData.append("content", replyContent.trim())
      formData.append("parentId", parentId)

      await createComment(formData)
      setReplyContent("")
      setReplyingTo(null)
      await fetchComments()

      // Automatically show replies after adding a new one
      setVisibleReplies((prev) => new Set([...prev, parentId]))
    } catch (error) {
      console.error("Erro ao enviar resposta:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    if (!user) return

    try {
      await toggleCommentLike(commentId)
      await fetchComments()
    } catch (error) {
      console.error("Erro ao curtir comentário:", error)
    }
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-3 ${isReply ? "ml-8 mt-2" : ""}`}>
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
          <span className="text-xs text-gray-500 dark:text-gray-400">{getRelativeDate(comment.created_at)}</span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 break-words mb-2">{comment.content}</p>

        {/* Action buttons */}
        {user && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLike(comment.id)}
              className={`flex items-center gap-1 text-xs ${
                comment.is_liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
              } transition-colors`}
            >
              <Heart className={`w-3 h-3 ${comment.is_liked ? "fill-current" : ""}`} />
              {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                <span>Responder</span>
              </button>
            )}
          </div>
        )}

        {/* Reply input */}
        {replyingTo === comment.id && user && (
          <div className="mt-2 flex gap-2">
            <Input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Escreva uma resposta..."
              className="flex-1 text-sm h-8"
              disabled={isSubmitting}
            />
            <Button
              onClick={() => handleReplySubmit(comment.id)}
              size="sm"
              disabled={!replyContent.trim() || isSubmitting}
              className="h-8 px-2"
            >
              <Send className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => {
                setReplyingTo(null)
                setReplyContent("")
              }}
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Replies toggle button */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => toggleRepliesVisibility(comment.id)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {visibleReplies.has(comment.id) ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  <span>Ocultar respostas</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>
                    Ver {comment.replies.length} {comment.replies.length === 1 ? "resposta" : "respostas"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && visibleReplies.has(comment.id) && (
          <div className="mt-3 space-y-2">{comment.replies.map((reply) => renderComment(reply, true))}</div>
        )}
      </div>
    </div>
  )

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[80vh] bg-white dark:bg-black px-0 transition-transform duration-200 ease-out"
        ref={sheetRef}
        style={{
          transform: `translateY(${translateY}px)`,
          opacity: isDragging ? Math.max(0.5, 1 - translateY / 300) : 1,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Drag Handle */}
          <div
            className="flex justify-center py-2 cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <SheetHeader className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              Comentários
            </SheetTitle>
          </SheetHeader>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando comentários...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum comentário ainda</p>
              </div>
            ) : (
              <div className="py-4 space-y-4">{comments.map((comment) => renderComment(comment))}</div>
            )}
          </div>

          {/* Comment Input */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-3">
            {user ? (
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
            ) : (
              <div className="flex items-center justify-center py-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Faça login para comentar</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

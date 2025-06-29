"use client"

import { useState, useEffect, useRef } from "react"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Heart, Reply, Trash2, MoreHorizontal, Loader2, ArrowLeft } from "lucide-react"
import { createComment, getComments, toggleCommentLike, deleteComment } from "@/app/actions/comments"
import type { Comment } from "@/types/comments"
import { createClient } from "@/lib/supabase/client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface CommentsSheetProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  postTitle: string
}

export function CommentsSheet({ isOpen, onClose, postId, postTitle }: CommentsSheetProps) {
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [isCommentFocused, setIsCommentFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const commentsContainerRef = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchComments()
      fetchCurrentUser()
    }
  }, [isOpen, postId])

  // Detectar teclado virtual em dispositivos móveis
  useEffect(() => {
    const detectKeyboard = () => {
      const isKeyboard = window.innerHeight < window.outerHeight * 0.75
      setIsKeyboardVisible(isKeyboard)
    }

    window.addEventListener("resize", detectKeyboard)
    return () => window.removeEventListener("resize", detectKeyboard)
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setCurrentUser(profile)
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
    }
  }

  const fetchComments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedComments = await getComments(postId)
      setComments(fetchedComments)
    } catch (error) {
      console.error("Erro ao buscar comentários:", error)
      setError("Erro ao carregar comentários. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("postId", postId)
      formData.append("content", newComment.trim())

      await createComment(formData)
      setNewComment("")
      await fetchComments()

      // Focar no textarea após enviar
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    } catch (error) {
      console.error("Erro ao enviar comentário:", error)
      setError("Erro ao enviar comentário. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("postId", postId)
      formData.append("content", replyContent.trim())
      formData.append("parentId", parentId)

      await createComment(formData)
      setReplyContent("")
      setReplyingTo(null)
      await fetchComments()
    } catch (error) {
      console.error("Erro ao enviar resposta:", error)
      setError("Erro ao enviar resposta. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    try {
      await toggleCommentLike(commentId)
      await fetchComments()
    } catch (error) {
      console.error("Erro ao curtir comentário:", error)
      setError("Erro ao curtir comentário.")
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (confirm("Tem certeza que deseja deletar este comentário?")) {
      try {
        await deleteComment(commentId)
        await fetchComments()
      } catch (error) {
        console.error("Erro ao deletar comentário:", error)
        setError("Erro ao deletar comentário.")
      }
    }
  }

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const commentDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora"
    if (diffInMinutes < 60) return `${diffInMinutes}min`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
    return `${Math.floor(diffInMinutes / 1440)}d`
  }

  const CommentComponent = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? "ml-8 mt-3" : "mb-4"}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.profiles?.avatar_url || "/placeholder.svg"} alt={comment.profiles?.full_name || ""} />
        <AvatarFallback className="text-xs">
          {(comment.profiles?.full_name || comment.profiles?.username || "U").charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="bg-gray-50 rounded-lg p-3 relative">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium">
              {comment.profiles?.full_name || comment.profiles?.username || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground">•</p>
            <p className="text-xs text-muted-foreground">{formatTimeAgo(comment.created_at)}</p>

            {currentUser?.id === comment.user_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto absolute top-2 right-2">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p className="text-sm">{comment.content}</p>
        </div>

        <div className="flex items-center gap-4 pt-1 px-2">
          <button
            onClick={() => handleLikeComment(comment.id)}
            className={`flex items-center gap-1 text-xs ${
              comment.is_liked ? "text-red-500 font-medium" : "text-muted-foreground hover:text-red-500"
            } transition-colors`}
          >
            <Heart className={`w-3 h-3 ${comment.is_liked ? "fill-red-500 text-red-500" : ""}`} />
            <span className={comment.is_liked ? "font-medium" : ""}>
              {comment.likes_count > 0 ? comment.likes_count : "Curtir"}
            </span>
          </button>

          {!isReply && currentUser && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors"
            >
              <Reply className="w-3 h-3" />
              Responder
            </button>
          )}
        </div>

        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={currentUser?.avatar_url || "/placeholder.svg"} alt={currentUser?.full_name || ""} />
                <AvatarFallback className="text-xs">
                  {(currentUser?.full_name || currentUser?.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 relative">
                <Textarea
                  placeholder={`Respondendo para @${comment.profiles?.username || "usuario"}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={2}
                  className="resize-none text-sm min-h-[60px] pr-10"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-2 bottom-2 h-6 w-6 p-0 rounded-full"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentComponent key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`comments-sheet-container ${isOpen ? "comments-sheet-open" : ""}`}>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="" className="comments-sheet">
        <div className="flex flex-col" style={{ height: isKeyboardVisible ? "70vh" : "85vh" }}>
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b flex items-center gap-3 p-4 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium">Comentários</h3>
              <p className="text-xs text-muted-foreground truncate">{postTitle}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 m-4 flex-shrink-0">
              <p className="text-sm text-red-600">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchComments} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Comments List - Área scrollável */}
          <div
            ref={commentsContainerRef}
            className="flex-1 overflow-y-auto py-4 px-4 comments-scrollable"
            style={{
              maxHeight: isKeyboardVisible ? "calc(70vh - 140px)" : "calc(85vh - 140px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Carregando comentários...</p>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentComponent key={comment.id} comment={comment} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Seja o primeiro a comentar!</p>
              </div>
            )}
          </div>

          {/* Fixed Comment Input */}
          <div
            ref={commentInputRef}
            className="border-t pt-3 pb-3 px-4 flex-shrink-0 bg-white sticky bottom-0 comment-input-container"
          >
            {currentUser ? (
              <div className="flex gap-3 items-end">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={currentUser.avatar_url || "/placeholder.svg"} alt={currentUser.full_name || ""} />
                  <AvatarFallback className="text-xs">
                    {(currentUser.full_name || currentUser.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onFocus={() => setIsCommentFocused(true)}
                    onBlur={() => setIsCommentFocused(false)}
                    rows={1}
                    className="resize-none pr-10 min-h-[40px] py-2 text-sm"
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                    size="sm"
                    variant="ghost"
                    className="absolute right-2 bottom-2 h-6 w-6 p-0 rounded-full"
                  >
                    {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Faça login para comentar</p>
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

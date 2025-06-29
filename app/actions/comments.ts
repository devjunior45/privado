"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createComment(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const postId = formData.get("postId") as string
  const content = formData.get("content") as string
  const parentId = formData.get("parentId") as string | null

  if (!content.trim()) {
    throw new Error("Comentário não pode estar vazio")
  }

  const { error } = await supabase.from("job_comments").insert({
    post_id: postId,
    user_id: user.id,
    parent_id: parentId || null,
    content: content.trim(),
  })

  if (error) {
    console.error("Erro ao criar comentário:", error)
    throw new Error("Erro ao criar comentário: " + error.message)
  }

  revalidatePath("/")
}

export async function getComments(postId: string) {
  const supabase = await createClient()

  try {
    // Buscar comentários com join explícito
    const { data: comments, error } = await supabase
      .from("job_comments")
      .select(`
        id,
        post_id,
        user_id,
        parent_id,
        content,
        likes_count,
        created_at,
        updated_at,
        profiles!job_comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Erro ao buscar comentários:", error)
      return []
    }

    if (!comments) {
      return []
    }

    // Buscar curtidas do usuário atual se estiver logado
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userLikes = new Set<string>()
    if (user && comments.length > 0) {
      const { data: likes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in(
          "comment_id",
          comments.map((c) => c.id),
        )

      userLikes = new Set(likes?.map((like) => like.comment_id) || [])
    }

    // Adicionar informação de curtida
    const commentsWithLikes = comments.map((comment) => ({
      ...comment,
      is_liked: userLikes.has(comment.id),
    }))

    // Separar comentários principais e respostas
    const mainComments = commentsWithLikes.filter((comment) => !comment.parent_id)
    const replies = commentsWithLikes.filter((comment) => comment.parent_id)

    // Organizar respostas por comentário pai
    const commentsWithReplies = mainComments.map((comment) => ({
      ...comment,
      replies: replies.filter((reply) => reply.parent_id === comment.id),
    }))

    return commentsWithReplies
  } catch (error) {
    console.error("Erro ao buscar comentários:", error)
    return []
  }
}

export async function toggleCommentLike(commentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  try {
    // Verificar se já curtiu
    const { data: existingLike } = await supabase
      .from("comment_likes")
      .select("id")
      .eq("comment_id", commentId)
      .eq("user_id", user.id)
      .single()

    if (existingLike) {
      // Remover curtida
      await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id)

      // Decrementar contador
      await supabase.rpc("decrement_comment_likes", { comment_id: commentId })
    } else {
      // Adicionar curtida
      await supabase.from("comment_likes").insert({
        comment_id: commentId,
        user_id: user.id,
      })

      // Incrementar contador
      await supabase.rpc("increment_comment_likes", { comment_id: commentId })
    }

    revalidatePath("/")
  } catch (error) {
    console.error("Erro ao curtir comentário:", error)
    throw new Error("Erro ao curtir comentário: " + error.message)
  }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  try {
    const { error } = await supabase.from("job_comments").delete().eq("id", commentId).eq("user_id", user.id)

    if (error) {
      throw new Error("Erro ao deletar comentário: " + error.message)
    }

    revalidatePath("/")
  } catch (error) {
    console.error("Erro ao deletar comentário:", error)
    throw error
  }
}

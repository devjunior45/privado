export function calculateJobImportance(likes: number, createdAt: string): number {
  const now = new Date()
  const postDate = new Date(createdAt)
  const hoursSincePost = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60)

  // Fórmula base: curtidas / ((horas_desde_postagem + 2) ^ 1.3)
  let importance = likes / Math.pow(hoursSincePost + 2, 1.3)

  // Boost para postagens recentes
  if (hoursSincePost < 1) {
    importance *= 3
  } else if (hoursSincePost < 3) {
    importance *= 2
  } else if (hoursSincePost < 6) {
    importance *= 1.5
  }

  return importance
}

export function sortJobsByImportance<T extends { likes_count: number; created_at: string }>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    const importanceA = calculateJobImportance(a.likes_count || 0, a.created_at)
    const importanceB = calculateJobImportance(b.likes_count || 0, b.created_at)
    return importanceB - importanceA // Ordem decrescente (maior importância primeiro)
  })
}

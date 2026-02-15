export function calculateJobImportance(likes: number, createdAt: string, isPremium?: boolean): number {
  // Vagas premium sempre têm score máximo
  if (isPremium) {
    return Number.MAX_SAFE_INTEGER
  }

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

export function sortJobsByImportance<T extends { likes_count: number; created_at: string; premium?: number | boolean }>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => {
    const isPremiumA = a.premium === 1 || a.premium === true
    const isPremiumB = b.premium === 1 || b.premium === true
    
    const importanceA = calculateJobImportance(a.likes_count || 0, a.created_at, isPremiumA)
    const importanceB = calculateJobImportance(b.likes_count || 0, b.created_at, isPremiumB)
    return importanceB - importanceA // Ordem decrescente (maior importância primeiro)
  })
}

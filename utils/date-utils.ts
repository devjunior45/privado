export function getRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return "hoje"
  } else if (diffInDays === 1) {
    return "ontem"
  } else if (diffInDays === 2) {
    return "a 2 dias"
  } else {
    return date.toLocaleDateString("pt-BR")
  }
}

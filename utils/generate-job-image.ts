export const backgroundColors = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
]

export function generateJobImage(
  title: string,
  company: string,
  backgroundColor: string = backgroundColors[0],
): string {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) return ""

  canvas.width = 400
  canvas.height = 400

  // Background
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Title
  ctx.fillStyle = "white"
  ctx.font = "bold 24px Arial"
  ctx.textAlign = "center"

  const titleLines = wrapText(ctx, title, canvas.width - 40)
  titleLines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, 150 + index * 30)
  })

  // Company
  ctx.font = "18px Arial"
  ctx.fillText(company, canvas.width / 2, 250)

  return canvas.toDataURL()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const width = ctx.measureText(currentLine + " " + word).width
    if (width < maxWidth) {
      currentLine += " " + word
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)
  return lines
}

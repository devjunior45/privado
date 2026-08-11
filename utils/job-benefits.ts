// Opções de benefícios disponíveis para seleção nas vagas.
export const BENEFITS_OPTIONS = [
  "Vale-transporte",
  "Auxílio Combustível",
  "Auxílio Educação",
  "Plano de Saúde",
  "Plano Odontológico",
  "Estacionamento Privativo",
  "Seguro de Vida",
  "Refeitório Interno",
  "Convênios Variados",
] as const

// Marcador usado para delimitar o bloco de benefícios dentro da descrição.
const BENEFITS_MARKER = "**Benefícios:**"

/**
 * Monta a descrição final incluindo o bloco de benefícios formatado ao final.
 * Mantém a mesma formatação exibida aos candidatos: cada benefício em uma linha
 * terminada por ";" sob o título em negrito "**Benefícios:**".
 */
export function buildDescriptionWithBenefits(baseDescription: string, benefits: string[]): string {
  const trimmed = (baseDescription || "").trimEnd()
  if (!benefits || benefits.length === 0) return trimmed
  const list = benefits.map((b) => `${b};`).join("\n")
  const block = `${BENEFITS_MARKER}\n${list}`
  return trimmed ? `${trimmed}\n\n${block}` : block
}

/**
 * Remove o bloco de benefícios auto-gerado da descrição, retornando apenas o
 * texto base. Usado ao editar, para o textarea não exibir (nem duplicar) o bloco.
 */
export function stripBenefitsFromDescription(description: string): string {
  if (!description) return ""
  const idx = description.indexOf(BENEFITS_MARKER)
  if (idx === -1) return description
  return description.slice(0, idx).trimEnd()
}

/**
 * Extrai os nomes de benefícios do bloco dentro da descrição.
 * Serve de fallback para vagas antigas criadas antes do campo `benefits`
 * existir, garantindo que os botões apareçam pré-selecionados na edição.
 */
export function parseBenefitsFromDescription(description: string): string[] {
  if (!description) return []
  const idx = description.indexOf(BENEFITS_MARKER)
  if (idx === -1) return []
  const block = description.slice(idx + BENEFITS_MARKER.length)
  const found = block
    .split("\n")
    .map((line) => line.trim().replace(/;$/, "").trim())
    .filter(Boolean)
  // Mantém apenas benefícios conhecidos, evitando capturar texto solto.
  return (BENEFITS_OPTIONS as readonly string[]).filter((option) => found.includes(option))
}

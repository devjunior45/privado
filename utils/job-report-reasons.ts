export const REPORT_REASONS = [
  "Linguagem ofensiva",
  "Dados desatualizados",
  "Redirecionamento suspeito",
  "Vaga inexistente",
  "Uso de identidade falsa",
  "Outro",
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]

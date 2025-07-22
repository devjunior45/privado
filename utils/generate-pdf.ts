import jsPDF from "jspdf"
import type { UserProfile } from "@/types/profile"

export async function generateResumePDF(profile: UserProfile): Promise<string> {
  const pdf = new jsPDF()

  // Configurações iniciais
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 20
  const lineHeight = 7
  let yPosition = margin

  // Função auxiliar para adicionar texto com quebra de linha
  const addText = (text: string, fontSize = 10, isBold = false) => {
    pdf.setFontSize(fontSize)
    if (isBold) {
      pdf.setFont("helvetica", "bold")
    } else {
      pdf.setFont("helvetica", "normal")
    }

    const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin)
    pdf.text(lines, margin, yPosition)
    yPosition += lines.length * lineHeight
  }

  // Função para adicionar espaçamento
  const addSpace = (space = lineHeight) => {
    yPosition += space
  }

  // Cabeçalho com nome
  addText(profile.full_name || profile.username, 18, true)
  addSpace()

  // Badge de Primeiro Emprego (se aplicável)
  if (profile.is_first_job) {
    pdf.setFillColor(59, 130, 246) // Cor azul
    pdf.setTextColor(255, 255, 255) // Texto branco
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "bold")

    const badgeText = "★ PRIMEIRO EMPREGO"
    const textWidth = pdf.getTextWidth(badgeText)
    const badgeWidth = textWidth + 10
    const badgeHeight = 8

    // Desenhar o badge
    pdf.roundedRect(margin, yPosition - 2, badgeWidth, badgeHeight, 2, 2, "F")
    pdf.text(badgeText, margin + 5, yPosition + 3)

    // Resetar cor do texto
    pdf.setTextColor(0, 0, 0)
    yPosition += badgeHeight + 5
  }

  // Informações de contato
  if (profile.city || profile.state) {
    const location = `${profile.city || ""}${profile.city && profile.state ? ", " : ""}${profile.state || ""}`
    addText(`📍 ${location}`)
  }

  if (profile.whatsapp) {
    addText(`📱 ${profile.whatsapp}`)
  }

  if (profile.email) {
    addText(`✉️ ${profile.email}`)
  }

  addSpace(10)

  // Resumo Profissional
  if (profile.professional_summary) {
    addText("RESUMO PROFISSIONAL", 12, true)
    addSpace(3)
    addText(profile.professional_summary)
    addSpace(10)
  }

  // Habilidades
  if (profile.skills && profile.skills.length > 0) {
    addText("HABILIDADES", 12, true)
    addSpace(3)
    addText(profile.skills.join(" • "))
    addSpace(10)
  }

  // Experiência Profissional
  if (profile.experiences && profile.experiences.length > 0) {
    addText("EXPERIÊNCIA PROFISSIONAL", 12, true)
    addSpace(5)

    profile.experiences.forEach((exp) => {
      addText(exp.position, 11, true)
      if (exp.company) {
        addText(exp.company)
      }

      // Período
      if (exp.startDate || exp.endDate) {
        let period = ""
        if (exp.startDate) {
          const startDate = new Date(exp.startDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
          period = startDate
        }
        if (exp.isCurrentJob) {
          period += " - Atual"
        } else if (exp.endDate) {
          const endDate = new Date(exp.endDate).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
          period += ` - ${endDate}`
        }
        addText(period, 9)
      }

      if (exp.activities) {
        addText(exp.activities, 9)
      }
      addSpace(8)
    })
  }

  // Formação
  if (profile.education && profile.education.length > 0) {
    addText("FORMAÇÃO", 12, true)
    addSpace(5)

    profile.education.forEach((edu) => {
      if (edu.level === "Ensino Fundamental" || edu.level === "Ensino Médio") {
        addText(edu.level, 11, true)
      } else {
        addText(edu.courseName || edu.level, 11, true)
      }

      addText(edu.institution)

      const status = edu.status || "concluído"
      let statusText = status.charAt(0).toUpperCase() + status.slice(1)
      if ((status === "concluído" || !status) && edu.completionYear) {
        statusText += ` em ${edu.completionYear}`
      }
      addText(statusText, 9)
      addSpace(8)
    })
  }

  // Cursos
  if (profile.courses && profile.courses.length > 0) {
    addText("CURSOS", 12, true)
    addSpace(5)

    profile.courses.forEach((course) => {
      addText(course.name, 11, true)
      addText(course.institution)

      let courseInfo = course.isComplete ? "Concluído" : "Em andamento"
      if (course.duration) {
        courseInfo += ` • ${course.duration}`
      }
      if (course.completionYear) {
        courseInfo += ` • ${course.completionYear}`
      }
      addText(courseInfo, 9)
      addSpace(8)
    })
  }

  // CNH
  if (profile.cnh_types && profile.cnh_types.length > 0) {
    addText("CARTEIRA DE HABILITAÇÃO", 12, true)
    addSpace(3)
    addText(`CNH: ${profile.cnh_types.join(", ")}`)
    addSpace(10)
  }

  // Retornar o PDF como data URL
  return pdf.output("dataurlstring")
}

import { jsPDF } from "jspdf"
import type { UserProfile, Experience, Education, Course } from "@/types/profile"

export async function generateResumePDF(profile: UserProfile): Promise<string> {
  // Criar um novo documento PDF
  const doc = new jsPDF()

  // Configurações de fonte
  const titleFont = "helvetica"
  const normalFont = "helvetica"

  // Margens e configurações
  const margin = 20
  const pageHeight = 297 // A4 height in mm
  const maxY = pageHeight - 30 // Leave space for footer
  let y = margin

  // Função para verificar se precisa de nova página
  const checkNewPage = (requiredSpace = 10) => {
    if (y + requiredSpace > maxY) {
      doc.addPage()
      y = margin
    }
  }

  // Função para texto seguro (evita null/undefined)
  const safeText = (text: any): string => {
    if (text === null || text === undefined) return ""
    return String(text).trim()
  }

  // Título
  doc.setFont(titleFont, "bold")
  doc.setFontSize(18)
  const fullName = safeText(profile.full_name || profile.username)
  if (fullName) {
    doc.text(fullName, margin, y)
  }
  y += 10

  // Informações de contato
  doc.setFont(normalFont, "normal")
  doc.setFontSize(10)

  const contactInfo = []

  if (profile.city || profile.state) {
    const location = `${safeText(profile.city)}${profile.city && profile.state ? ", " : ""}${safeText(profile.state)}`
    if (location.trim()) contactInfo.push(location)
  }

  if (profile.email) {
    contactInfo.push(`Email: ${safeText(profile.email)}`)
  }

  if (profile.whatsapp) {
    contactInfo.push(`WhatsApp: ${safeText(profile.whatsapp)}`)
  }

  if (profile.cnh_types && Array.isArray(profile.cnh_types) && profile.cnh_types.length > 0) {
    contactInfo.push(`CNH: ${profile.cnh_types.join(", ")}`)
  }

  if (contactInfo.length > 0) {
    doc.text(contactInfo.join(" | "), margin, y)
  }
  y += 10

  // Linha separadora
  doc.setDrawColor(200)
  doc.line(margin, y, 210 - margin, y)
  y += 10

  // Resumo profissional
  if (profile.professional_summary) {
    checkNewPage(20)

    doc.setFont(titleFont, "bold")
    doc.setFontSize(12)
    doc.text("RESUMO PROFISSIONAL", margin, y)
    y += 6

    doc.setFont(normalFont, "normal")
    doc.setFontSize(10)

    const summary = safeText(profile.professional_summary)
    if (summary) {
      const summaryLines = doc.splitTextToSize(summary, 170)
      doc.text(summaryLines, margin, y)
      y += summaryLines.length * 5 + 5
    }
  }

  // Habilidades
  if (profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
    checkNewPage(15)

    doc.setFont(titleFont, "bold")
    doc.setFontSize(12)
    doc.text("HABILIDADES", margin, y)
    y += 6

    doc.setFont(normalFont, "normal")
    doc.setFontSize(10)

    const skillsText = profile.skills.filter((skill) => skill && skill.trim()).join(", ")
    if (skillsText) {
      const skillsLines = doc.splitTextToSize(skillsText, 170)
      doc.text(skillsLines, margin, y)
      y += skillsLines.length * 5 + 5
    }
  }

  // Experiência profissional
  if (profile.experiences && Array.isArray(profile.experiences) && profile.experiences.length > 0) {
    checkNewPage(20)

    doc.setFont(titleFont, "bold")
    doc.setFontSize(12)
    doc.text("EXPERIÊNCIA PROFISSIONAL", margin, y)
    y += 8

    const experiences = profile.experiences as Experience[]
    experiences.forEach((exp) => {
      checkNewPage(25)

      // Cargo
      const position = safeText(exp.position)
      if (position) {
        doc.setFont(normalFont, "bold")
        doc.setFontSize(11)
        doc.text(position, margin, y)
        y += 5
      }

      // Empresa
      if (exp.company) {
        const company = safeText(exp.company)
        if (company) {
          doc.setFont(normalFont, "normal")
          doc.setFontSize(10)
          doc.text(company, margin, y)
          y += 5
        }
      }

      // Período
      if (exp.startDate || exp.endDate) {
        doc.setFont(normalFont, "normal")
        doc.setFontSize(9)
        let period = ""

        if (exp.startDate) {
          try {
            const startDate = new Date(exp.startDate).toLocaleDateString("pt-BR", {
              month: "short",
              year: "numeric",
            })
            period = startDate

            if (exp.isCurrentJob) {
              period += " - Atual"
            } else if (exp.endDate) {
              const endDate = new Date(exp.endDate).toLocaleDateString("pt-BR", {
                month: "short",
                year: "numeric",
              })
              period += ` - ${endDate}`
            }
          } catch (error) {
            // Se houver erro na data, usar texto simples
            period = exp.isCurrentJob ? "Atual" : ""
          }
        }

        if (period) {
          doc.text(period, margin, y)
          y += 5
        }
      }

      // Atividades
      if (exp.activities) {
        const activities = safeText(exp.activities)
        if (activities) {
          doc.setFont(normalFont, "normal")
          doc.setFontSize(9)
          const activitiesLines = doc.splitTextToSize(activities, 170)
          doc.text(activitiesLines, margin, y)
          y += activitiesLines.length * 4 + 3
        }
      }

      y += 3
    })

    y += 2
  }

  // Escolaridade
  if (profile.education && Array.isArray(profile.education) && profile.education.length > 0) {
    checkNewPage(20)

    doc.setFont(titleFont, "bold")
    doc.setFontSize(12)
    doc.text("FORMAÇÃO", margin, y)
    y += 8

    const education = profile.education as Education[]
    education.forEach((edu) => {
      checkNewPage(20)

      // Nível ou Nome do curso
      if (edu.level === "Ensino Fundamental" || edu.level === "Ensino Médio") {
        const level = safeText(edu.level)
        if (level) {
          doc.setFont(normalFont, "bold")
          doc.setFontSize(11)
          doc.text(level, margin, y)
          y += 5
        }
      } else {
        const courseName = safeText(edu.courseName || edu.level)
        if (courseName) {
          doc.setFont(normalFont, "bold")
          doc.setFontSize(11)
          doc.text(courseName, margin, y)
          y += 5
        }
      }

      // Instituição
      const institution = safeText(edu.institution)
      if (institution) {
        doc.setFont(normalFont, "normal")
        doc.setFontSize(10)
        doc.text(institution, margin, y)
        y += 5
      }

      // Status e ano
      doc.setFont(normalFont, "normal")
      doc.setFontSize(10)
      const status = edu.status || "concluído"
      const statusText =
        status === "concluído" && edu.completionYear ? `${status} em ${safeText(edu.completionYear)}` : status
      doc.text(statusText, margin, y)
      y += 8
    })

    y += 2
  }

  // Cursos
  if (profile.courses && Array.isArray(profile.courses) && profile.courses.length > 0) {
    checkNewPage(20)

    doc.setFont(titleFont, "bold")
    doc.setFontSize(12)
    doc.text("CURSOS", margin, y)
    y += 8

    const courses = profile.courses as Course[]
    courses.forEach((course) => {
      checkNewPage(15)

      // Nome do curso
      const courseName = safeText(course.name)
      if (courseName) {
        doc.setFont(normalFont, "bold")
        doc.setFontSize(11)
        doc.text(courseName, margin, y)
        y += 5
      }

      // Instituição
      if (course.institution) {
        const institution = safeText(course.institution)
        if (institution) {
          doc.setFont(normalFont, "normal")
          doc.setFontSize(10)
          doc.text(institution, margin, y)
          y += 5
        }
      }

      // Duração e ano
      if (course.duration || course.completionYear) {
        doc.setFont(normalFont, "normal")
        doc.setFontSize(9)
        const details = []
        if (course.duration) details.push(safeText(course.duration))
        if (course.completionYear) details.push(safeText(course.completionYear))

        const detailsText = details.filter((d) => d.trim()).join(" - ")
        if (detailsText) {
          doc.text(detailsText, margin, y)
          y += 5
        }
      }

      y += 3
    })

    y += 2
  }

  // Rodapé
  const today = new Date().toLocaleDateString("pt-BR")
  doc.setFontSize(8)
  doc.text(`Currículo gerado em ${today} via Nortão Empregos`, margin, pageHeight - 20)

  // Retornar o PDF como data URL
  return doc.output("dataurlstring")
}

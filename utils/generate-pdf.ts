import jsPDF from "jspdf"
import type { UserProfile } from "@/types/profile"

// Função para calcular idade
function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export async function generateResumePDF(profile: UserProfile): Promise<string> {
  const doc = new jsPDF()
  let yPosition = 20

  // Configurações de fonte
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")

  // Nome
  doc.text(profile.full_name || profile.username, 20, yPosition)
  yPosition += 10

  // Informações de contato e localização
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  const contactInfo = []

  // Idade (se tiver data de nascimento)
  if (profile.birth_date) {
    contactInfo.push(`Idade: ${calculateAge(profile.birth_date)} anos`)
  }

  // Endereço e Cidade na mesma linha
  const locationParts = []
  if (profile.address) {
    locationParts.push(profile.address)
  }
  if (profile.city && profile.state) {
    locationParts.push(`${profile.city}, ${profile.state}`)
  } else if (profile.city) {
    locationParts.push(profile.city)
  }
  if (locationParts.length > 0) {
    contactInfo.push(locationParts.join(" - "))
  }

  if (profile.whatsapp) {
    contactInfo.push(`WhatsApp: ${profile.whatsapp}`)
  }
  if (profile.email) {
    contactInfo.push(`Email: ${profile.email}`)
  }

  contactInfo.forEach((info) => {
    doc.text(info, 20, yPosition)
    yPosition += 5
  })

  yPosition += 5

  // Resumo Profissional
  if (profile.professional_summary) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Resumo Profissional", 20, yPosition)
    yPosition += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const summaryLines = doc.splitTextToSize(profile.professional_summary, 170)
    doc.text(summaryLines, 20, yPosition)
    yPosition += summaryLines.length * 5 + 5
  }

  // Habilidades
  if (profile.skills && profile.skills.length > 0) {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Habilidades", 20, yPosition)
    yPosition += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(profile.skills.join(" • "), 20, yPosition)
    yPosition += 10
  }

  // CNH
  if (profile.cnh_types && profile.cnh_types.length > 0) {
    doc.setFontSize(10)
    doc.text(`CNH: ${profile.cnh_types.join(", ")}`, 20, yPosition)
    yPosition += 10
  }

  // Experiências
  if (profile.experiences && profile.experiences.length > 0) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Experiência Profissional", 20, yPosition)
    yPosition += 7

    profile.experiences.forEach((exp) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(exp.position, 20, yPosition)
      yPosition += 5

      doc.setFont("helvetica", "normal")
      if (exp.company) {
        doc.text(exp.company, 20, yPosition)
        yPosition += 5
      }

      if (exp.startDate) {
        const period = exp.isCurrentJob
          ? `${new Date(exp.startDate).toLocaleDateString("pt-BR")} - Atual`
          : exp.endDate
            ? `${new Date(exp.startDate).toLocaleDateString("pt-BR")} - ${new Date(exp.endDate).toLocaleDateString("pt-BR")}`
            : new Date(exp.startDate).toLocaleDateString("pt-BR")

        doc.setFontSize(9)
        doc.text(period, 20, yPosition)
        yPosition += 5
      }

      if (exp.activities) {
        doc.setFontSize(9)
        const activitiesLines = doc.splitTextToSize(exp.activities, 170)
        doc.text(activitiesLines, 20, yPosition)
        yPosition += activitiesLines.length * 4 + 5
      }

      yPosition += 3
    })
  }

  // Primeiro Emprego
  if (profile.is_first_job && (!profile.experiences || profile.experiences.length === 0)) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Experiência Profissional", 20, yPosition)
    yPosition += 7

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Candidato em busca da primeira oportunidade profissional", 20, yPosition)
    yPosition += 10
  }

  // Formação
  if (profile.education && profile.education.length > 0) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Formação", 20, yPosition)
    yPosition += 7

    profile.education.forEach((edu) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")

      if (edu.level === "Ensino Fundamental" || edu.level === "Ensino Médio") {
        doc.text(edu.level, 20, yPosition)
      } else {
        doc.text(edu.courseName || edu.level, 20, yPosition)
      }
      yPosition += 5

      doc.setFont("helvetica", "normal")
      doc.text(edu.institution, 20, yPosition)
      yPosition += 5

      const status = edu.status || "concluído"
      const statusText =
        status === "concluído" && edu.completionYear
          ? `Concluído em ${edu.completionYear}`
          : status.charAt(0).toUpperCase() + status.slice(1)

      doc.setFontSize(9)
      doc.text(statusText, 20, yPosition)
      yPosition += 8
    })
  }

  // Cursos
  if (profile.courses && profile.courses.length > 0) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Cursos", 20, yPosition)
    yPosition += 7

    profile.courses.forEach((course) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(course.name, 20, yPosition)
      yPosition += 5

      doc.setFont("helvetica", "normal")
      doc.text(course.institution, 20, yPosition)
      yPosition += 5

      const courseInfo = []
      courseInfo.push(course.isComplete ? "Concluído" : "Em andamento")
      if (course.duration) courseInfo.push(course.duration)
      if (course.completionYear) courseInfo.push(course.completionYear)

      doc.setFontSize(9)
      doc.text(courseInfo.join(" • "), 20, yPosition)
      yPosition += 8
    })
  }

  // Rodapé - adicionar em todas as páginas
  const pageCount = doc.getNumberOfPages()
  const today = new Date().toLocaleDateString("pt-BR")

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(128, 128, 128) // Cor cinza
    doc.text(`Gerado em ${today} via Busca Empregos`, 20, 287)
  }

  // Converter para data URL
  const pdfDataUrl = doc.output("dataurlstring")
  return pdfDataUrl
}

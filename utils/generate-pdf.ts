import jsPDF from "jspdf"

interface Profile {
  name: string
  email: string
  phone: string
  linkedin: string
  github: string
  skills: string[]
  experiences: {
    company: string
    title: string
    start_date: string
    end_date: string
    description: string
  }[]
  education: {
    institution: string
    degree: string
    start_date: string
    end_date: string
    description: string
  }[]
  is_first_job: boolean
}

export const generateResumePDF = (profile: Profile) => {
  const doc = new jsPDF()

  const margin = 10
  let currentY = margin
  const lineHeight = 7

  // Nome
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(profile.name, margin, currentY)
  currentY += 10

  // Contato
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Email: ${profile.email}`, margin, currentY)
  currentY += lineHeight
  doc.text(`Telefone: ${profile.phone}`, margin, currentY)
  currentY += lineHeight
  doc.text(`LinkedIn: ${profile.linkedin}`, margin, currentY)
  currentY += lineHeight
  doc.text(`GitHub: ${profile.github}`, margin, currentY)
  currentY += 10

  // Habilidades
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Habilidades", margin, currentY)
  currentY += lineHeight
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  profile.skills.forEach((skill) => {
    doc.text(`- ${skill}`, margin, currentY)
    currentY += lineHeight
  })
  currentY += 10

  // Experiências Profissionais
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Experiências Profissionais", margin, currentY)
  currentY += lineHeight

  // Adicionar "Primeiro Emprego" se aplicável
  if (profile.is_first_job) {
    doc.setFont("helvetica", "bold")
    doc.text("Primeiro Emprego", margin, currentY)
    currentY += lineHeight
    doc.setFont("helvetica", "normal")
    currentY += 5 // Espaço extra
  }

  profile.experiences.forEach((experience) => {
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(experience.company, margin, currentY)
    currentY += lineHeight
    doc.setFont("helvetica", "normal")
    doc.text(`${experience.title} (${experience.start_date} - ${experience.end_date})`, margin, currentY)
    currentY += lineHeight
    const descriptionLines = doc.splitTextToSize(experience.description, doc.internal.pageSize.getWidth() - 2 * margin)
    descriptionLines.forEach((line) => {
      doc.text(line, margin, currentY)
      currentY += lineHeight
    })
    currentY += 10
  })

  // Formação Acadêmica
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Formação Acadêmica", margin, currentY)
  currentY += lineHeight
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  profile.education.forEach((education) => {
    doc.setFont("helvetica", "bold")
    doc.text(education.institution, margin, currentY)
    currentY += lineHeight
    doc.setFont("helvetica", "normal")
    doc.text(`${education.degree} (${education.start_date} - ${education.end_date})`, margin, currentY)
    currentY += lineHeight
    const descriptionLines = doc.splitTextToSize(education.description, doc.internal.pageSize.getWidth() - 2 * margin)
    descriptionLines.forEach((line) => {
      doc.text(line, margin, currentY)
      currentY += lineHeight
    })
    currentY += 10
  })

  return doc.output("dataurlstring")
}

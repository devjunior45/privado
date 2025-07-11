import { createClient } from "@/lib/supabase/client"

export function generateUsernameFromName(fullName: string): string {
  // Remove acentos e caracteres especiais
  const cleanName = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove tudo que não for letra ou número
    .substring(0, 15) // Limita a 15 caracteres

  // Gera 3 números aleatórios
  const randomNumbers = Math.floor(Math.random() * 900) + 100 // Entre 100 e 999

  return `${cleanName}${randomNumbers}`
}

export async function generateUniqueUsername(fullName: string): Promise<string> {
  const supabase = createClient()
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const username = generateUsernameFromName(fullName)

    // Verifica se o username já existe
    const { data: existingUser } = await supabase.from("profiles").select("username").eq("username", username).single()

    if (!existingUser) {
      return username
    }

    attempts++
  }

  // Se não conseguir gerar um username único, adiciona timestamp
  const fallbackUsername = generateUsernameFromName(fullName) + Date.now().toString().slice(-4)
  return fallbackUsername
}

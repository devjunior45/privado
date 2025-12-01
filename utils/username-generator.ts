import { createClient } from "@/lib/supabase/client"

// Remove acentos e caracteres especiais
function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
}

// Gera 3 números aleatórios
function generateRandomNumbers(): string {
  return Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
}

// Verifica se o username já existe
async function usernameExists(username: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase.from("profiles").select("username").eq("username", username).single()

  return !!data
}

// Gera um username único
export async function generateUniqueUsername(fullName: string): Promise<string> {
  const baseName = removeAccents(fullName.split(" ")[0]) // Pega apenas o primeiro nome

  // Tenta até 10 vezes gerar um username único
  for (let i = 0; i < 10; i++) {
    const randomNumbers = generateRandomNumbers()
    const username = `${baseName}${randomNumbers}`

    const exists = await usernameExists(username)
    if (!exists) {
      return username
    }
  }

  // Se não conseguir gerar um único, usa timestamp como fallback
  const timestamp = Date.now().toString().slice(-3)
  return `${baseName}${timestamp}`
}

export async function generateUsernameFromPhone(phone: string): Promise<string> {
  const supabase = createClient()

  // Remove caracteres especiais e pega apenas números
  const cleanPhone = phone.replace(/\D/g, "")

  // Usa os últimos 8 dígitos do telefone como base
  const phoneBase = cleanPhone.slice(-8)

  // Tenta gerar username único com prefixo "user"
  for (let i = 0; i < 10; i++) {
    const randomSuffix = Math.floor(Math.random() * 100)
      .toString()
      .padStart(2, "0")
    const username = `user${phoneBase.slice(-4)}${randomSuffix}`

    const { data } = await supabase.from("profiles").select("username").eq("username", username).single()

    if (!data) {
      return username
    }
  }

  // Fallback com timestamp
  const timestamp = Date.now().toString().slice(-4)
  return `user${phoneBase.slice(-4)}${timestamp}`
}

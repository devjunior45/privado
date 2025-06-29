import { redirect } from "next/navigation"

export default async function Home() {
  // Redirecionar diretamente para o feed (sem necessidade de login)
  redirect("/feed")
}

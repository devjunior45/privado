import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileView } from "@/components/profile/profile-view"
import { RecruiterPublicView } from "@/components/profile/recruiter-public-view"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = createClient()

  // Buscar o perfil pelo username
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("username", params.username).single()

  if (error || !profile) {
    notFound()
  }

  // Verificar se é um recrutador
  const isRecruiter = profile.user_type === "recruiter"

  if (isRecruiter) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
            <Link href="/feed">
              <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </Link>
            <h1 className="text-lg font-semibold">@{profile.username}</h1>
            <div className="w-6" />
          </div>
        </div>
        <RecruiterPublicView profile={profile} />
      </div>
    )
  }

  // Para candidatos
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Link href="/feed">
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-lg font-semibold">@{profile.username}</h1>
          <div className="w-6" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-4">
        <ProfileView profile={profile} isOwnProfile={false} />
      </div>
    </div>
  )
}

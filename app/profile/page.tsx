import { createClient } from "@/lib/supabase/server"
import { ProfileView } from "@/components/profile/profile-view"
import { RecruiterProfile } from "@/components/profile/recruiter-profile"
import { redirect } from "next/navigation"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/")
  }

  const isRecruiter = profile.user_type === "recruiter"

  return (
    <PageContainer
      header={<PageHeader title={isRecruiter ? "Perfil da Empresa" : "Meu Perfil"} userProfile={profile} />}
    >
      {isRecruiter ? (
        <RecruiterProfile profile={profile} isOwnProfile={true} />
      ) : (
        <ProfileView profile={profile} isOwnProfile={true} />
      )}
    </PageContainer>
  )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { ProfileView } from "@/components/profile/profile-view"
import { RecruiterProfile } from "@/components/profile/recruiter-profile"
import { PageContainer } from "@/components/page-container"
import { LoginPrompt } from "@/components/auth/login-prompt"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <PageContainer>
        <div className="md:hidden">
          <Header title="Perfil" isLoggedIn={false} />
        </div>
        <div className="mx-4 md:mx-0 py-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Crie seu perfil profissional</h2>
              <p className="text-muted-foreground mb-4">
                Faça login ou cadastre-se para ter um perfil e um currículo pronto para participar de vagas
              </p>
            </div>
            <LoginPrompt />
          </div>
        </div>
      </PageContainer>
    )
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/login")
  }

  const isRecruiter = profile.user_type === "recruiter"

  return (
    <PageContainer>
      <div className="md:hidden">
        <Header title={isRecruiter ? "Perfil da Empresa" : "Meu Perfil"} isLoggedIn={true} showSettings={true} />
      </div>
      <div className="mx-4 md:mx-0">
        {isRecruiter ? (
          <RecruiterProfile profile={profile} isOwnProfile={true} />
        ) : (
          <ProfileView profile={profile} isOwnProfile={true} />
        )}
      </div>
    </PageContainer>
  )
}

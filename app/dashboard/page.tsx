import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RecruiterDashboard } from "@/components/recruiter/dashboard"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verificar se é recrutador
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, username, full_name, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile || profile.user_type !== "recruiter") {
    redirect("/")
  }

  return (
    <div className="mx-4 md:mx-0">
      <PageContainer header={<PageHeader title="Dashboard" userProfile={profile} />}>
        <RecruiterDashboard recruiterId={user.id} />
      </PageContainer>
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { JobCandidatesPage } from "@/components/recruiter/job-candidates-page"

interface PageProps {
  params: {
    jobId: string
  }
}

export default async function CandidatesPage({ params }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verificar se a vaga pertence ao usuário
  const { data: job } = await supabase
    .from("job_posts")
    .select("id, title, company, author_id")
    .eq("id", params.jobId)
    .single()

  if (!job || job.author_id !== user.id) {
    redirect("/dashboard")
  }

  return <JobCandidatesPage jobId={params.jobId} jobTitle={job.title} jobCompany={job.company} />
}

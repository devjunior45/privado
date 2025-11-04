import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  try {
    // 🔐 Verifica autorização com token secreto
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return res.status(401).json({ error: "Acesso não autorizado" });
    }

    // 1️⃣ Busca todos os recrutadores verificados
    const { data: recruiters, error: recruiterError } = await supabase
      .from("profiles")
      .select("id, full_name, whatsapp")
      .eq("user_type", "recruiter")
      .eq("is_verified", true);

    if (recruiterError) throw recruiterError;

    // 2️⃣ Percorre cada recrutador
    for (const recruiter of recruiters) {
      if (!recruiter.whatsapp) continue;

      // Adiciona o prefixo 55 automaticamente
      const phoneNumber = recruiter.whatsapp.startsWith("55")
        ? recruiter.whatsapp
        : `55${recruiter.whatsapp.replace(/\D/g, "")}`;

      // Busca vagas ativas do recrutador
      const { data: jobPosts, error: jobError } = await supabase
        .from("job_posts")
        .select("id, title, status, created_at")
        .eq("author_id", recruiter.id)
        .eq("status", "ativa");

      if (jobError) throw jobError;

      // Se não tiver vagas ativas, envia uma mensagem simples e pula para o próximo recrutador
      if (!jobPosts || jobPosts.length === 0) {
        const text = `👋 Olá ${recruiter.full_name}!
Você ainda não possui vagas ativas no momento. 🚫

Publique novas vagas em seu painel para começar a receber candidaturas!`;

        await fetch(`https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: { body: text },
          }),
        });

        continue; // passa para o próximo recrutador
      }

      // Conta candidaturas das últimas 24h
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { count: newApplications, error: appError } = await supabase
        .from("job_applications")
        .select("*", { count: "exact" })
        .in(
          "job_id",
          jobPosts.map((j) => j.id).length > 0
            ? jobPosts.map((j) => j.id)
            : ["00000000-0000-0000-0000-000000000000"]
        )
        .gte("created_at", yesterday);

      if (appError) throw appError;

      // Monta o texto do resumo diário
      const text = `👋 Olá ${recruiter.full_name}!

Aqui está seu resumo diário de vagas 👇

📊 Vagas ativas: ${jobPosts.length}
👤 Novas candidaturas nas últimas 24h: ${newApplications || 0}

O que deseja fazer agora?
1️⃣ Ver minhas vagas
2️⃣ Encerrar uma vaga`;

      // Envia via API do WhatsApp
      await fetch(`https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: text },
        }),
      });
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Erro ao enviar mensagens:", error);
    res.status(500).json({ error: error.message });
  }
}

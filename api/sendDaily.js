import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    // 🔒 PROTEÇÃO — DESATIVADA PARA TESTES
    // const auth = req.headers.authorization;
    // if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
    //   return res.status(401).json({ error: "Acesso não autorizado" });
    // }

    let output = [];
    output.push("🚀 Iniciando execução do script...");

    // 1️⃣ Busca recrutadores verificados
    const { data: recruiters, error: recruiterError } = await supabase
      .from("profiles")
      .select("id, full_name, whatsapp")
      .eq("user_type", "recruiter")
      .eq("is_verified", true);

    if (recruiterError) throw recruiterError;

    output.push(`👥 Recrutadores verificados encontrados: ${recruiters.length}`);

    // 2️⃣ Percorre cada recrutador
    for (const recruiter of recruiters) {
      output.push(`\n📌 Recrutador: ${recruiter.full_name} (${recruiter.id})`);

      if (!recruiter.whatsapp) {
        output.push("⚠️ Nenhum número de WhatsApp — pulando.");
        continue;
      }

      const phoneNumber = recruiter.whatsapp.startsWith("55")
        ? recruiter.whatsapp
        : `55${recruiter.whatsapp.replace(/\D/g, "")}`;

      // 3️⃣ Busca vagas ativas
      const { data: jobPosts, error: jobError } = await supabase
        .from("job_posts")
        .select("id, title, status, created_at")
        .eq("author_id", recruiter.id)
        .eq("status", "active");

      if (jobError) throw jobError;

      output.push(`📄 Vagas ativas encontradas: ${jobPosts.length}`);

      let newApplications = 0;

      // 4️⃣ Conta candidaturas das últimas 24h
      if (jobPosts.length > 0) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { count, error: appError } = await supabase
          .from("job_applications")
          .select("*", { count: "exact" })
          .in("job_id", jobPosts.map((j) => j.id))
          .gte("created_at", yesterday);

        if (appError) throw appError;

        newApplications = count || 0;
        output.push(`🧾 Novas candidaturas nas últimas 24h: ${newApplications}`);
      } else {
        output.push("ℹ️ Nenhuma vaga ativa — pulando contagem de candidaturas.");
      }

      // 5️⃣ Monta o texto da mensagem
      const text = `👋 Olá ${recruiter.full_name}!

📊 Vagas ativas: ${jobPosts.length}
👤 Novas candidaturas nas últimas 24h: ${newApplications}

O que deseja fazer agora?
1️⃣ Ver minhas vagas
2️⃣ Encerrar uma vaga`;

      // 6️⃣ Envio via WhatsApp (comentado para testes)
      /*
      output.push(`📤 Enviando mensagem para ${phoneNumber}...`);
      const response = await fetch(
        `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: { body: text },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        output.push(`❌ Erro ao enviar mensagem: ${errorText}`);
      } else {
        output.push(`✅ Mensagem enviada com sucesso para ${recruiter.full_name}`);
      }
      */

      // 🔹 Apenas simula o envio
      output.push(`🧪 Simulação: mensagem seria enviada para ${phoneNumber}`);
    }

    output.push("\n🏁 Execução concluída.");

    // Retorna tudo como texto legível no navegador
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(output.join("\n"));
  } catch (error) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(500).send("💥 Erro ao executar script:\n" + error.message);
  }
}

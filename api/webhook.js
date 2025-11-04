import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Apenas POST (enviado pelo Meta)
  if (req.method !== "POST") {
    return res.status(200).send("Webhook ativo ✅");
  }

  try {
    const data = req.body;
    const message = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.status(200).send("Sem mensagem recebida");

    const from = message.from; // número do recrutador
    const text = message.text?.body?.trim();

    // 🔍 Busca recrutador pelo número
    const { data: recruiter, error: recruiterError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("whatsapp", from.replace(/^55/, "")) // salva sem o 55 no banco
      .eq("user_type", "recruiter")
      .eq("is_verified", true)
      .single();

    if (recruiterError || !recruiter) {
      await sendWhatsApp(from, "⚠️ Seu número não está cadastrado como recrutador verificado.");
      return res.status(200).send("Número não autorizado");
    }

    // 📖 Lógica do fluxo
    if (text === "1") {
      // ➜ Listar vagas
      const { data: jobs } = await supabase
        .from("job_posts")
        .select("id, title")
        .eq("author_id", recruiter.id)
        .eq("status", "active");

      if (!jobs || jobs.length === 0) {
        await sendWhatsApp(from, "Você não possui vagas ativas no momento.");
        return res.status(200).send("Sem vagas");
      }

      const jobList = jobs.map((j, i) => `${i + 1}️⃣ ${j.title}`).join("\n");
      await sendWhatsApp(
        from,
        `📋 Suas vagas ativas:\n${jobList}\n\nEnvie o número da vaga para ver os candidatos.`
      );
      return res.status(200).send("Vagas enviadas");
    }

    if (text === "2") {
      // ➜ Encerrar vaga
      const { data: jobs } = await supabase
        .from("job_posts")
        .select("id, title")
        .eq("author_id", recruiter.id)
        .eq("status", "active");

      if (!jobs || jobs.length === 0) {
        await sendWhatsApp(from, "Não há vagas ativas para encerrar.");
        return res.status(200).send("Sem vagas para encerrar");
      }

      const jobList = jobs.map((j, i) => `${i + 1}️⃣ ${j.title}`).join("\n");
      await sendWhatsApp(from, `Qual vaga deseja encerrar?\n${jobList}`);
      await supabase.from("profiles").update({ last_action: "close_job" }).eq("id", recruiter.id);
      return res.status(200).send("Encerrar vaga iniciado");
    }

    // Se o recrutador estiver na etapa de encerramento
    const { data: recruiterData } = await supabase
      .from("profiles")
      .select("last_action")
      .eq("id", recruiter.id)
      .single();

    if (recruiterData?.last_action === "close_job") {
      const jobIndex = parseInt(text) - 1;
      const { data: jobs } = await supabase
        .from("job_posts")
        .select("id, title")
        .eq("author_id", recruiter.id)
        .eq("status", "active");

      if (!jobs[jobIndex]) {
        await sendWhatsApp(from, "❌ Número inválido. Tente novamente.");
        return res.status(200).send("Número inválido");
      }

      await supabase
        .from("job_posts")
        .update({ status: "closed" })
        .eq("id", jobs[jobIndex].id);

      await sendWhatsApp(from, `✅ A vaga *${jobs[jobIndex].title}* foi encerrada com sucesso!`);
      await supabase.from("profiles").update({ last_action: null }).eq("id", recruiter.id);
      return res.status(200).send("Vaga encerrada");
    }

    // ➜ Ver candidatos da vaga (usuário enviou número após “1”)
    const jobIndex = parseInt(text) - 1;
    if (!isNaN(jobIndex)) {
      const { data: jobs } = await supabase
        .from("job_posts")
        .select("id, title")
        .eq("author_id", recruiter.id)
        .eq("status", "active");

      if (!jobs[jobIndex]) {
        await sendWhatsApp(from, "❌ Número inválido. Tente novamente.");
        return res.status(200).send("Número inválido");
      }

      const job = jobs[jobIndex];
      const { data: candidates } = await supabase
        .from("job_applications")
        .select("resume_pdf_url, profiles(full_name)")
        .eq("job_id", job.id);

      if (!candidates || candidates.length === 0) {
        await sendWhatsApp(from, `Nenhum candidato para *${job.title}* até o momento.`);
      } else {
        const list = candidates
          .map(
            (c, i) =>
              `${i + 1}️⃣ ${c.profiles.full_name} → ${c.resume_pdf_url ? c.resume_pdf_url : "sem currículo"}`
          )
          .join("\n");
        await sendWhatsApp(
          from,
          `👥 Candidatos para *${job.title}:*\n${list}\n\nDeseja encerrar esta vaga? Envie *SIM* ou *VOLTAR*.`
        );
      }
      return res.status(200).send("Candidatos enviados");
    }

    // ➜ Encerrar vaga após ver candidatos
    if (text.toUpperCase() === "SIM") {
      await sendWhatsApp(from, "Por favor, envie o número da vaga que deseja encerrar (ex: 1, 2, 3).");
      await supabase.from("profiles").update({ last_action: "close_job" }).eq("id", recruiter.id);
      return res.status(200).send("Fluxo de encerramento iniciado");
    }

    // ➜ Caso digite VOLTAR ou algo diferente
    await sendWhatsApp(
      from,
      `Menu principal:\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga`
    );
    res.status(200).send("Menu enviado");
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.status(500).send("Erro interno: " + error.message);
  }
}

async function sendWhatsApp(to, message) {
  await fetch(`https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });
}

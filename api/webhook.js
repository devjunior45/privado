import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // 🔹 1️⃣ VERIFICAÇÃO DO TOKEN DA META (GET)
  if (req.method === "GET") {
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verificado com sucesso!");
      return res.status(200).send(challenge);
    } else {
      console.error("❌ Falha ao verificar token Meta");
      return res.status(403).send("Token de verificação inválido.");
    }
  }

  // 🔹 2️⃣ RECEBE MENSAGEM DO USUÁRIO (POST)
  if (req.method === "POST") {
    try {
      const entry = req.body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];
      const from = message?.from; // número do usuário
      const text = message?.text?.body?.trim();

      if (!message || !text) return res.sendStatus(200);

      console.log(`📩 Mensagem recebida de ${from}: ${text}`);

      // Verifica se o usuário já tem contexto salvo
      const { data: contextData } = await supabase
        .from("chat_context")
        .select("*")
        .eq("whatsapp", from)
        .single();

      let context = contextData || { step: "menu" };

      // 🔹 MENU PRINCIPAL
      if (context.step === "menu") {
        if (text === "1") {
          // Usuário quer ver vagas
          const { data: recruiter } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("whatsapp", from)
            .eq("is_verified", true)
            .eq("user_type", "recruiter")
            .single();

          if (!recruiter)
            return await sendMessage(
              from,
              "❌ Não encontramos seu perfil verificado como recrutador."
            );

          const { data: jobPosts } = await supabase
            .from("job_posts")
            .select("id, title, status")
            .eq("author_id", recruiter.id)
            .eq("status", "active");

          if (!jobPosts?.length)
            return await sendMessage(from, "📭 Você não tem vagas ativas no momento.");

          // Salva contexto para o próximo passo
          await supabase
            .from("chat_context")
            .upsert({ whatsapp: from, step: "viewing_jobs" });

          const jobList = jobPosts
            .map((j, i) => `${i + 1}. ${j.title}`)
            .join("\n");

          return await sendMessage(
            from,
            `📋 Suas vagas ativas:\n\n${jobList}\n\nResponda com o número da vaga para mais opções.`
          );
        } else {
          return await sendMessage(
            from,
            "👋 Olá! Escolha uma opção:\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga"
          );
        }
      }

      // 🔹 VISUALIZANDO LISTA DE VAGAS
      if (context.step === "viewing_jobs") {
        const jobIndex = parseInt(text);
        if (isNaN(jobIndex))
          return await sendMessage(from, "⚠️ Envie apenas o número da vaga desejada.");

        const { data: recruiter } = await supabase
          .from("profiles")
          .select("id")
          .eq("whatsapp", from)
          .single();

        const { data: jobPosts } = await supabase
          .from("job_posts")
          .select("id, title, created_at, status")
          .eq("author_id", recruiter.id)
          .eq("status", "active");

        const selectedJob = jobPosts[jobIndex - 1];
        if (!selectedJob)
          return await sendMessage(from, "❌ Número inválido, tente novamente.");

        await sendMessage(
          from,
          `📄 Detalhes da vaga:\n\nTítulo: ${selectedJob.title}\nStatus: ${selectedJob.status}\nCriada em: ${new Date(selectedJob.created_at).toLocaleDateString("pt-BR")}\n\nResponda:\n1️⃣ Ver candidaturas\n2️⃣ Encerrar vaga\n0️⃣ Voltar ao menu`
        );

        await supabase
          .from("chat_context")
          .upsert({
            whatsapp: from,
            step: "job_options",
            selected_job_id: selectedJob.id,
          });

        return res.sendStatus(200);
      }

      // 🔹 OPÇÕES DENTRO DE UMA VAGA
      if (context.step === "job_options") {
        if (text === "0") {
          await supabase
            .from("chat_context")
            .upsert({ whatsapp: from, step: "menu" });
          return await sendMessage(
            from,
            "🔙 Voltando ao menu principal...\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga"
          );
        }

        if (text === "1") {
          const { data: applications } = await supabase
            .from("job_applications")
            .select("resume_pdf_url, created_at")
            .eq("job_id", context.selected_job_id);

          if (!applications?.length)
            return await sendMessage(from, "📭 Nenhuma candidatura recebida.");

          const list = applications
            .map(
              (a, i) =>
                `${i + 1}. 📄 [Currículo](${a.resume_pdf_url}) - ${new Date(
                  a.created_at
                ).toLocaleDateString("pt-BR")}`
            )
            .join("\n");

          return await sendMessage(from, `👤 Candidaturas recebidas:\n\n${list}`);
        }

        if (text === "2") {
          await supabase
            .from("job_posts")
            .update({ status: "closed" })
            .eq("id", context.selected_job_id);

          await supabase
            .from("chat_context")
            .upsert({ whatsapp: from, step: "menu" });

          return await sendMessage(from, "✅ Vaga encerrada com sucesso!");
        }

        return await sendMessage(from, "❌ Opção inválida. Tente novamente.");
      }

      return res.sendStatus(200);
    } catch (error) {
      console.error("Erro no webhook:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  res.status(405).send("Método não permitido");
}

// 🔹 Função auxiliar para enviar mensagens via WhatsApp
async function sendMessage(to, text) {
  const phone = to.startsWith("55") ? to : `55${to}`;
  await fetch(`https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "text",
      text: { body: text },
    }),
  });
}

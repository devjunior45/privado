import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // 🛡️ Verificação do webhook
  if (req.method === "GET") {
    const verifyToken = process.env.META_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === verifyToken) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Token inválido");
    }
  }

  if (req.method !== "POST") {
    return res.status(200).send("Webhook ativo ✅");
  }

  try {
    const data = req.body;
    const message = data.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.status(200).send("Sem mensagem recebida");

    const from = message.from;
    const text = message.text?.body?.trim()?.toLowerCase();

    // Busca recrutador verificado
    const { data: recruiter } = await supabase
      .from("profiles")
      .select("id, full_name, last_action")
      .eq("whatsapp", from.replace(/^55/, ""))
      .eq("user_type", "recruiter")
      .eq("is_verified", true)
      .single();

    if (!recruiter) {
      await sendWhatsApp(from, "⚠️ Seu número não está cadastrado como recrutador verificado.");
      return res.status(200).send("Recrutador não autorizado");
    }

    // MENU PRINCIPAL
    if (text === "menu" || text === "início") {
      await supabase.from("profiles").update({ last_action: null }).eq("id", recruiter.id);
      await sendWhatsApp(
        from,
        `👋 Olá ${recruiter.full_name}! Escolha uma opção:\n\n` +
          `1️⃣ Ver minhas vagas com resultados\n` +
          `2️⃣ Encerrar uma vaga`
      );
      return res.status(200).send("Menu enviado");
    }

    // OPÇÃO 1 → Ver vagas
    if (text === "1" || text.includes("ver minhas vagas")) {
      const { data: vagas } = await supabase
        .from("job_posts")
        .select("id, title")
        .eq("author_id", recruiter.id)
        .eq("status", "active");

      if (!vagas?.length) {
        await sendWhatsApp(from, "📭 Você não possui vagas ativas no momento.");
        return res.status(200).send("Sem vagas");
      }

      let resposta = "📋 Suas vagas ativas:\n\n";
      vagas.forEach((v, i) => (resposta += `${i + 1}️⃣ ${v.title}\n`));
      resposta += "\nResponda com o número da vaga para ver os candidatos.";

      await supabase.from("profiles").update({ last_action: "viewing_jobs" }).eq("id", recruiter.id);
      await sendWhatsApp(from, resposta);
      return res.status(200).send("Lista enviada");
    }

    // OPÇÃO 2 → Encerrar vaga
    if (text === "2" || text.includes("encerrar")) {
      const { data: vagas } = await supabase
        .from("job_posts")
        .select("id, title")
        .eq("author_id", recruiter.id)
        .eq("status", "active");

      if (!vagas?.length) {
        await sendWhatsApp(from, "🚫 Nenhuma vaga ativa encontrada para encerrar.");
        return res.status(200).send("Sem vagas");
      }

      let resposta = "🛑 Selecione o número da vaga que deseja encerrar:\n\n";
      vagas.forEach((v, i) => (resposta += `${i + 1}️⃣ ${v.title}\n`));

      await supabase.from("profiles").update({ last_action: "closing_jobs" }).eq("id", recruiter.id);
      await sendWhatsApp(from, resposta);
      return res.status(200).send("Encerramento iniciado");
    }

    // 🔢 Número da vaga — decidir com base no contexto
    const numeroSelecionado = parseInt(text);
    if (!isNaN(numeroSelecionado)) {
      const { data: vagas } = await supabase
        .from("job_posts")
        .select("id, title")
        .eq("author_id", recruiter.id)
        .eq("status", "active");

      if (!vagas?.length || numeroSelecionado < 1 || numeroSelecionado > vagas.length) {
        await sendWhatsApp(from, "⚠️ Número inválido. Digite *menu* para voltar.");
        return res.status(200).send("Número inválido");
      }

      const vaga = vagas[numeroSelecionado - 1];

      if (recruiter.last_action === "viewing_jobs") {
        // Ver candidatos
        const { data: candidatos } = await supabase
          .from("job_applications")
          .select("resume_pdf_url, profiles(full_name)")
          .eq("job_id", vaga.id);

        if (!candidatos?.length) {
          await sendWhatsApp(from, `📭 Nenhum candidato encontrado para *${vaga.title}*.`);
          return res.status(200).send("Sem candidatos");
        }

        let resposta = `👥 Candidatos para *${vaga.title}:*\n\n`;
        candidatos.forEach(
          (c, i) => (resposta += `${i + 1}️⃣ ${c.profiles.full_name}\n📄 ${c.resume_pdf_url}\n\n`)
        );

        await sendWhatsApp(from, resposta);
        return res.status(200).send("Candidatos enviados");
      }

      if (recruiter.last_action === "closing_jobs") {
        // Encerrar vaga
        await supabase.from("job_posts").update({ status: "closed" }).eq("id", vaga.id);
        await sendWhatsApp(from, `✅ A vaga *${vaga.title}* foi encerrada com sucesso.`);
        await supabase.from("profiles").update({ last_action: null }).eq("id", recruiter.id);
        return res.status(200).send("Vaga encerrada");
      }
    }

    // Mensagem padrão
    await sendWhatsApp(from, "❓ Não entendi. Digite *menu* para ver as opções.");
    res.status(200).send("Mensagem padrão enviada");
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

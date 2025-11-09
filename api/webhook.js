/* /api/webhook.js */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // --- GET: verificação do webhook pelo Meta ---
  if (req.method === "GET") {
    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Token inválido");
    }
  }

  // --- Apenas POST daqui pra frente ---
  if (req.method !== "POST") {
    return res.status(200).send("Webhook ativo ✅");
  }

  try {
    const body = req.body;
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.status(200).send("Sem mensagem recebida");

    // 🔒 Evita o bot responder a si mesmo
    if (message.from === process.env.WHATSAPP_PHONE_NUMBER) {
      console.log("Ignorado: mensagem enviada pelo próprio bot.");
      return res.status(200).send("Ignorado (mensagem do próprio bot)");
    }

    const from = message.from;
    const text = message.text?.body?.trim()?.toLowerCase() || "";

    // --- Busca recrutador ---
    const { data: recruiter } = await supabase
      .from("profiles")
      .select("id, full_name, is_verified, user_type")
      .eq("whatsapp", from.replace(/^55/, ""))
      .single();

    if (!recruiter || !recruiter.is_verified || recruiter.user_type !== "recruiter") {
      await sendWhatsAppText(
        from,
        "⚠️ Seu número não está cadastrado como recrutador verificado."
      );
      return res.status(200).send("Recrutador não autorizado");
    }

    // --- Busca sessão ---
    let { data: session } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("whatsapp", from)
      .single();

    if (!session) {
      const { data: newSession } = await supabase
        .from("bot_sessions")
        .insert({
          recruiter_id: recruiter.id,
          whatsapp: from,
          current_state: "menu",
          last_vacancies: null,
        })
        .select()
        .single();
      session = newSession;
    }

    // --- Função auxiliar ---
    async function getVacancies() {
      const { data } = await supabase
        .from("job_posts")
        .select("id, title")
        .eq("author_id", recruiter.id)
        .eq("status", "active");
      return data || [];
    }

    // --- Fluxo: Menu Principal ---
    if (session.current_state === "menu" || text === "menu" || text === "início") {
      await sendWhatsAppButtons(
        from,
        `👋 Olá ${recruiter.full_name}! Escolha uma opção abaixo:`,
        [
          { id: "ver_vagas", title: "Ver minhas vagas" },
          { id: "encerrar_vaga", title: "Encerrar uma vaga" },
        ]
      );
      return res.status(200).send("Menu com botões enviado");
    }

    // --- Processa resposta de botões ---
    const buttonId =
      message.button?.payload ||
      message.interactive?.button_reply?.id ||
      message.interactive?.list_reply?.id;

    if (buttonId === "ver_vagas") {
      const vagas = await getVacancies();
      if (!vagas.length) {
        await sendWhatsAppText(from, "📭 Você não possui vagas ativas.");
        return res.status(200).send("Sem vagas");
      }

      const lastVacancies = vagas.map((v, i) => ({
        index: i + 1,
        job_id: v.id,
        title: v.title,
      }));

      await supabase
        .from("bot_sessions")
        .update({
          current_state: "list_vacancies",
          last_vacancies: lastVacancies,
        })
        .eq("id", session.id);

      await sendWhatsAppList(
        from,
        "📋 Suas vagas ativas",
        "Selecione uma vaga para ver os candidatos:",
        lastVacancies.map((v) => ({
          id: `vaga_${v.job_id}`,
          title: v.title,
          description: "",
        }))
      );
      return res.status(200).send("Lista de vagas enviada");
    }

    if (buttonId === "encerrar_vaga") {
      const vagas = await getVacancies();
      if (!vagas.length) {
        await sendWhatsAppText(from, "🚫 Nenhuma vaga ativa para encerrar.");
        return res.status(200).send("Sem vagas");
      }

      const lastVacancies = vagas.map((v, i) => ({
        index: i + 1,
        job_id: v.id,
        title: v.title,
      }));

      await supabase
        .from("bot_sessions")
        .update({
          current_state: "list_vacancies_close",
          last_vacancies: lastVacancies,
        })
        .eq("id", session.id);

      await sendWhatsAppList(
        from,
        "🛑 Encerrar vaga",
        "Selecione uma vaga para encerrar:",
        lastVacancies.map((v) => ({
          id: `encerrar_${v.job_id}`,
          title: v.title,
          description: "",
        }))
      );
      return res.status(200).send("Lista para encerrar enviada");
    }

    // --- Resposta a seleção da lista ---
    const listId = message.interactive?.list_reply?.id;
    if (listId && listId.startsWith("vaga_")) {
      const jobId = listId.replace("vaga_", "");
      const { data: applications } = await supabase
        .from("job_applications")
        .select("profiles(full_name), resume_pdf_url")
        .eq("job_id", jobId);

      if (!applications?.length) {
        await sendWhatsAppText(from, "📭 Nenhum candidato para esta vaga.");
      } else {
        const list = applications
          .map(
            (a, i) =>
              `${i + 1}. ${a.profiles.full_name} — ${a.resume_pdf_url || "sem currículo"}`
          )
          .join("\n\n");
        await sendWhatsAppText(from, `📄 Candidatos:\n\n${list}`);
      }

      await supabase
        .from("bot_sessions")
        .update({ current_state: "menu", last_vacancies: null })
        .eq("id", session.id);

      await sendWhatsAppButtons(from, "🔙 Voltando ao menu...", [
        { id: "ver_vagas", title: "Ver minhas vagas" },
        { id: "encerrar_vaga", title: "Encerrar uma vaga" },
      ]);
      return res.status(200).send("Candidatos enviados");
    }

    if (listId && listId.startsWith("encerrar_")) {
      const jobId = listId.replace("encerrar_", "").trim();

      const { data: updatedJob, error: closeErr } = await supabase
        .from("job_posts")
        .update({ status: "closed" })
        .eq("id", jobId)
        .select()
        .single();

      if (closeErr || !updatedJob) {
        console.error("Erro ao encerrar vaga:", closeErr);
        await sendWhatsAppText(from, "❌ Erro ao encerrar a vaga.");
        return res.status(500).send("Erro ao encerrar vaga");
      }

      await supabase
        .from("bot_sessions")
        .update({ current_state: "menu", last_vacancies: null })
        .eq("id", session.id);

      await sendWhatsAppText(from, `✅ Vaga "${updatedJob.title}" encerrada com sucesso!`);
      await sendWhatsAppButtons(from, "🔙 Voltando ao menu...", [
        { id: "ver_vagas", title: "Ver minhas vagas" },
        { id: "encerrar_vaga", title: "Encerrar uma vaga" },
      ]);
      return res.status(200).send("Vaga encerrada com sucesso");
    }

    // fallback
    await sendWhatsAppText(from, "❓ Não entendi. Digite *menu* para ver as opções.");
    return res.status(200).send("Fallback enviado");
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).send("Erro interno: " + (err.message || String(err)));
  }
}

/* ---------------- Funções de envio WhatsApp ---------------- */

async function sendWhatsAppText(to, body) {
  return sendMessage(to, { type: "text", text: { body } });
}

async function sendWhatsAppButtons(to, body, buttons) {
  return sendMessage(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: { buttons: buttons.map((b) => ({ type: "reply", reply: b })) },
    },
  });
}

async function sendWhatsAppList(to, header, body, items) {
  return sendMessage(to, {
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: header },
      body: { text: body },
      action: {
        button: "Selecionar",
        sections: [{ title: "Vagas", rows: items }],
      },
    },
  });
}

async function sendMessage(to, payload) {
  try {
    const resp = await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          ...payload,
        }),
      }
    );

    if (!resp.ok) {
      console.error("Erro ao enviar mensagem:", await resp.text());
    }
  } catch (e) {
    console.error("Erro de envio:", e);
  }
}

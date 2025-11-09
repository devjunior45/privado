import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
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

  if (req.method !== "POST") return res.status(200).send("Webhook ativo ✅");

  try {
    const body = req.body;
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return res.status(200).send("Sem mensagem recebida");

    // --- Ignora mensagens enviadas pelo próprio bot ---
    if (message.from === process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return res.status(200).send("Ignorado: mensagem do próprio bot");
    }

    const from = message.from;
    const text = message.text?.body?.trim()?.toLowerCase() || "";
    const buttonReply = message.interactive?.button_reply?.id || null;

    // --- Busca recrutador ---
    const { data: recruiter } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("whatsapp", from.replace(/^55/, ""))
      .eq("user_type", "recruiter")
      .eq("is_verified", true)
      .maybeSingle();

    if (!recruiter) {
      await sendText(from, "⚠️ Seu número não está cadastrado como recrutador verificado.");
      return res.status(200).send("Recrutador não encontrado");
    }

    // --- Busca ou cria sessão ---
    let { data: session } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("whatsapp", from)
      .maybeSingle();

    if (!session) {
      const { data: newSession } = await supabase
        .from("bot_sessions")
        .insert({
          recruiter_id: recruiter.id,
          whatsapp: from,
          current_state: "menu",
          last_vacancies: null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();
      session = newSession;
    }

    // --- Expira sessão após 10 minutos sem resposta ---
    const lastUpdate = new Date(session.updated_at);
    if (Date.now() - lastUpdate.getTime() > 10 * 60 * 1000) {
      await supabase
        .from("bot_sessions")
        .update({ current_state: "menu", last_vacancies: null })
        .eq("id", session.id);
      await sendMenu(from, recruiter.full_name);
      return res.status(200).send("Sessão expirada e reiniciada");
    }

    // --- Helper para vagas ---
    async function getVacancies() {
      const { data } = await supabase
        .from("job_posts")
        .select("id, title")
        .eq("author_id", recruiter.id)
        .eq("status", "active");
      return data || [];
    }

    // --- MENU PRINCIPAL ---
    if (session.current_state === "menu") {
      if (buttonReply === "view_jobs" || text === "1") {
        const vacancies = await getVacancies();
        if (!vacancies.length) {
          await sendText(from, "📭 Você não tem vagas ativas.");
          return res.status(200).send("Sem vagas");
        }

        const listButtons = vacancies.map((v, i) => ({
          type: "reply",
          reply: { id: `job_${v.id}`, title: v.title.substring(0, 20) },
        }));

        await supabase
          .from("bot_sessions")
          .update({
            current_state: "list_vacancies",
            last_vacancies: vacancies,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        await sendButtons(from, "📋 Selecione uma vaga para exibir candidatos:", listButtons.slice(0, 3));
        return res.status(200).send("Lista de vagas enviada");
      }

      if (buttonReply === "close_jobs" || text === "2") {
        const vacancies = await getVacancies();
        if (!vacancies.length) {
          await sendText(from, "🚫 Nenhuma vaga ativa para encerrar.");
          return res.status(200).send("Sem vagas");
        }

        const listButtons = vacancies.map((v) => ({
          type: "reply",
          reply: { id: `close_${v.id}`, title: v.title.substring(0, 20) },
        }));

        await supabase
          .from("bot_sessions")
          .update({
            current_state: "list_vacancies_close",
            last_vacancies: vacancies,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        await sendButtons(from, "Escolha uma vaga para encerrar:", listButtons.slice(0, 3));
        return res.status(200).send("Encerramento de vaga iniciado");
      }

      // Exibe menu inicial com botões
      await sendMenu(from, recruiter.full_name);
      return res.status(200).send("Menu enviado");
    }

    // --- VISUALIZAR CANDIDATOS ---
    if (session.current_state === "list_vacancies" && buttonReply?.startsWith("job_")) {
      const jobId = buttonReply.replace("job_", "").trim();
      const { data: candidates } = await supabase
        .from("job_applications")
        .select("profiles(full_name), resume_pdf_url")
        .eq("job_id", jobId);

      if (!candidates?.length) {
        await sendText(from, "📭 Nenhum candidato para esta vaga.");
      } else {
        const list = candidates
          .map((c, i) => `${i + 1}. ${c.profiles.full_name} — ${c.resume_pdf_url || "sem currículo"}`)
          .join("\n\n");
        await sendText(from, `👥 Candidatos:\n\n${list}`);
      }

      await supabase
        .from("bot_sessions")
        .update({ current_state: "menu", last_vacancies: null })
        .eq("id", session.id);
      await sendMenu(from, recruiter.full_name);
      return res.status(200).send("Candidatos listados");
    }

    // --- ENCERRAR VAGA ---
    if (session.current_state === "list_vacancies_close" && buttonReply?.startsWith("close_")) {
      const jobId = buttonReply.replace("close_", "").trim();
      const { error: closeErr } = await supabase
        .from("job_posts")
        .update({ status: "closed" })
        .eq("id", jobId);

      if (closeErr) {
        console.error("Erro ao encerrar vaga:", closeErr);
        await sendText(from, "❌ Erro ao encerrar a vaga.");
      } else {
        await sendText(from, "✅ Vaga encerrada com sucesso!");
      }

      await supabase
        .from("bot_sessions")
        .update({ current_state: "menu", last_vacancies: null })
        .eq("id", session.id);
      await sendMenu(from, recruiter.full_name);
      return res.status(200).send("Vaga encerrada");
    }

    await sendMenu(from, recruiter.full_name);
    return res.status(200).send("Fallback: menu reenviado");
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).send("Erro interno: " + err.message);
  }
}

/* ------------------ FUNÇÕES AUXILIARES ------------------ */

async function sendText(to, text) {
  await sendMessage(to, { type: "text", text: { body: text } });
}

async function sendMenu(to, name) {
  const buttons = [
    { type: "reply", reply: { id: "view_jobs", title: "Ver minhas vagas" } },
    { type: "reply", reply: { id: "close_jobs", title: "Encerrar uma vaga" } },
  ];

  await sendMessage(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `👋 Olá ${name}! Escolha uma opção:` },
      action: { buttons },
    },
  });
}

async function sendButtons(to, text, buttons) {
  await sendMessage(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text },
      action: { buttons },
    },
  });
}

async function sendMessage(to, payload) {
  const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
  const toNumber = to.startsWith("55") ? to : `55${to}`;

  const body = {
    messaging_product: "whatsapp",
    to: toNumber,
    ...payload,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("Erro ao enviar mensagem:", err);
  }
}

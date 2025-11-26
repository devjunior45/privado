// WEBHOOK COMPLETO REFEITO — WhatsApp Cloud API + Listas + Botões + Supabase

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ===========================================================
   FUNÇÃO PARA DIVIDIR LISTAS EM SEÇÕES DE 10 ITEMS (100 TOTAL)
=========================================================== */
function chunkIntoSections(rows) {
  const sections = [];
  for (let i = 0; i < rows.length; i += 10) {
    const chunk = rows.slice(i, i + 10);
    sections.push({
      title: `Vagas ${sections.length + 1}`,
      rows: chunk
    });
  }
  return sections.slice(0, 10); // limite máximo da API
}

/* ===========================================================
                    WEBHOOK HANDLER
=========================================================== */
export default async function handler(req, res) {
  try {
    /* ----------------------- VERIFICAÇÃO GET ----------------------- */
    if (req.method === "GET") {
      const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === VERIFY_TOKEN)
        return res.status(200).send(challenge);

      return res.status(403).send("Token inválido");
    }

    if (req.method !== "POST")
      return res.status(200).send("Webhook ativo"); 
    console.log(">>> RAW BODY RECEIVED:", JSON.stringify(req.body, null, 2));


    /* ===========================================================
      EXTRAÇÃO ROBUSTA DA MENSAGEM (ACEITA TODOS OS FORMATOS)
    ============================================================ */
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value || changes || req.body;

    let message = null;
    if (value?.messages?.[0]) message = value.messages[0];
    else if (req.body?.messages?.[0]) message = req.body.messages[0];
    else if (entry?.messages?.[0]) message = entry.messages[0];

    if (!message) {
      console.log("Sem mensagem processável no payload.");
      return res.status(200).send("ok");
    }

    /* ----------------------- REMETENTE ----------------------- */
    const rawFrom =
      message.from ||
      message.wa_id ||
      message.author ||
      message.from_number;

    if (!rawFrom)
      return res.status(200).send("sem remetente");

    const whatsapp = String(rawFrom).replace(/\D/g, "");

    /* ===========================================================
       VALIDAR RECRUTADOR
    ============================================================ */
    const { data: recruiter } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("whatsapp", whatsapp.replace(/^55/, ""))
      .eq("user_type", "recruiter")
      .eq("is_verified", true)
      .maybeSingle();

    if (!recruiter) {
      await sendText(whatsapp, "⚠️ Seu número não está cadastrado como recrutador.");
      return res.status(200).send("not recruiter");
    }

    /* ===========================================================
       BUSCAR OU CRIAR SESSÃO
    ============================================================ */
    let { data: session } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("whatsapp", whatsapp)
      .maybeSingle();

    if (!session) {
      const { data: newSession } = await supabase
        .from("bot_sessions")
        .insert({
          recruiter_id: recruiter.id,
          whatsapp,
          current_state: "menu",
          last_vacancies: null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      session = newSession;
    }

    /* ===========================================================
      EXTRAIR BUTTON/LIST_REPLY EM TODOS OS FORMATOS
    ============================================================ */
    let buttonReplyId = null;

    if (message.interactive?.type === "list_reply")
      buttonReplyId = message.interactive.list_reply?.id;

    if (!buttonReplyId && message.interactive?.type === "button_reply")
      buttonReplyId = message.interactive.button_reply?.id;

    if (!buttonReplyId && message.button?.payload)
      buttonReplyId = message.button.payload;

    if (!buttonReplyId && message.interactive?.list_reply)
      buttonReplyId = message.interactive.list_reply?.id;

    const text = message.text?.body?.toLowerCase()?.trim() || "";

    /* ===========================================================
                      NORMALIZAR COMANDO
    ============================================================ */
    let userCommand = null;

    if (buttonReplyId) {
      const id = String(buttonReplyId);
      if (["ver_vagas", "view_jobs"].includes(id)) userCommand = "view_jobs";
      if (["encerrar_vaga", "close_jobs"].includes(id)) userCommand = "close_jobs";
      if (id.startsWith("job_")) userCommand = id;
      if (id.startsWith("close_")) userCommand = id;
    } else if (text) {
      if (text.includes("ver vaga") || text.includes("ver")) userCommand = "view_jobs";
      if (text.includes("encerrar")) userCommand = "close_jobs";
    }

    /* ===========================================================
                       ROTEAMENTO DE ESTADOS
    ============================================================ */
    const state = session.current_state;

    // MENU PRINCIPAL
    if (state === "menu") {
      if (userCommand === "view_jobs") return handleViewJobs(session, recruiter, whatsapp, res);
      if (userCommand === "close_jobs") return handleStartClose(session, recruiter, whatsapp, res);
      await sendMenu(session, recruiter.full_name);
      return res.status(200).send("menu");
    }

    // LISTA DE VAGAS — vendo candidatos
    if (state === "list_vacancies" && userCommand?.startsWith("job_")) {
      const jobId = userCommand.replace("job_", "");
      return handleListCandidates(session, recruiter, whatsapp, jobId, res);
    }

    // LISTA DE VAGAS — encerrando
    if (state === "list_vacancies_close" && userCommand?.startsWith("close_")) {
      const jobId = userCommand.replace("close_", "");
      return handleCloseJob(session, recruiter, whatsapp, jobId, res);
    }

    await sendMenu(session, recruiter.full_name);
    return res.status(200).send("fallback");

  } catch (err) {
    console.error("ERRO NO WEBHOOK:", err);
    return res.status(500).send("erro");
  }
}

/* ===========================================================
                  ENVIA TEXTO COMUM
=========================================================== */
async function sendText(to, text) {
  const body = {
    messaging_product: "whatsapp",
    to,
    text: { body: text }
  };

  await fetch(
    `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    }
  );
}

/* ===========================================================
               MENU PRINCIPAL — BOTÕES
=========================================================== */
async function sendMenu(session, name) {
  await supabase
    .from("bot_sessions")
    .update({
      current_state: "menu",
      last_vacancies: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", session.id);

  const body = {
    messaging_product: "whatsapp",
    to: session.whatsapp,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `👋 Olá ${name}! O que deseja fazer?` },
      action: {
        buttons: [
          { type: "reply", reply: { id: "ver_vagas", title: "Ver minhas vagas" }},
          { type: "reply", reply: { id: "encerrar_vaga", title: "Encerrar vaga" }},
        ]
      }
    }
  };

  await fetch(
    `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    }
  );
}

/* ===========================================================
           LISTAR VAGAS — LISTA COM ATÉ 100 ITENS
=========================================================== */
async function handleViewJobs(session, recruiter, whatsapp, res) {
  const { data: jobs } = await supabase
    .from("job_posts")
    .select("id, title")
    .eq("author_id", recruiter.id)
    .eq("status", "active");

  if (!jobs?.length) {
    await sendText(whatsapp, "📭 Você não tem vagas ativas.");
    return res.status(200).send("sem vagas");
  }

  await supabase
    .from("bot_sessions")
    .update({
      current_state: "list_vacancies",
      last_vacancies: jobs,
      updated_at: new Date().toISOString()
    })
    .eq("id", session.id);

  const rows = jobs.map(j => ({
    id: `job_${j.id}`,
    title: j.title.substring(0, 24)
  }));

  const sections = chunkIntoSections(rows);

  const body = {
    messaging_product: "whatsapp",
    to: whatsapp,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "📋 Suas vagas" },
      body: { text: "Selecione uma vaga para listar os candidatos:" },
      action: {
        button: "Selecionar",
        sections
      }
    }
  };

  await fetch(
    `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    }
  );

  return res.status(200).send("lista enviada");
}

/* ===========================================================
            ENCERRAR VAGA — LISTA COM ATÉ 100 ITENS
=========================================================== */
async function handleStartClose(session, recruiter, whatsapp, res) {
  const { data: jobs } = await supabase
    .from("job_posts")
    .select("id, title")
    .eq("author_id", recruiter.id)
    .eq("status", "active");

  if (!jobs?.length) {
    await sendText(whatsapp, "🚫 Não há vagas ativas para encerrar.");
    return res.status(200).send("none");
  }

  await supabase
    .from("bot_sessions")
    .update({
      current_state: "list_vacancies_close",
      last_vacancies: jobs,
      updated_at: new Date().toISOString()
    })
    .eq("id", session.id);

  const rows = jobs.map(j => ({
    id: `close_${j.id}`,
    title: j.title.substring(0, 24)
  }));

  const sections = chunkIntoSections(rows);

  const body = {
    messaging_product: "whatsapp",
    to: whatsapp,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Encerrar vaga" },
      body: { text: "Escolha a vaga para encerrar:" },
      action: {
        button: "Selecionar",
        sections
      }
    }
  };

  await fetch(
    `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    }
  );

  return res.status(200).send("lista enviada");
}

/* ===========================================================
              LISTAR CANDIDATOS — TEXTO
=========================================================== */
async function handleListCandidates(session, recruiter, whatsapp, jobId, res) {
  const { data: candidates } = await supabase
    .from("job_applications")
    .select("profiles(full_name), resume_pdf_url")
    .eq("job_id", jobId);

  if (!candidates?.length) {
    await sendText(whatsapp, "📭 Nenhum candidato para esta vaga.");
  } else {
    const list = candidates
      .map((c, i) => `${i + 1}. ${c.profiles.full_name} — ${c.resume_pdf_url}`)
      .join("\n\n");

    await sendText(whatsapp, `👥 Candidatos:\n\n${list}`);
  }

  await supabase
    .from("bot_sessions")
    .update({
      current_state: "menu",
      last_vacancies: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", session.id);

  await sendText(whatsapp, "Voltando ao menu.");

  return res.status(200).send("ok");
}

/* ===========================================================
              ENCERRAR VAGA — UPDATE NO BANCO
=========================================================== */
async function handleCloseJob(session, recruiter, whatsapp, jobId, res) {
  await supabase
    .from("job_posts")
    .update({ status: "closed" })
    .eq("id", jobId);

  await sendText(whatsapp, "✅ Vaga encerrada com sucesso!");

  await supabase
    .from("bot_sessions")
    .update({
      current_state: "menu",
      last_vacancies: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", session.id);

  return res.status(200).send("closed");
}

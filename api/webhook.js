// webhook.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
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

    if (req.method !== "POST") {
      return res.status(200).send("Webhook ativo");
    }

    console.log("Incoming webhook body:", JSON.stringify(req.body).slice(0, 2000));

    const message =
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] ||
      req.body?.messages?.[0] ||
      null;

    if (!message) {
      return res.status(200).send("Sem mensagem");
    }

    const from = message.from || message.wa_id;
    if (!from) {
      return res.status(200).send("Mensagem sem remetente");
    }

    const whatsapp = String(from).replace(/\D/g, "");
    console.log("Mensagem recebida de:", whatsapp, "conteúdo:", message);

    if (
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      whatsapp === process.env.WHATSAPP_PHONE_NUMBER_ID.replace(/\D/g, "")
    ) {
      return res.status(200).send("Ignorado: mensagem do próprio bot");
    }

    const { data: recruiter } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("whatsapp", whatsapp.replace(/^55/, ""))
      .eq("user_type", "recruiter")
      .eq("is_verified", true)
      .maybeSingle();

    if (!recruiter) {
      await sendText(whatsapp, "Seu número não está cadastrado como recrutador.");
      return res.status(200).send("não recruiter");
    }

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

    const now = new Date();
    const lastUpdate = session.updated_at ? new Date(session.updated_at) : new Date(0);
    const diffMs = now - lastUpdate;
    const expireMinutes = Number(process.env.SESSION_EXPIRE_MINUTES || 10);

    if (diffMs > expireMinutes * 60 * 1000) {
      await supabase
        .from("bot_sessions")
        .update({
          current_state: "menu",
          last_vacancies: null,
          updated_at: now.toISOString(),
        })
        .eq("id", session.id);
      session.current_state = "menu";
    }

    const buttonReplyId =
      message?.interactive?.button_reply?.id ||
      message?.interactive?.list_reply?.id ||
      null;

    let userCommand = null;

    if (buttonReplyId) {
      const id = String(buttonReplyId);

      if (["ver_vagas", "view_jobs"].includes(id)) userCommand = "view_jobs";
      if (["encerrar_vaga", "close_jobs"].includes(id)) userCommand = "close_jobs";

      if (id.startsWith("job_")) userCommand = id;
      if (id.startsWith("close_")) userCommand = id;
      if (id.startsWith("cand_")) userCommand = id;
    }

    console.log("userCommand detectado:", userCommand, "estado atual:", session.current_state);

    // MENU
    if (session.current_state === "menu") {
      if (userCommand === "view_jobs") {
        return await handleViewJobs(session, recruiter, whatsapp, res);
      }

      if (userCommand === "close_jobs") {
        return await handleStartClose(session, recruiter, whatsapp, res);
      }

      return await sendMenuAndUpdate(session, recruiter.full_name);
    }

    // LISTAGEM DE VAGAS (ver candidatos)
    if (
      session.current_state === "list_vacancies" &&
      userCommand?.startsWith("job_")
    ) {
      const jobId = userCommand.replace("job_", "");
      return await handleListCandidates(session, recruiter, whatsapp, jobId, res);
    }

    // LISTA DE CANDIDATOS — clique em candidato
    if (
      session.current_state === "list_candidates" &&
      userCommand?.startsWith("cand_")
    ) {
      const index = Number(userCommand.replace("cand_", ""));
      return await handleCandidateSelected(session, recruiter, whatsapp, index, res);
    }

    // ENCERRAR VAGA
    if (
      session.current_state === "list_vacancies_close" &&
      userCommand?.startsWith("close_")
    ) {
      const jobId = userCommand.replace("close_", "");
      return await handleCloseJob(session, recruiter, whatsapp, jobId, res);
    }

    return await sendMenuAndUpdate(session, recruiter.full_name);
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).send("Erro interno");
  }
}

/* -------------------------------------------------------------
   ENVIO DE MENSAGEM
------------------------------------------------------------- */

async function sendWhatsApp(body) {
  try {
    const resp = await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const txt = await resp.text();
    if (!resp.ok) console.error("Erro WhatsApp:", resp.status, txt);
    else console.log("Enviado:", txt.slice(0, 300));
  } catch (e) {
    console.error("Exception WhatsApp:", e);
  }
}

async function sendText(to, text) {
  return await sendWhatsApp({
    messaging_product: "whatsapp",
    to,
    text: { body: text },
  });
}

/* -------------------------------------------------------------
   MENU
------------------------------------------------------------- */

async function sendMenuAndUpdate(session, name) {
  await supabase
    .from("bot_sessions")
    .update({
      current_state: "menu",
      last_vacancies: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  const body = {
    messaging_product: "whatsapp",
    to: session.whatsapp,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `Olá ${name}! Escolha uma opção:` },
      action: {
        buttons: [
          { type: "reply", reply: { id: "ver_vagas", title: "Ver minhas vagas" } },
          { type: "reply", reply: { id: "encerrar_vaga", title: "Encerrar uma vaga" } },
        ],
      },
    },
  };

  return await sendWhatsApp(body);
}

/* -------------------------------------------------------------
   VER VAGAS (LISTA)
------------------------------------------------------------- */

async function handleViewJobs(session, recruiter, whatsapp, res) {
  const { data: jobPosts, error } = await supabase
    .from("job_posts")
    .select("id, title")
    .eq("author_id", recruiter.id)
    .eq("status", "active");

  if (!jobPosts?.length) {
    await sendText(whatsapp, "Você não tem vagas ativas.");
    return res.status(200).send("sem vagas");
  }

  await supabase
    .from("bot_sessions")
    .update({
      current_state: "list_vacancies",
      last_vacancies: jobPosts,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  const rows = jobPosts.slice(0, 10).map((v) => ({
    id: `job_${v.id}`,
    title: v.title.substring(0, 24),
    description: "Ver candidatos",
  }));

  const body = {
    messaging_product: "whatsapp",
    to: whatsapp,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Suas vagas" },
      body: { text: "Selecione uma vaga:" },
      action: {
        button: "Ver vagas",
        sections: [{ title: "Vagas", rows }],
      },
    },
  };

  await sendWhatsApp(body);
  return res.status(200).send("ok");
}

/* -------------------------------------------------------------
   LISTAR CANDIDATOS (LISTA)
------------------------------------------------------------- */

async function handleListCandidates(session, recruiter, whatsapp, jobId, res) {
  const { data: candidates } = await supabase
    .from("job_applications")
    .select("profiles(full_name), resume_pdf_url")
    .eq("job_id", jobId);

  if (!candidates?.length) {
    await sendText(whatsapp, "Nenhum candidato para esta vaga.");
    return res.status(200).send("sem candidatos");
  }

  await supabase
    .from("bot_sessions")
    .update({
      current_state: "list_candidates",
      last_vacancies: candidates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  const rows = candidates.slice(0, 10).map((c, i) => ({
    id: `cand_${i}`,
    title: c.profiles.full_name,
    description: c.resume_pdf_url ? "Currículo disponível" : "Sem currículo",
  }));

  const body = {
    messaging_product: "whatsapp",
    to: whatsapp,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Candidatos" },
      body: { text: "Selecione um candidato:" },
      action: {
        button: "Ver candidatos",
        sections: [{ title: "Lista de candidatos", rows }],
      },
    },
  };

  await sendWhatsApp(body);
  return res.status(200).send("ok");
}

/* -------------------------------------------------------------
   CANDIDATO SELECIONADO
------------------------------------------------------------- */

async function handleCandidateSelected(session, recruiter, whatsapp, index, res) {
  const candidates = session.last_vacancies || [];
  const candidate = candidates[index];

  if (!candidate) {
    await sendText(whatsapp, "Candidato não encontrado.");
    return res.status(200).send("erro");
  }

  const name = candidate.profiles.full_name;
  const resume = candidate.resume_pdf_url || "Sem currículo enviado";

  await sendText(
    whatsapp,
    `Nome: ${name}\nCurrículo: ${resume}`
  );

  await sendMenuAndUpdate(session, recruiter.full_name);

  return res.status(200).send("ok");
}

/* -------------------------------------------------------------
   ENCERRAR VAGA (LISTA)
------------------------------------------------------------- */

async function handleStartClose(session, recruiter, whatsapp, res) {
  const { data: jobPosts } = await supabase
    .from("job_posts")
    .select("id, title")
    .eq("author_id", recruiter.id)
    .eq("status", "active");

  if (!jobPosts?.length) {
    await sendText(whatsapp, "Nenhuma vaga ativa para encerrar.");
    return res.status(200).send("sem vagas");
  }

  await supabase
    .from("bot_sessions")
    .update({
      current_state: "list_vacancies_close",
      last_vacancies: jobPosts,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  const rows = jobPosts.slice(0, 10).map((v) => ({
    id: `close_${v.id}`,
    title: v.title.substring(0, 24),
    description: "Encerrar vaga",
  }));

  const body = {
    messaging_product: "whatsapp",
    to: whatsapp,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Encerrar vaga" },
      body: { text: "Escolha a vaga:" },
      action: {
        button: "Selecionar",
        sections: [{ title: "Vagas", rows }],
      },
    },
  };

  await sendWhatsApp(body);
  return res.status(200).send("ok");
}

/* -------------------------------------------------------------
   ENCERRAR DEFINITIVAMENTE
------------------------------------------------------------- */

async function handleCloseJob(session, recruiter, whatsapp, jobId, res) {
  await supabase
    .from("job_posts")
    .update({ status: "closed" })
    .eq("id", jobId);

  await sendText(whatsapp, "Vaga encerrada com sucesso!");

  await sendMenuAndUpdate(session, recruiter.full_name);

  return res.status(200).send("ok");
}

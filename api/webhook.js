// código-2-robusto.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    // --- GET (verificação do webhook) ---
    if (req.method === "GET") {
      const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verificado com sucesso.");
        return res.status(200).send(challenge);
      } else {
        console.warn("Falha na verificação do webhook (token inválido).");
        return res.status(403).send("Token inválido");
      }
    }

    // --- POST (eventos) ---
    if (req.method !== "POST") {
      return res.status(200).send("Webhook ativo ✅");
    }

    // Log do body para debug (cuidado com dados sensíveis em produção)
    console.log("Incoming webhook body:", JSON.stringify(req.body).slice(0, 2000));

    // Tenta extrair a mensagem nos formatos mais comuns do WhatsApp Cloud
    const message =
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] || // formato padrão do Cloud webhook
      req.body?.messages?.[0] || // outro formato possível
      null;

    if (!message) {
      console.log("Sem mensagem processável no payload — retornando 200.");
      return res.status(200).send("Sem mensagem recebida");
    }

    // Extrai número remetente de forma segura
    const from = message.from || message.from_number || message.author || message?.wa_id;
    if (!from) {
      console.warn("Mensagem sem campo 'from' — payload:", JSON.stringify(message));
      return res.status(200).send("Mensagem sem remetente");
    }

    // Normalize (apenas números, sem espaços/sinais)
    const whatsapp = String(from).replace(/\D/g, "");
    console.log("Mensagem recebida de:", whatsapp, "conteúdo:", message);

    // --- Ignora mensagens enviadas pelo próprio número do bot (se configurado) ---
    if (process.env.WHATSAPP_PHONE_NUMBER_ID && whatsapp === process.env.WHATSAPP_PHONE_NUMBER_ID.replace(/\D/g, "")) {
      console.log("Ignorado: mensagem do próprio bot.");
      return res.status(200).send("Ignorado: mensagem do próprio bot");
    }

    // --- Busca recruiter (usando maybeSingle para não lançar se não achar) ---
    const { data: recruiter, error: recruiterErr } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("whatsapp", whatsapp.replace(/^55/, ""))
      .eq("user_type", "recruiter")
      .eq("is_verified", true)
      .maybeSingle();

    if (recruiterErr) {
      console.error("Erro ao buscar recruiter:", recruiterErr);
      return res.status(500).send("Erro interno ao buscar recruiter");
    }
    if (!recruiter) {
      console.log("Remetente não cadastrado como recruiter:", whatsapp);
      await sendText(whatsapp, "⚠️ Seu número não está cadastrado como recrutador verificado.");
      return res.status(200).send("Recrutador não encontrado");
    }

    // --- Busca ou cria sessão (maybeSingle para evitar throw) ---
    let { data: session, error: sessionErr } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("whatsapp", whatsapp)
      .maybeSingle();

    if (sessionErr) {
      console.error("Erro ao buscar session:", sessionErr);
      return res.status(500).send("Erro interno ao buscar sessão");
    }

    if (!session) {
      const { data: newSession, error: createErr } = await supabase
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

      if (createErr) {
        console.error("Erro ao criar sessão:", createErr);
        return res.status(500).send("Erro interno ao criar sessão");
      }
      session = newSession;
      console.log("Sessão criada para", whatsapp);
    }

    // --- Expiração: se passou X minutos resetar (configurável) ---
    const now = new Date();
    const lastUpdate = session.updated_at ? new Date(session.updated_at) : new Date(0);
    const diffMs = now - lastUpdate;
    const expireMinutes = Number(process.env.SESSION_EXPIRE_MINUTES || 10);
    if (diffMs > expireMinutes * 60 * 1000) {
      console.log(`Sessão expirada (>${expireMinutes} min). Resetando para menu.`);
      await supabase
        .from("bot_sessions")
        .update({ current_state: "menu", last_vacancies: null, updated_at: now.toISOString() })
        .eq("id", session.id);
      session.current_state = "menu";
    }

    // --- Extrai comando: botão reply common id (diferentes formatos) ou texto --- 
    const buttonReplyId =
      message.button?.payload || // formato antigo
      message.interactive?.button_reply?.id || // formato interactive
      message.interactive?.list_reply?.id || // list reply
      null;

    const text = message.text?.body?.trim()?.toLowerCase() || "";

    // Normaliza ids que você espera:
    // aceitamos "ver_vagas" e "view_jobs" e "encerrar_vaga" e "close_jobs"
    let userCommand = null;
    if (buttonReplyId) {
      const id = String(buttonReplyId);
      if (["ver_vagas", "view_jobs"].includes(id)) userCommand = "view_jobs";
      if (["encerrar_vaga", "close_jobs", "encerrar_vaga"].includes(id)) userCommand = "close_jobs";
      if (id.startsWith("job_")) userCommand = id; // job_{id}
      if (id.startsWith("close_")) userCommand = id;
    } else if (text) {
      if (text === "1" || text.includes("ver vaga") || text.includes("ver minhas vagas")) userCommand = "view_jobs";
      if (text === "2" || text.includes("encerrar") || text.includes("fechar vaga")) userCommand = "close_jobs";
    }

    console.log("userCommand detectado:", userCommand, "estado atual:", session.current_state);

    // --- Rotas por estado ---
    // Se está no menu
    if (session.current_state === "menu") {
      if (userCommand === "view_jobs" || (buttonReplyId && String(buttonReplyId).startsWith("job_"))) {
        // handle view jobs
        return await handleViewJobs(session, recruiter, whatsapp, res);
      }
      if (userCommand === "close_jobs" || (buttonReplyId && String(buttonReplyId).startsWith("close_"))) {
        // handle close jobs
        return await handleStartClose(session, recruiter, whatsapp, res);
      }

      // Reenviar menu e atualizar updated_at
      await sendMenuAndUpdate(session, recruiter.full_name);
      return res.status(200).send("menu reenviado");
    }

    // Se está listando vagas e o usuário clicou em job_{id}
    if (session.current_state === "list_vacancies" && buttonReplyId && String(buttonReplyId).startsWith("job_")) {
      const jobId = String(buttonReplyId).replace("job_", "").trim();
      return await handleListCandidates(session, recruiter, whatsapp, jobId, res);
    }

    // Se está no fluxo de fechar vaga e clicou em close_{id}
    if (session.current_state === "list_vacancies_close" && buttonReplyId && String(buttonReplyId).startsWith("close_")) {
      const jobId = String(buttonReplyId).replace("close_", "").trim();
      return await handleCloseJob(session, recruiter, whatsapp, jobId, res);
    }

    // Fallback — reenviar menu
    await sendMenuAndUpdate(session, recruiter.full_name);
    return res.status(200).send("fallback menu enviado");
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).send("Erro interno: " + (err && err.message ? err.message : String(err)));
  }
}

/* ------------------ FUNÇÕES AUXILIARES ------------------ */

async function sendText(to, text) {
  const body = {
    messaging_product: "whatsapp",
    to,
    text: { body: text },
  };
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
    if (!resp.ok) {
      console.error("Erro ao enviar text:", resp.status, txt);
    } else {
      console.log("Text enviado OK:", txt.slice(0, 500));
    }
  } catch (e) {
    console.error("Exception ao enviar text:", e);
  }
}

async function sendMenuAndUpdate(session, name) {
  // atualiza sessão e envia menu
  await supabase
    .from("bot_sessions")
    .update({ current_state: "menu", updated_at: new Date().toISOString(), last_vacancies: null })
    .eq("id", session.id);

  const buttons = [
    { type: "reply", reply: { id: "ver_vagas", title: "Ver minhas vagas" } },
    { type: "reply", reply: { id: "encerrar_vaga", title: "Encerrar uma vaga" } },
  ];

  const body = {
    messaging_product: "whatsapp",
    to: session.whatsapp,
    type: "interactive",
    interactive: { type: "button", body: { text: `👋 Olá ${name}! Escolha uma opção:` }, action: { buttons } },
  };

  try {
    const resp = await fetch(`https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const txt = await resp.text();
    if (!resp.ok) {
      console.error("Erro ao enviar menu:", resp.status, txt);
    } else {
      console.log("Menu enviado:", txt.slice(0, 500));
    }
  } catch (e) {
    console.error("Exception ao enviar menu:", e);
  }
}

async function handleViewJobs(session, recruiter, whatsapp, res) {
  const { data: jobPosts, error } = await supabase
    .from("job_posts")
    .select("id, title")
    .eq("author_id", recruiter.id)
    .eq("status", "active");

  if (error) {
    console.error("Erro ao buscar vagas:", error);
    return res.status(500).send("Erro ao buscar vagas");
  }

  if (!jobPosts || jobPosts.length === 0) {
    await sendText(whatsapp, "📭 Você não tem vagas ativas.");
    await supabase.from("bot_sessions")
      .update({
        current_state: "menu",
        last_vacancies: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
    return res.status(200).send("sem vagas");
  }

  await supabase.from("bot_sessions").update({
    current_state: "list_vacancies",
    last_vacancies: jobPosts,
    updated_at: new Date().toISOString()
  }).eq("id", session.id);

  const body = {
    messaging_product: "whatsapp",
    to: whatsapp,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "📋 Vagas disponíveis" },
      body: { text: "Selecione uma vaga para visualizar os candidatos:" },
      footer: { text: "Escolha uma vaga" },
      action: {
        button: "Ver vagas",
        sections: [
          {
            title: "Vagas ativas",
            rows: jobPosts.map(v => ({
              id: `job_${v.id}`,
              title: v.title.substring(0, 24)
            }))
          }
        ]
      }
    }
  };

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
    if (!resp.ok) console.error("Erro ao enviar lista:", resp.status, txt);
    else console.log("Lista enviada:", txt.slice(0, 400));
  } catch (e) {
    console.error("Exception ao enviar lista:", e);
  }

  return res.status(200).send("lista enviada");
}


async function handleStartClose(session, recruiter, whatsapp, res) {
  const { data: jobPosts, error } = await supabase
    .from("job_posts")
    .select("id, title")
    .eq("author_id", recruiter.id)
    .eq("status", "active");

  if (error) {
    console.error("Erro ao buscar vagas para encerrar:", error);
    return res.status(500).send("Erro ao buscar vagas");
  }

  if (!jobPosts || jobPosts.length === 0) {
    await sendText(whatsapp, "🚫 Você não possui vagas ativas para encerrar.");
    await supabase.from("bot_sessions")
      .update({
        current_state: "menu",
        last_vacancies: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);
    return res.status(200).send("sem vagas");
  }

  await supabase.from("bot_sessions").update({
    current_state: "list_vacancies_close",
    last_vacancies: jobPosts,
    updated_at: new Date().toISOString()
  }).eq("id", session.id);

  const body = {
    messaging_product: "whatsapp",
    to: whatsapp,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Encerrar vaga" },
      body: { text: "Selecione qual vaga deseja encerrar:" },
      footer: { text: "Escolha uma vaga para encerrar" },
      action: {
        button: "Selecionar vaga",
        sections: [
          {
            title: "Vagas ativas",
            rows: jobPosts.map(v => ({
              id: `close_${v.id}`,
              title: v.title.substring(0, 24)
            }))
          }
        ]
      }
    }
  };

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
    if (!resp.ok) console.error("Erro ao enviar lista de encerramento:", resp.status, txt);
    else console.log("Lista enviada:", txt.slice(0, 400));
  } catch (e) {
    console.error("Exception ao enviar lista:", e);
  }

  return res.status(200).send("lista enviada");
}


async function handleListCandidates(session, recruiter, whatsapp, jobId, res) {
  try {
    const { data: candidates, error } = await supabase
      .from("job_applications")
      .select("profiles(full_name), resume_pdf_url")
      .eq("job_id", jobId);

    if (error) {
      console.error("Erro ao buscar candidatos:", error);
      await sendText(whatsapp, "❌ Erro ao listar candidatos.");
      return res.status(500).send("erro listar candidatos");
    }

    if (!candidates || candidates.length === 0) {
      await sendText(whatsapp, "📭 Nenhum candidato para esta vaga.");
    } else {
      const list = candidates.map((c, i) => `${i + 1}. ${c.profiles.full_name} — ${c.resume_pdf_url || "sem currículo"}`).join("\n\n");
      await sendText(whatsapp, `👥 Candidatos:\n\n${list}`);
    }

    // volta ao menu e atualiza timestamp
    await supabase.from("bot_sessions").update({ current_state: "menu", last_vacancies: null, updated_at: new Date().toISOString() }).eq("id", session.id);
    await sendText(whatsapp, "Retornando ao menu.");
    return res.status(200).send("candidatos listados");
  } catch (e) {
    console.error("Erro em handleListCandidates:", e);
    return res.status(500).send("erro interno");
  }
}

async function handleCloseJob(session, recruiter, whatsapp, jobId, res) {
  try {
    const { error } = await supabase.from("job_posts").update({ status: "closed" }).eq("id", jobId);
    if (error) {
      console.error("Erro ao encerrar vaga:", error);
      await sendText(whatsapp, "❌ Erro ao encerrar a vaga.");
      return res.status(500).send("erro encerrar vaga");
    }
    await sendText(whatsapp, "✅ Vaga encerrada com sucesso!");
    await supabase.from("bot_sessions").update({ current_state: "menu", last_vacancies: null, updated_at: new Date().toISOString() }).eq("id", session.id);
    return res.status(200).send("vaga encerrada");
  } catch (e) {
    console.error("Erro em handleCloseJob:", e);
    return res.status(500).send("erro interno");
  }
        }

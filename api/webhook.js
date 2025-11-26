// webhook_refeito.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    // GET: verificação do webhook
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

    // Só processa POST
    if (req.method !== "POST") return res.status(200).send("Webhook ativo");

    // Extrai mensagem do webhook (compatível com diferentes formatos)
    const message =
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] ||
      req.body?.messages?.[0] ||
      null;

    if (!message) {
      console.log("Sem mensagem processável no payload.");
      return res.status(200).send("Sem mensagem");
    }

    // Debug opcional (descomente se precisar)
    // console.log("RAW MESSAGE:", JSON.stringify(message, null, 2));

    // Extrai remetente
    const from =
      message.from || message.from_number || message.author || message?.wa_id;
    if (!from) {
      console.warn("Mensagem sem campo 'from'. Payload:", JSON.stringify(message));
      return res.status(200).send("Sem remetente");
    }
    const whatsapp = String(from).replace(/\D/g, "");

    // Ignora mensagens do próprio número (se setado)
    if (
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      whatsapp === process.env.WHATSAPP_PHONE_NUMBER_ID.replace(/\D/g, "")
    ) {
      console.log("Ignorado: mensagem do próprio bot.");
      return res.status(200).send("Ignorado");
    }

    // Busca recruiter
    const { data: recruiter, error: recruiterErr } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("whatsapp", whatsapp.replace(/^55/, ""))
      .eq("user_type", "recruiter")
      .eq("is_verified", true)
      .maybeSingle();

    if (recruiterErr) {
      console.error("Erro ao buscar recruiter:", recruiterErr);
      return res.status(500).send("Erro interno");
    }
    if (!recruiter) {
      await sendText(whatsapp, "⚠️ Seu número não está cadastrado como recrutador verificado.");
      return res.status(200).send("Recrutador não encontrado");
    }

    // Busca ou cria sessão
    let { data: session, error: sessionErr } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("whatsapp", whatsapp)
      .maybeSingle();

    if (sessionErr) {
      console.error("Erro ao buscar session:", sessionErr);
      return res.status(500).send("Erro interno");
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
        return res.status(500).send("Erro interno");
      }
      session = newSession;
      console.log("Sessão criada para", whatsapp);
    }

    // Expira sessão se necessário (mantive sua lógica)
    try {
      const now = new Date();
      const lastUpdate = session.updated_at ? new Date(session.updated_at) : new Date(0);
      const diffMs = now - lastUpdate;
      const expireMinutes = Number(process.env.SESSION_EXPIRE_MINUTES || 10);
      if (diffMs > expireMinutes * 60 * 1000) {
        await supabase
          .from("bot_sessions")
          .update({ current_state: "menu", last_vacancies: null, updated_at: now.toISOString() })
          .eq("id", session.id);
        session.current_state = "menu";
      }
    } catch (e) {
      console.warn("Erro ao checar expiração da sessão:", e);
    }

    // -------------------------
    // Extrai reply id robusto (button/list)
    // -------------------------
    let buttonReplyId = null;

    // formatos seguros
    if (message.interactive?.type === "list_reply") {
      // padrão: interactive.type === "list_reply"
      buttonReplyId = message.interactive?.list_reply?.id;
    }

    if (!buttonReplyId && message.interactive?.type === "button_reply") {
      buttonReplyId = message.interactive?.button_reply?.id;
    }

    // formato antigo/button antigo
    if (!buttonReplyId && message.button?.payload) {
      buttonReplyId = message.button.payload;
    }

    // fallback: alguns webhooks/environments entregam list_reply sem .type
    if (!buttonReplyId && message.interactive?.list_reply) {
      buttonReplyId = message.interactive.list_reply.id;
    }

    const text = message.text?.body?.trim()?.toLowerCase() || "";

    // Normaliza comando
    let userCommand = null;
    if (buttonReplyId) {
      const id = String(buttonReplyId);
      if (["ver_vagas", "view_jobs"].includes(id)) userCommand = "view_jobs";
      if (["encerrar_vaga", "close_jobs"].includes(id)) userCommand = "close_jobs";
      if (id.startsWith("job_")) userCommand = id; // job_{id}
      if (id.startsWith("close_")) userCommand = id; // close_{id}
    } else if (text) {
      if (text === "1" || text.includes("ver vaga") || text.includes("ver minhas vagas") || text.includes("ver vagas")) userCommand = "view_jobs";
      if (text === "2" || text.includes("encerrar") || text.includes("fechar vaga")) userCommand = "close_jobs";
    }

    console.log("userCommand:", userCommand, "state:", session.current_state);

    // Rotas por estado
    if (session.current_state === "menu") {
      if (userCommand === "view_jobs" || (buttonReplyId && String(buttonReplyId).startsWith("job_"))) {
        return await handleViewJobs(session, recruiter, whatsapp, res);
      }
      if (userCommand === "close_jobs" || (buttonReplyId && String(buttonReplyId).startsWith("close_"))) {
        return await handleStartClose(session, recruiter, whatsapp, res);
      }

      // reenviar menu
      await sendMenuAndUpdate(session, recruiter.full_name);
      return res.status(200).send("menu reenviado");
    }

    // Se está listando vagas e clicou em job_{id}
    if (session.current_state === "list_vacancies" && buttonReplyId && String(buttonReplyId).startsWith("job_")) {
      const jobId = String(buttonReplyId).replace("job_", "").trim();
      return await handleListCandidates(session, recruiter, whatsapp, jobId, res);
    }

    // Se está no fluxo de fechar vaga e clicou em close_{id}
    if (session.current_state === "list_vacancies_close" && buttonReplyId && String(buttonReplyId).startsWith("close_")) {
      const jobId = String(buttonReplyId).replace("close_", "").trim();
      return await handleCloseJob(session, recruiter, whatsapp, jobId, res);
    }

    // fallback
    await sendMenuAndUpdate(session, recruiter.full_name);
    return res.status(200).send("fallback menu enviado");

  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).send("Erro interno");
  }
}

/* ------------------ FUNÇÕES AUXILIARES ------------------ */

async function sendText(to, text) {
  try {
    const body = {
      messaging_product: "whatsapp",
      to,
      text: { body: text },
    };
    const resp = await fetch(`https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Erro ao enviar text:", resp.status, txt);
    }
  } catch (e) {
    console.error("Exception ao enviar text:", e);
  }
}

async function sendMenuAndUpdate(session, name) {
  // atualiza sessão e envia menu com botões (até 3 — aqui usamos 2)
  try {
    await supabase
      .from("bot_sessions")
      .update({ current_state: "menu", updated_at: new Date().toISOString(), last_vacancies: null })
      .eq("id", session.id);
  } catch (e) {
    console.warn("Erro ao atualizar sessão antes de enviar menu:", e);
  }

  const body = {
    messaging_product: "whatsapp",
    to: session.whatsapp,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `👋 Olá ${name}! Escolha uma opção:` },
      action: {
        buttons: [
          { type: "reply", reply: { id: "ver_vagas", title: "Ver minhas vagas" } },
          { type: "reply", reply: { id: "encerrar_vaga", title: "Encerrar uma vaga" } }
        ]
      }
    }
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
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Erro ao enviar menu:", resp.status, txt);
    }
  } catch (e) {
    console.error("Exception ao enviar menu:", e);
  }
}

/* ---------------------------------------------------------
   handleViewJobs: envia LIST (interactive list) com vagas
   - atualiza sessão para list_vacancies
   - rows id => job_{id}
--------------------------------------------------------- */
async function handleViewJobs(session, recruiter, whatsapp, res) {
  try {
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
      await supabase.from("bot_sessions").update({ current_state: "menu", last_vacancies: null, updated_at: new Date().toISOString() }).eq("id", session.id);
      return res.status(200).send("sem vagas");
    }

    await supabase.from("bot_sessions").update({
      current_state: "list_vacancies",
      last_vacancies: jobPosts,
      updated_at: new Date().toISOString()
    }).eq("id", session.id);

    // Monta lista (pode ter muitos itens — WhatsApp aceita até 10 seções com 10 rows cada)
    const rows = jobPosts.map(j => ({
      id: `job_${j.id}`,
      title: j.title ? j.title.substring(0, 24) : "Vaga"
    }));

    const body = {
      messaging_product: "whatsapp",
      to: whatsapp,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "📋 Vagas Ativas" },
        body: { text: "Selecione uma vaga para ver os candidatos:" },
        footer: { text: "Escolha abaixo" },
        action: {
          button: "Selecionar vaga",
          sections: [
            {
              title: "Vagas disponíveis",
              rows
            }
          ]
        }
      }
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
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Erro ao enviar lista de vagas:", resp.status, txt);
      }
    } catch (e) {
      console.error("Exception ao enviar lista de vagas:", e);
    }

    return res.status(200).send("vagas enviadas");
  } catch (e) {
    console.error("Erro em handleViewJobs:", e);
    return res.status(500).send("erro interno");
  }
}

/* ---------------------------------------------------------
   handleStartClose: envia LIST para encerrar vaga
   - atualiza sessão para list_vacancies_close
   - rows id => close_{id}
--------------------------------------------------------- */
async function handleStartClose(session, recruiter, whatsapp, res) {
  try {
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
      await sendText(whatsapp, "🚫 Nenhuma vaga ativa para encerrar.");
      await supabase.from("bot_sessions").update({ current_state: "menu", last_vacancies: null, updated_at: new Date().toISOString() }).eq("id", session.id);
      return res.status(200).send("sem vagas");
    }

    await supabase.from("bot_sessions").update({
      current_state: "list_vacancies_close",
      last_vacancies: jobPosts,
      updated_at: new Date().toISOString()
    }).eq("id", session.id);

    const rows = jobPosts.map(j => ({
      id: `close_${j.id}`,
      title: j.title ? j.title.substring(0, 24) : "Vaga"
    }));

    const body = {
      messaging_product: "whatsapp",
      to: whatsapp,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "Encerrar vaga" },
        body: { text: "Selecione a vaga que deseja encerrar:" },
        footer: { text: "A ação encerrará a vaga escolhida" },
        action: {
          button: "Selecionar vaga",
          sections: [
            {
              title: "Vagas ativas",
              rows
            }
          ]
        }
      }
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
      if (!resp.ok) {
        const txt = await resp.text();
        console.error("Erro ao enviar lista para encerrar:", resp.status, txt);
      }
    } catch (e) {
      console.error("Exception ao enviar lista para encerrar:", e);
    }

    return res.status(200).send("encerramento iniciado");
  } catch (e) {
    console.error("Erro em handleStartClose:", e);
    return res.status(500).send("erro interno");
  }
}

/* ---------------------------------------------------------
   handleListCandidates: lista candidatos da vaga selecionada
   - jobId recebido sem prefixo (mas aqui tratamos job_{id})
--------------------------------------------------------- */
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
      const list = candidates
        .map((c, i) => `${i + 1}. ${c.profiles?.full_name || "Nome não informado"} — ${c.resume_pdf_url || "sem currículo"}`)
        .join("\n\n");
      await sendText(whatsapp, `👥 Candidatos:\n\n${list}`);
    }

    // volta ao menu
    await supabase.from("bot_sessions").update({ current_state: "menu", last_vacancies: null, updated_at: new Date().toISOString() }).eq("id", session.id);
    await sendText(whatsapp, "Retornando ao menu.");
    return res.status(200).send("candidatos listados");
  } catch (e) {
    console.error("Erro em handleListCandidates:", e);
    return res.status(500).send("erro interno");
  }
}

/* ---------------------------------------------------------
   handleCloseJob: encerra a vaga selecionada
   - jobId vem do id close_{id}
--------------------------------------------------------- */
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

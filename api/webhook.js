// código-2-robusto.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    /* ------------------ GET: verificação webhook ------------------ */
    if (req.method === "GET") {
      const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
      }
      return res.status(403).send("Token inválido");
    }

    /* ------------------ POST: recebendo mensagens ------------------ */
    if (req.method !== "POST") {
      return res.status(200).send("Webhook ativo");
    }

    console.log(
      "Incoming webhook body:",
      JSON.stringify(req.body).slice(0, 2000)
    );

    const message =
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] ||
      req.body?.messages?.[0] ||
      null;

    if (!message) {
      return res.status(200).send("Sem mensagem");
    }

    const from =
      message.from ||
      message.from_number ||
      message.author ||
      message?.wa_id;

    if (!from) {
      return res.status(200).send("Mensagem sem remetente");
    }

    const whatsapp = String(from).replace(/\D/g, "");

    if (
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      whatsapp === process.env.WHATSAPP_PHONE_NUMBER_ID.replace(/\D/g, "")
    ) {
      return res.status(200).send("Ignorado: mensagem do próprio bot");
    }

    /* ------------------ Buscar recruiter ------------------ */
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
      await sendText(
        whatsapp,
        "⚠️ Seu número não está cadastrado como recrutador verificado."
      );
      return res.status(200).send("Recrutador não encontrado");
    }

    /* ------------------ Buscar ou criar sessão ------------------ */
    let { data: session, error: sessionErr } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("whatsapp", whatsapp)
      .maybeSingle();

    if (sessionErr) {
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
        return res.status(500).send("Erro ao criar sessão");
      }

      session = newSession;
    }

    /* ------------------ Expiração de sessão ------------------ */
    const now = new Date();
    const lastUpdate = session.updated_at
      ? new Date(session.updated_at)
      : new Date(0);

    const expireMinutes = Number(process.env.SESSION_EXPIRE_MINUTES || 10);

    if (now - lastUpdate > expireMinutes * 60 * 1000) {
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

    /* ------------------ Extrair comando ------------------ */
    const buttonReplyId =
      message.button?.payload ||
      message.interactive?.button_reply?.id ||
      message.interactive?.list_reply?.id ||
      null;

    const text = message.text?.body?.trim()?.toLowerCase() || "";

    let userCommand = null;

    if (buttonReplyId) {
      const id = String(buttonReplyId);

      if (["ver_vagas", "view_jobs"].includes(id)) userCommand = "view_jobs";
      if (["encerrar_vaga", "close_jobs"].includes(id)) userCommand = "close_jobs";

      if (id.startsWith("job_")) userCommand = id;
      if (id.startsWith("close_")) userCommand = id;
    } else if (text) {
      if (text === "1" || text.includes("ver vaga")) userCommand = "view_jobs";
      if (text === "2" || text.includes("encerrar")) userCommand = "close_jobs";
    }

    /* -------------------- Rotas por estado -------------------- */

    // MENU
    if (session.current_state === "menu") {
      if (userCommand === "view_jobs" || buttonReplyId?.startsWith?.("job_")) {
        return await handleViewJobs(session, recruiter, whatsapp, res);
      }

      if (userCommand === "close_jobs" || buttonReplyId?.startsWith?.("close_")) {
        return await handleStartClose(session, recruiter, whatsapp, res);
      }

      await sendMenuAndUpdate(session, recruiter.full_name);
      return res.status(200).send("menu reenviado");
    }

    // LISTAR VAGAS → CANDIDATOS
    if (
      session.current_state === "list_vacancies" &&
      buttonReplyId?.startsWith?.("job_")
    ) {
      const jobId = buttonReplyId.replace("job_", "");
      return await handleListCandidates(
        session,
        recruiter,
        whatsapp,
        jobId,
        res
      );
    }

    // LISTAR VAGAS → FECHAR
    if (
      session.current_state === "list_vacancies_close" &&
      buttonReplyId?.startsWith?.("close_")
    ) {
      const jobId = buttonReplyId.replace("close_", "");
      return await handleCloseJob(
        session,
        recruiter,
        whatsapp,
        jobId,
        res
      );
    }

    // fallback
    await sendMenuAndUpdate(session, recruiter.full_name);
    return res.status(200).send("fallback menu enviado");
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).send("Erro interno");
  }
}

/* ===========================================================
   FUNÇÕES AUXILIARES
   =========================================================== */

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
      console.error("Erro ao enviar texto:", resp.status, txt);
    }
  } catch (e) {
    console.error("Exception ao enviar text:", e);
  }
}

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
      body: { text: `👋 Olá ${name}! Escolha uma opção:` },
      action: {
        buttons: [
          {
            type: "reply",
            reply: { id: "ver_vagas", title: "Ver minhas vagas" },
          },
          {
            type: "reply",
            reply: { id: "encerrar_vaga", title: "Encerrar uma vaga" },
          },
        ],
      },
    },
  };

  try {
    await fetch(
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
  } catch (e) {
    console.error("Exception ao enviar menu:", e);
  }
}

async function handleViewJobs(session, recruiter, whatsapp, res) {
  try {
    const { data: jobPosts, error } = await supabase
      .from("job_posts")
      .select("id, title")
      .eq("author_id", recruiter.id)
      .eq("status", "active");

    if (error) {
      return res.status(500).send("Erro ao buscar vagas");
    }

    if (!jobPosts || jobPosts.length === 0) {
      await sendText(whatsapp, "📭 Você não tem vagas ativas.");
      await supabase
        .from("bot_sessions")
        .update({
          current_state: "menu",
          last_vacancies: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);

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

    const rows = jobPosts.map((v) => ({
      id: `job_${v.id}`,
      title: v.title.substring(0, 24),
    }));

    const body = {
      messaging_product: "whatsapp",
      to: whatsapp,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "Vagas Ativas" },
        body: { text: "📋 Escolha uma vaga para ver os candidatos:" },
        footer: { text: "Selecione uma opção abaixo" },
        action: {
          button: "Selecionar vaga",
          sections: [
            {
              title: "Minhas vagas",
              rows,
            },
          ],
        },
      },
    };

    await fetch(
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

    return res.status(200).send("vagas enviadas");
  } catch (e) {
    return res.status(500).send("erro interno");
  }
}

async function handleStartClose(session, recruiter, whatsapp, res) {
  try {
    const { data: jobPosts, error } = await supabase
      .from("job_posts")
      .select("id, title")
      .eq("author_id", recruiter.id)
      .eq("status", "active");

    if (error) {
      return res.status(500).send("Erro ao buscar vagas");
    }

    if (!jobPosts || jobPosts.length === 0) {
      await sendText(whatsapp, "🚫 Nenhuma vaga ativa para encerrar.");
      await supabase
        .from("bot_sessions")
        .update({
          current_state: "menu",
          last_vacancies: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);

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

    const rows = jobPosts.map((v) => ({
      id: `close_${v.id}`,
      title: v.title.substring(0, 24) || "Vaga",
    }));

    const body = {
      messaging_product: "whatsapp",
      to: whatsapp,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "Encerrar vaga" },
        body: { text: "🔒 Escolha a vaga que deseja encerrar:" },
        footer: { text: "Ação irreversível" },
        action: {
          button: "Selecionar vaga",
          sections: [
            {
              title: "Vagas ativas",
              rows,
            },
          ],
        },
      },
    };

    await fetch(
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

    return res.status(200).send("encerramento iniciado");
  } catch (e) {
    return res.status(500).send("erro interno");
  }
}

async function handleListCandidates(
  session,
  recruiter,
  whatsapp,
  jobId,
  res
) {
  try {
    const { data: candidates, error } = await supabase
      .from("job_applications")
      .select("profiles(full_name), resume_pdf_url")
      .eq("job_id", jobId);

    if (error) {
      await sendText(whatsapp, "❌ Erro ao listar candidatos.");
      return res.status(500).send("erro listar candidatos");
    }

    if (!candidates || candidates.length === 0) {
      await sendText(whatsapp, "📭 Nenhum candidato para esta vaga.");
    } else {
      const list = candidates
        .map(
          (c, i) =>
            `${i + 1}. ${c.profiles.full_name} — ${
              c.resume_pdf_url || "sem currículo"
            }`
        )
        .join("\n\n");

      await sendText(whatsapp, `👥 Candidatos:\n\n${list}`);
    }

    await supabase
      .from("bot_sessions")
      .update({
        current_state: "menu",
        last_vacancies: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    await sendText(whatsapp, "Retornando ao menu.");

    return res.status(200).send("candidatos listados");
  } catch (e) {
    return res.status(500).send("erro interno");
  }
}

async function handleCloseJob(session, recruiter, whatsapp, jobId, res) {
  try {
    const { error } = await supabase
      .from("job_posts")
      .update({ status: "closed" })
      .eq("id", jobId);

    if (error) {
      await sendText(whatsapp, "❌ Erro ao encerrar a vaga.");
      return res.status(500).send("erro encerrar vaga");
    }

    await sendText(whatsapp, "✅ Vaga encerrada com sucesso!");

    await supabase
      .from("bot_sessions")
      .update({
        current_state: "menu",
        last_vacancies: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return res.status(200).send("vaga encerrada");
  } catch (e) {
    return res.status(500).send("erro interno");
  }
}

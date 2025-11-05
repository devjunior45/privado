/* /api/webhook.js - Next.js API Route */
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
    const fromMe = message?.from_me;

    // Impede o bot de responder a si mesmo
    if (fromMe) {
      return res.status(200).send("Mensagem ignorada (do próprio bot)");
    }

    if (!message) {
      return res.status(200).send("Sem mensagem recebida");
    }

    const from = message.from; // ex: "5591999...."
    const rawText = message.text?.body ?? "";
    const text = rawText.trim().toLowerCase();

    // 1️⃣ Busca o recrutador
    const { data: recruiter, error: recruiterError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("whatsapp", from.replace(/^55/, ""))
      .eq("user_type", "recruiter")
      .eq("is_verified", true)
      .maybeSingle();

    if (recruiterError) {
      console.error("Erro ao buscar recruiter:", recruiterError);
      return res.status(500).send("Erro no servidor ao buscar recruiter");
    }

    if (!recruiter) {
      await sendWhatsApp(
        from,
        "⚠️ Seu número não está cadastrado como recrutador verificado."
      );
      return res.status(200).send("Recrutador não encontrado");
    }

    // 2️⃣ Busca ou cria sessão
    let { data: session, error: sessionError } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("whatsapp", from)
      .maybeSingle();

    if (sessionError) {
      console.error("Erro ao buscar session:", sessionError);
      return res.status(500).send("Erro ao buscar sessão");
    }

    if (!session) {
      const { data: newSession, error: insertErr } = await supabase
        .from("bot_sessions")
        .insert({
          recruiter_id: recruiter.id,
          whatsapp: from,
          current_state: "menu",
          last_vacancies: null,
        })
        .select()
        .maybeSingle();

      if (insertErr) {
        console.error("Erro ao criar sessão:", insertErr);
        return res.status(500).send("Erro ao criar sessão");
      }
      session = newSession;
    }

    // ⏰ Verifica se a sessão expirou (10 minutos)
    if (session.updated_at) {
      const lastUpdated = new Date(session.updated_at).getTime();
      const now = Date.now();
      const diff = now - lastUpdated;

      if (diff > 600000) {
        console.log("Sessão expirada, reiniciando...");
        await supabase
          .from("bot_sessions")
          .update({
            current_state: "menu",
            last_vacancies: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        await sendWhatsApp(
          from,
          "⌛ Sua sessão expirou por inatividade. Digite *menu* para recomeçar."
        );
        return res.status(200).send("Sessão expirada");
      }
    }

    // Helper → buscar vagas ativas
    async function getVacancies() {
      const { data } = await supabase
        .from("job_posts")
        .select("id, title, created_at")
        .eq("author_id", recruiter.id)
        .eq("status", "active");
      return data || [];
    }

    // --- MENU PRINCIPAL ---
    if (session.current_state === "menu") {
      if (text === "1" || text.includes("ver minhas vagas")) {
        const vacancies = await getVacancies();
        if (!vacancies.length) {
          await sendWhatsApp(from, "📭 Você não tem vagas ativas no momento.");
          return res.status(200).send("Sem vagas");
        }

        const lastVacancies = vacancies.map((v, i) => ({
          index: i + 1,
          job_id: v.id,
          title: v.title,
        }));

        await supabase
          .from("bot_sessions")
          .update({
            current_state: "list_vacancies",
            last_vacancies: lastVacancies,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        const listText = lastVacancies.map((lv) => `${lv.index}. ${lv.title}`).join("\n");
        const msg =
          `👋 Olá ${recruiter.full_name}!\n\n📋 Suas vagas ativas:\n\n` +
          listText +
          "\n\nDigite o número da vaga para ver os candidatos.";

        await sendWhatsApp(from, msg);
        return res.status(200).send("Vagas listadas");
      }

      if (text === "2" || text.includes("encerrar")) {
        const vacancies = await getVacancies();
        if (!vacancies.length) {
          await sendWhatsApp(from, "🚫 Nenhuma vaga ativa para encerrar.");
          return res.status(200).send("Sem vagas para encerrar");
        }

        const lastVacancies = vacancies.map((v, i) => ({
          index: i + 1,
          job_id: v.id,
          title: v.title,
        }));

        await supabase
          .from("bot_sessions")
          .update({
            current_state: "list_vacancies_close",
            last_vacancies: lastVacancies,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        const listText = lastVacancies.map((lv) => `${lv.index}. ${lv.title}`).join("\n");
        await sendWhatsApp(from, `🛑 Escolha o número da vaga para encerrar:\n\n${listText}`);
        return res.status(200).send("Vagas para encerrar listadas");
      }

      await sendWhatsApp(
        from,
        `👋 Olá ${recruiter.full_name}! Escolha uma opção:\n\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga`
      );
      return res.status(200).send("Menu enviado");
    }

    // --- LISTAGEM OU ENCERRAMENTO ---
    if (
      session.current_state === "list_vacancies" ||
      session.current_state === "list_vacancies_close"
    ) {
      const selectedIndex = parseInt(text);
      if (isNaN(selectedIndex)) {
        await sendWhatsApp(from, "❌ Digite apenas o número da vaga conforme listado.");
        return res.status(200).send("Entrada inválida");
      }

      const lastVacancies = session.last_vacancies || [];
      const chosen = lastVacancies.find((v) => v.index === selectedIndex);
      if (!chosen) {
        await sendWhatsApp(from, "⚠️ Número inválido — envie o número conforme a lista exibida.");
        return res.status(200).send("Índice inválido");
      }

      // Ver vagas
      if (session.current_state === "list_vacancies") {
        const { data: applications } = await supabase
          .from("job_applications")
          .select("resume_pdf_url, created_at, profiles(full_name)")
          .eq("job_id", chosen.job_id)
          .order("created_at", { ascending: false });

        if (!applications || applications.length === 0) {
          await sendWhatsApp(from, `📭 Nenhum candidato para "${chosen.title}".`);
        } else {
          const list = applications
            .map(
              (a, i) =>
                `${i + 1}. ${a.profiles.full_name} — ${
                  a.resume_pdf_url || "sem currículo"
                }`
            )
            .join("\n\n");
          await sendWhatsApp(from, `📄 Candidatos para "${chosen.title}":\n\n${list}`);
        }

        await supabase
          .from("bot_sessions")
          .update({
            current_state: "menu",
            last_vacancies: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        await sendWhatsApp(
          from,
          "🔙 Voltando ao menu...\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga"
        );
        return res.status(200).send("Candidatos enviados");
      }

      // Encerrar vaga
      if (session.current_state === "list_vacancies_close") {
        console.log("Encerrando vaga:", chosen);

        const jobId = String(chosen.job_id).trim();
        const { data: updatedJob, error: closeErr } = await supabase
          .from("job_posts")
          .update({ status: "closed" })
          .eq("id", jobId)
          .select("id, title, status")
          .maybeSingle();

        console.log("Resultado update:", { updatedJob, closeErr });

        if (closeErr) {
          console.error("Erro ao encerrar vaga:", closeErr);
          return res.status(500).send("Erro ao encerrar vaga");
        }

        if (!updatedJob) {
          await sendWhatsApp(
            from,
            "⚠️ Não foi possível encontrar essa vaga para encerrar."
          );
          return res.status(200).send("Vaga não encontrada");
        }

        await supabase
          .from("bot_sessions")
          .update({
            current_state: "menu",
            last_vacancies: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        await sendWhatsApp(
          from,
          `✅ Vaga "${updatedJob.title}" encerrada com sucesso!`
        );
        await sendWhatsApp(
          from,
          "🔙 Voltando ao menu...\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga"
        );
        return res.status(200).send("Vaga encerrada");
      }
    }

    // fallback geral
    await sendWhatsApp(from, "❓ Não entendi. Digite *menu* para ver as opções.");
    return res.status(200).send("Fallback enviado");
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).send("Erro interno: " + (err.message || String(err)));
  }
}

// Função de envio WhatsApp
async function sendWhatsApp(to, text) {
  try {
    const toNumber = to.startsWith("55") ? to : `55${to}`;
    const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toNumber,
        type: "text",
        text: { body: text },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Erro ao enviar WhatsApp:", resp.status, txt);
    }
  } catch (e) {
    console.error("Erro fetch WhatsApp:", e);
  }
}

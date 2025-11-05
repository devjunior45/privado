/* /api/webhook.js */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Tempo limite para expirar sessão (em milissegundos) = 15 minutos
const SESSION_TIMEOUT = 15 * 60 * 1000;

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

  if (req.method !== "POST") {
    return res.status(200).send("Webhook ativo ✅");
  }

  try {
    const body = req.body;
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const metadata = body.entry?.[0]?.changes?.[0]?.value?.metadata;

    // Evita o bot responder a si mesmo
    if (!message || message.from === metadata?.display_phone_number) {
      return res.status(200).send("Ignorado: mensagem do próprio número");
    }

    const from = message.from; // ex: "5591999999999"
    const rawText = message.text?.body ?? "";
    const text = rawText.trim().toLowerCase();

    // Normaliza número (aceita com e sem DDI)
    const cleanedNumber = from.replace(/\D/g, "");
    const numberWithout55 = cleanedNumber.replace(/^55/, "");

    // --- Busca recrutador ---
    const { data: recruiter, error: recruiterError } = await supabase
      .from("profiles")
      .select("id, full_name, user_type, is_verified, whatsapp")
      .in("whatsapp", [cleanedNumber, numberWithout55])
      .eq("user_type", "recruiter")
      .eq("is_verified", true)
      .maybeSingle();

    if (recruiterError) {
      console.error("Erro ao buscar recruiter:", recruiterError);
      return res.status(500).send("Erro no servidor ao buscar recruiter");
    }

    if (!recruiter) {
      await sendWhatsApp(from, "⚠️ Seu número não está cadastrado como recrutador verificado.");
      return res.status(200).send("Recrutador não autorizado");
    }

    // --- Busca ou cria sessão ---
    let { data: session, error: sessionError } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("whatsapp", from)
      .maybeSingle();

    if (sessionError) {
      console.error("Erro ao buscar sessão:", sessionError);
      return res.status(500).send("Erro ao buscar sessão");
    }

    // Cria nova sessão se não existir
    if (!session) {
      const { data: newSession, error: insertErr } = await supabase
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

      if (insertErr) {
        console.error("Erro ao criar sessão:", insertErr);
        return res.status(500).send("Erro ao criar sessão");
      }

      session = newSession;
    }

    // --- Verifica expiração da sessão ---
    const lastUpdate = new Date(session.updated_at).getTime();
    const now = Date.now();
    const expired = now - lastUpdate > SESSION_TIMEOUT;

    if (expired) {
      await supabase
        .from("bot_sessions")
        .update({ current_state: "menu", last_vacancies: null, updated_at: new Date().toISOString() })
        .eq("id", session.id);

      await sendWhatsApp(from, "⏰ Sua sessão expirou por inatividade. Digite *menu* para recomeçar.");
      return res.status(200).send("Sessão expirada");
    }

    // Função auxiliar para buscar vagas
    async function getVacancies() {
      const { data } = await supabase
        .from("job_posts")
        .select("id, title")
        .eq("author_id", recruiter.id)
        .eq("status", "active");
      return data || [];
    }

    // --- MENU PRINCIPAL ---
    if (text === "menu" || session.current_state === "menu") {
      if (text === "1" || text.includes("ver minhas vagas")) {
        const vacancies = await getVacancies();
        if (!vacancies.length) {
          await sendWhatsApp(from, "📭 Você não possui vagas ativas.");
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
        await sendWhatsApp(
          from,
          `📋 Suas vagas ativas, ${recruiter.full_name}:\n\n${listText}\n\nDigite o número da vaga para ver os candidatos.`
        );
        return res.status(200).send("Lista enviada");
      }

      if (text === "2" || text.includes("encerrar")) {
        const vacancies = await getVacancies();
        if (!vacancies.length) {
          await sendWhatsApp(from, "🚫 Nenhuma vaga ativa para encerrar.");
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
            current_state: "list_vacancies_close",
            last_vacancies: lastVacancies,
            updated_at: new Date().toISOString(),
          })
          .eq("id", session.id);

        const listText = lastVacancies.map((lv) => `${lv.index}. ${lv.title}`).join("\n");
        await sendWhatsApp(from, `🛑 Escolha o número da vaga para encerrar:\n\n${listText}`);
        return res.status(200).send("Encerramento iniciado");
      }

      await sendWhatsApp(
        from,
        `👋 Olá ${recruiter.full_name}! Escolha uma opção:\n\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga`
      );
      return res.status(200).send("Menu enviado");
    }

    // --- LISTAGEM DE VAGAS ---
    if (session.current_state === "list_vacancies" || session.current_state === "list_vacancies_close") {
      const selectedIndex = parseInt(text);
      if (isNaN(selectedIndex)) {
        await sendWhatsApp(from, "❌ Digite apenas o número da vaga conforme listado.");
        return res.status(200).send("Entrada inválida");
      }

      const lastVacancies = session.last_vacancies || [];
      const chosen = lastVacancies.find((v) => v.index === selectedIndex);

      if (!chosen) {
        await sendWhatsApp(from, "⚠️ Número inválido. Envie um número da lista.");
        return res.status(200).send("Índice inválido");
      }

      // --- VISUALIZAR CANDIDATOS ---
      if (session.current_state === "list_vacancies") {
        const { data: applications } = await supabase
          .from("job_applications")
          .select("resume_pdf_url, profiles(full_name)")
          .eq("job_id", chosen.job_id);

        if (!applications || !applications.length) {
          await sendWhatsApp(from, `📭 Nenhum candidato para "${chosen.title}".`);
        } else {
          const list = applications
            .map((a, i) => `${i + 1}. ${a.profiles.full_name}\n📄 ${a.resume_pdf_url || "Sem currículo"}`)
            .join("\n\n");
          await sendWhatsApp(from, `👥 Candidatos para "${chosen.title}":\n\n${list}`);
        }

        await supabase
          .from("bot_sessions")
          .update({ current_state: "menu", last_vacancies: null, updated_at: new Date().toISOString() })
          .eq("id", session.id);

        await sendWhatsApp(from, "🔙 Voltando ao menu...\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga");
        return res.status(200).send("Candidatos enviados");
      }

      // --- ENCERRAR VAGA ---
      if (session.current_state === "list_vacancies_close") {  
        console.log("Encerrando vaga ID:", chosen.job_id, "para recruiter");

        const { error: closeErr } = await supabase
          .from("job_posts")
          .update({ status: "closed" })
          .eq("id", chosen.job_id);

        if (closeErr) {
          console.error("Erro ao encerrar vaga:", closeErr);
          await sendWhatsApp(from, "❌ Erro ao encerrar vaga. Tente novamente.");
          return res.status(500).send("Erro ao encerrar vaga");
        }

        await supabase
          .from("bot_sessions")
          .update({ current_state: "menu", last_vacancies: null, updated_at: new Date().toISOString() })
          .eq("id", session.id);

        await sendWhatsApp(from, `✅ Vaga "${chosen.title}" encerrada com sucesso!`);
        await sendWhatsApp(from, "🔙 Voltando ao menu...\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga");
        return res.status(200).send("Vaga encerrada");
      }
    }

    await sendWhatsApp(from, "❓ Não entendi. Digite *menu* para ver as opções.");
    return res.status(200).send("Fallback enviado");
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).send("Erro interno: " + err.message);
  }
}

async function sendWhatsApp(to, text) {
  try {
    const url = `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    });
    if (!resp.ok) {
      console.error("Erro ao enviar WhatsApp:", await resp.text());
    }
  } catch (e) {
    console.error("Erro fetch WhatsApp:", e);
  }
}

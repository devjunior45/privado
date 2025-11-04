import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

// Credenciais do Supabase (Vercel → Environment Variables)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN; // usado pela Meta

// ✅ Verificação de webhook (necessária para configurar o callback)
app.get("/api/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado com sucesso!");
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Token de verificação inválido.");
  }
});

// ✅ Recebimento de mensagens
app.post("/api/webhook", async (req, res) => {
  const body = req.body;

  if (!body.entry || !body.entry[0]?.changes?.[0]?.value?.messages) {
    return res.status(200).send("EVENT_RECEIVED");
  }

  const message = body.entry[0].changes[0].value.messages[0];
  const from = message.from; // número do usuário
  const text = message.text?.body?.trim();

  if (!text) return res.sendStatus(200);

  // 🔍 Busca o recrutador pelo número de WhatsApp
  const { data: recruiter } = await supabase
    .from("profiles")
    .select("*")
    .eq("whatsapp", from.replace("55", "")) // usuário adiciona sem o 55
    .eq("user_type", "recruiter")
    .eq("is_verified", true)
    .single();

  if (!recruiter) {
    await sendMessage(from, "❌ Número não autorizado para este bot.");
    return res.sendStatus(200);
  }

  // 🔍 Busca ou cria uma sessão do bot
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
      })
      .select()
      .single();
    session = newSession;
  }

  // 💬 Lógica principal do fluxo
  if (session.current_state === "menu") {
    if (text === "1" || text.toLowerCase().includes("ver minhas vagas")) {
      // Listar vagas
      const { data: vacancies } = await supabase
        .from("job_posts")
        .select("id, title, status")
        .eq("author_id", recruiter.id)
        .eq("status", "active");

      if (!vacancies || vacancies.length === 0) {
        await sendMessage(from, "Você não tem vagas ativas no momento.");
        return res.sendStatus(200);
      }

      // Salva a lista de vagas na sessão
      const list = vacancies.map((v, i) => ({
        index: i + 1,
        job_id: v.id,
        title: v.title,
      }));

      await supabase
        .from("bot_sessions")
        .update({
          current_state: "list_vacancies",
          last_vacancies: list,
          updated_at: new Date(),
        })
        .eq("id", session.id);

      const msg =
        "📋 Suas vagas ativas:\n\n" +
        list.map((v) => `${v.index}. ${v.title}`).join("\n") +
        "\n\nDigite o número da vaga para ver os candidatos.";

      await sendMessage(from, msg);
      return res.sendStatus(200);
    } else {
      await sendMessage(
        from,
        "👋 Olá! Escolha uma opção:\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga"
      );
      return res.sendStatus(200);
    }
  }

  // 🧩 Usuário escolheu uma vaga
  if (session.current_state === "list_vacancies") {
    const selectedIndex = parseInt(text);

    const chosen = session.last_vacancies?.find(
      (v) => v.index === selectedIndex
    );

    if (!chosen) {
      await sendMessage(
        from,
        "❌ Número inválido. Digite um número da lista de vagas."
      );
      return res.sendStatus(200);
    }

    // Busca candidatos da vaga
    const { data: applications } = await supabase
      .from("job_applications")
      .select("resume_pdf_url, created_at, profiles(full_name)")
      .eq("job_id", chosen.job_id)
      .order("created_at", { ascending: false });

    if (!applications || applications.length === 0) {
      await sendMessage(from, `📭 Nenhum candidato para *${chosen.title}* ainda.`);
    } else {
      const list = applications
        .map(
          (a, i) =>
            `${i + 1}. ${a.profiles.full_name} — [Currículo](${a.resume_pdf_url})`
        )
        .join("\n");
      await sendMessage(
        from,
        `📄 Candidatos da vaga *${chosen.title}*:\n\n${list}`
      );
    }

    // Retorna ao menu
    await supabase
      .from("bot_sessions")
      .update({ current_state: "menu", last_vacancies: null })
      .eq("id", session.id);

    await sendMessage(
      from,
      "🔙 Voltando ao menu principal...\n\n1️⃣ Ver minhas vagas\n2️⃣ Encerrar uma vaga"
    );

    return res.sendStatus(200);
  }

  res.sendStatus(200);
});

// ✅ Envio de mensagem para o WhatsApp
async function sendMessage(to, text) {
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
}

// ✅ Inicialização (para testes locais)
app.listen(3000, () => console.log("✅ Webhook rodando na porta 3000"));

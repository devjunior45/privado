const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  try {
    const data = req.body;
    const message = data.messages?.[0];

    if (!message) {
      return res.status(200).send("ok");
    }

    const from = message.from; // telefone do usuário
    const text = message.text?.body?.trim();
    const buttonId = message.button?.payload;

    // NORMALIZAÇÃO DO ID DO WHATSAPP
    const whatsapp = from.replace(/\D/g, "");

    //-----------------------------------------------------
    // 🔥 BUSCA OU CRIA SESSÃO
    //-----------------------------------------------------
    let { data: session } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("whatsapp", whatsapp)
      .single();

    // Se não existe sessão → cria
    if (!session) {
      const { data: newSession } = await supabase
        .from("bot_sessions")
        .insert({
          whatsapp,
          current_state: "menu",
          updated_at: new Date()
        })
        .select()
        .single();

      session = newSession;
    }

    //-----------------------------------------------------
    // 🔥 EXPIRAÇÃO DE SESSÃO (opcional)
    //-----------------------------------------------------
    const updatedAt = new Date(session.updated_at);
    const now = new Date();
    const diffMinutes = (now - updatedAt) / 1000 / 60;

    if (diffMinutes > 30) {
      // Sessão expirada → reset
      await supabase
        .from("bot_sessions")
        .update({
          current_state: "menu",
          last_vacancies: null,
          updated_at: now
        })
        .eq("id", session.id);

      session.current_state = "menu";
    }

    //-----------------------------------------------------
    // 🔥 TRATAMENTO DE BOTÕES
    //-----------------------------------------------------
    let userCommand = null;

    if (buttonId) {
      userCommand = buttonId;
    } else if (text) {
      // fallback: texto digitado
      const lower = text.toLowerCase();
      if (lower.includes("vaga") || lower.includes("ver vagas")) {
        userCommand = "ver_vagas";
      }
    }

    //-----------------------------------------------------
    // 🔥 AÇÕES POR ESTADO
    //-----------------------------------------------------
    if (session.current_state === "menu") {
      if (userCommand === "ver_vagas") {
        return await handleVerVagas(session, whatsapp, res);
      }

      // Se nada reconhecido → reenviar menu
      return await sendMenu(session, whatsapp, res);
    }

    // Caso o bot fique em um estado inválido, resetamos.
    return await sendMenu(session, whatsapp, res);

  } catch (err) {
    console.error("❌ ERRO:", err);
    res.status(500).send("Erro interno");
  }
};

// ======================================================
// 📌 FUNÇÃO: ENVIAR MENU
// ======================================================
async function sendMenu(session, whatsapp, res) {
  await supabase
    .from("bot_sessions")
    .update({
      current_state: "menu",
      updated_at: new Date()
    })
    .eq("id", session.id);

  const messageBody = {
    messaging_product: "whatsapp",
    to: whatsapp,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: "O que deseja fazer agora?" },
      action: {
        buttons: [
          { type: "reply", reply: { id: "ver_vagas", title: "Ver minhas vagas" } },
          { type: "reply", reply: { id: "encerrar_vaga", title: "Encerrar vaga" } }
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messageBody)
    }
  );

  return res.status(200).send("menu enviado");
}

// ======================================================
// 📌 FUNÇÃO: LISTAR VAGAS DO RECRUTADOR
// ======================================================
async function handleVerVagas(session, whatsapp, res) {
  // Primeiro, busca o recruiter vinculado
  const { data: recruiter } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("whatsapp", whatsapp)
    .single();

  if (!recruiter) {
    return res.status(200).send("Nenhum recruiter encontrado.");
  }

  const { data: jobPosts } = await supabase
    .from("job_posts")
    .select("id, title, status")
    .eq("author_id", recruiter.id)
    .eq("status", "active");

  if (!jobPosts || jobPosts.length === 0) {
    await sendSimpleWhatsApp(
      whatsapp,
      "Você não possui vagas ativas no momento."
    );

    // volta ao menu
    await supabase
      .from("bot_sessions")
      .update({
        current_state: "menu",
        updated_at: new Date()
      })
      .eq("id", session.id);

    return res.status(200).send("sem vagas");
  }

  // Salva temporariamente a lista
  await supabase
    .from("bot_sessions")
    .update({
      current_state: "listando_vagas",
      last_vacancies: jobPosts,
      updated_at: new Date()
    })
    .eq("id", session.id);

  let msg = "📋 *Suas vagas ativas:*\n\n";
  jobPosts.forEach((v, i) => {
    msg += `*${i + 1}.* ${v.title}\nID: ${v.id}\n\n`;
  });

  await sendSimpleWhatsApp(whatsapp, msg);

  // Após listar, volta ao menu automaticamente
  await supabase
    .from("bot_sessions")
    .update({
      current_state: "menu",
      updated_at: new Date()
    })
    .eq("id", session.id);

  return res.status(200).send("vagas enviadas");
}

// ======================================================
// 📌 FUNÇÃO: ENVIAR TEXTO SIMPLES
// ======================================================
async function sendSimpleWhatsApp(to, text) {
  await fetch(
    `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        text: { body: text }
      })
    }
  );
}

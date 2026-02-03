const { createClient } = require("@supabase/supabase-js");
const express = require("express");
const app = express();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const executeScript = async (req, res) => {
  const output = [];
  output.push("Iniciando execucao do script...");

  // Buscar recrutadores verificados
  const { data: recruiters, error: recruiterError } = await supabase
    .from("profiles")
    .select("id, full_name, whatsapp")
    .eq("user_type", "recruiter")
    .eq("is_verified", true);

  if (recruiterError) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(500).send("Erro ao buscar recrutadores:\n" + recruiterError.message);
    return;
  }

  output.push(`Recrutadores verificados encontrados: ${recruiters.length}`);

  // Loop dos recrutadores
  for (const recruiter of recruiters) {
    output.push(`\nRecrutador: ${recruiter.full_name} (${recruiter.id})`);

    if (!recruiter.whatsapp) {
      output.push("Nenhum número de WhatsApp - pulando.");
      continue;
    }

    // Normalizar número
    const phoneNumber = recruiter.whatsapp.startsWith("55")
      ? recruiter.whatsapp
      : `55${recruiter.whatsapp.replace(/\D/g, "")}`;

    // Buscar vagas ativas
    const { data: jobPosts, error: jobError } = await supabase
      .from("job_posts")
      .select("id, title, status, created_at")
      .eq("author_id", recruiter.id)
      .eq("status", "active");

    if (jobError) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.status(500).send("Erro ao buscar vagas ativas:\n" + jobError.message);
      return;
    }

    output.push(`Vagas ativas encontradas: ${jobPosts.length}`);

    // Calcular novas candidaturas
    let newApplications = 0;

    if (jobPosts.length > 0) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { count, error: appError } = await supabase
        .from("job_applications")
        .select("*", { count: "exact" })
        .in("job_id", jobPosts.map(j => j.id))
        .gte("created_at", yesterday);

      if (appError) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.status(500).send("Erro ao buscar candidaturas:\n" + appError.message);
        return;
      }

      newApplications = count || 0;
      output.push(`Novas candidaturas nas últimas 24h: ${newApplications}`);
    }

    // CRIAR/ATUALIZAR SESSÃO DO BOT
    const { data: existingSession } = await supabase
      .from("bot_sessions")
      .select("*")
      .eq("whatsapp", phoneNumber)
      .maybeSingle();

    if (!existingSession) {
      await supabase.from("bot_sessions").insert({
        recruiter_id: recruiter.id,
        whatsapp: phoneNumber,
        current_state: "menu",
        last_vacancies: null,
        updated_at: new Date().toISOString(),
      });
      output.push("Sessão criada.");
    } else {
      await supabase
        .from("bot_sessions")
        .update({
          current_state: "menu",
          last_vacancies: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSession.id);

      output.push("Sessão atualizada.");
    }

    // Texto da mensagem automática
    const text = `Olá ${recruiter.full_name}!\n\nVagas ativas: ${jobPosts.length}\nNovas candidaturas nas últimas 24h: ${newApplications}\n\nO que deseja fazer agora?`;

    // Botões compatíveis com código 2
    const buttons = [
      { type: "reply", reply: { id: "view_jobs", title: "Ver minhas vagas" } },
      { type: "reply", reply: { id: "close_jobs", title: "Encerrar uma vaga" } },
    ];

    // Enviar mensagem pelo WhatsApp API
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "interactive",
          interactive: {
            type: "button",
            body: { text },
            action: { buttons },
          },
        }),
      }
    );

    output.push(`Mensagem enviada para ${phoneNumber}`);
    output.push(`Corpo: ${JSON.stringify({ text, buttons }, null, 2)}`);
  }

  output.push("\nExecucao concluida.");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.status(200).send(output.join("\n"));
};

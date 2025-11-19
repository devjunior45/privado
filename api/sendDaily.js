const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  try {
    let output = [];
    output.push("🚀 Iniciando execução do script...");

    const { data: recruiters, error: recruiterError } = await supabase
      .from("profiles")
      .select("id, full_name, whatsapp")
      .eq("user_type", "recruiter")
      .eq("is_verified", true);

    if (recruiterError) throw recruiterError;
    output.push(`👥 Recrutadores verificados encontrados: ${recruiters.length}`);

    for (const recruiter of recruiters) {
      // Criar ou atualizar sessão do bot
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
    updated_at: new Date().toISOString()
  });
} else {
  await supabase.from("bot_sessions").update({
    current_state: "menu",
    last_vacancies: null,
    updated_at: new Date().toISOString()
  })
  .eq("id", existingSession.id);
}
      output.push(`\n📌 Recrutador: ${recruiter.full_name} (${recruiter.id})`);
       
      if (!recruiter.whatsapp) {
        output.push("⚠️ Nenhum número de WhatsApp — pulando.");
        continue;
      }

      const phoneNumber = recruiter.whatsapp.startsWith("55")
        ? recruiter.whatsapp
        : `55${recruiter.whatsapp.replace(/\D/g, "")}`;

      const { data: jobPosts, error: jobError } = await supabase
        .from("job_posts")
        .select("id, title, status, created_at")
        .eq("author_id", recruiter.id)
        .eq("status", "active");

      if (jobError) throw jobError;
      output.push(`📄 Vagas ativas encontradas: ${jobPosts.length}`);

      let newApplications = 0;
      if (jobPosts.length > 0) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { count, error: appError } = await supabase
          .from("job_applications")
          .select("*", { count: "exact" })
          .in("job_id", jobPosts.map((j) => j.id))
          .gte("created_at", yesterday);

        if (appError) throw appError;

        newApplications = count || 0;
        output.push(`🧾 Novas candidaturas nas últimas 24h: ${newApplications}`);
      }

      const text = `👋 Olá ${recruiter.full_name}!\n\n📊 Vagas ativas: ${jobPosts.length}\n👤 Novas candidaturas nas últimas 24h: ${newApplications}\n\nO que deseja fazer agora?`;

      const buttons = [
        { type: "reply", reply: { id: "ver_vagas", title: "Ver minhas vagas" } },
        { type: "reply", reply: { id: "encerrar_vaga", title: "Encerrar uma vaga" } },
      ];

      
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
            interactive: { type: "button", body: { text }, action: { buttons } },
          }),
        }
      );
      

      output.push(`🧪 Simulação: mensagem com botões seria enviada para ${phoneNumber}`);
      output.push(`📋 Corpo: ${JSON.stringify({ text, buttons }, null, 2)}`);
    }

    output.push("\n🏁 Execução concluída.");

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(output.join("\n"));
  } catch (error) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(500).send("💥 Erro ao executar script:\n" + error.message);
  }
};

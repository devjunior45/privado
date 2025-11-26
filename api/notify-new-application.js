// notify-new-application.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("notify-new-application ativo");
    }

    console.log("📩 Webhook Supabase recebido:", req.body);

    const newRow = req.body?.record;
    if (!newRow) {
      console.log("⚠️ Nenhuma record recebida");
      return res.status(200).send("Sem record");
    }

    const jobId = newRow.job_id;
    const candidateId = newRow.candidate_id;
    const resumeUrl = newRow.resume_pdf_url || "Sem currículo";

    // Buscar dados da vaga + recrutador
    const { data: job, error: jobErr } = await supabase
      .from("job_posts")
      .select("title, author_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr || !job) {
      console.error("Erro ao buscar job:", jobErr);
      return res.status(200).send("Erro job");
    }

    // Buscar nome e whatsapp do recrutador
    const { data: recruiter, error: recErr } = await supabase
      .from("profiles")
      .select("full_name, whatsapp")
      .eq("id", job.author_id)
      .maybeSingle();

    if (recErr || !recruiter) {
      console.error("Erro ao buscar recruiter:", recErr);
      return res.status(200).send("Erro recruiter");
    }

    // Buscar nome do candidato
    const { data: candidate, error: candErr } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", candidateId)
      .maybeSingle();

    if (candErr || !candidate) {
      console.error("Erro ao buscar candidato:", candErr);
      return res.status(200).send("Erro candidato");
    }

    const recruiterPhone = `55${String(recruiter.whatsapp).replace(/\D/g, "")}`;

    const message = 
`📩 *Nova candidatura recebida!*

👔 *Vaga:* ${job.title}
👤 *Candidato:* ${candidate.full_name}
📄 *Currículo:* ${resumeUrl}

Abra o painel para ver todos os detalhes.`;

    await sendText(recruiterPhone, message);

    return res.status(200).send("Notificação enviada");
  } catch (e) {
    console.error("Erro notify:", e);
    return res.status(500).send("Erro interno");
  }
}

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
      console.error("Erro ao enviar WhatsApp:", resp.status, txt);
    } else {
      console.log("WhatsApp enviado:", txt);
    }
  } catch (err) {
    console.error("Exception sendText:", err);
  }
}

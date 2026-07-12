import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("notify-new-recruiter ativo");
    }

    console.log("📩 Webhook Supabase recebido:", req.body);

    const newRow = req.body?.record;
    const oldRow = req.body?.old_record; // só vem preenchido em updates
    const eventType = req.body?.type; // "INSERT" ou "UPDATE"

    if (!newRow) {
      console.log("⚠️ Nenhuma record recebida");
      return res.status(200).send("Sem record");
    }

    const isRecruiter = newRow.user_type === "recruiter";
    const wasRecruiterBefore = oldRow?.user_type === "recruiter";

    // Notifica apenas quando o perfil VIROU recrutador agora:
    // - INSERT já nascendo como recruiter (caso raro, mas cobre)
    // - UPDATE que mudou de outro tipo PARA recruiter (o caso comum, completar perfil)
    const shouldNotify =
      (eventType === "INSERT" && isRecruiter) ||
      (eventType === "UPDATE" && isRecruiter && !wasRecruiterBefore);

    if (!shouldNotify) {
      console.log("ℹ️ Não é um novo cadastro de recrutador, ignorando.");
      return res.status(200).send("Ignorado");
    }

    const recruiterName = newRow.full_name || "Nome não informado";
    const recruiterEmail = newRow.email || "Email não informado";
    const recruiterPhoneRaw = newRow.whatsapp || null;
    const recruiterPhoneFormatted = formatPhoneDisplay(recruiterPhoneRaw);

    await sendTemplate(
      ADMIN_WHATSAPP_NUMBER,
      recruiterName,
      recruiterEmail,
      recruiterPhoneFormatted
    );

    return res.status(200).send("Notificação enviada");
  } catch (e) {
    console.error("Erro notify-new-recruiter:", e);
    return res.status(500).send("Erro interno");
  }
}

function formatPhoneDisplay(raw) {
  if (!raw) return "Não informado";
  const digits = String(raw).replace(/\D/g, "");
  return digits || "Não informado";
}


async function sendTemplate(to, recruiterName, recruiterEmail, recruiterPhone) {
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: "novo_recrutador",
      language: {
        code: "pt_BR",
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", parameter_name: "nome", text: recruiterName },
            { type: "text", parameter_name: "email", text: recruiterEmail },
            { type: "text", parameter_name: "telefone", text: recruiterPhone },
          ],
        },
      ],
    },
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
      console.error("Erro WhatsApp:", resp.status, txt);
    } else {
      console.log("Template enviado:", txt);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

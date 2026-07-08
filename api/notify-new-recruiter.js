import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Número fixo que vai receber a notificação (você, admin)
const ADMIN_WHATSAPP_NUMBER = process.env.ADMIN_WHATSAPP_NUMBER; // ex: "5511999999999"

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("notify-new-recruiter ativo");
    }

    console.log("📩 Webhook Supabase recebido:", req.body);

    const newRow = req.body?.record;
    if (!newRow) {
      console.log("⚠️ Nenhuma record recebida");
      return res.status(200).send("Sem record");
    }

    // Só notifica se o cadastro novo for de um recrutador
    if (newRow.user_type !== "recruiter") {
      console.log("ℹ️ Novo profile não é recrutador, ignorando.");
      return res.status(200).send("Não é recrutador");
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

// Só pra exibir o telefone do recrutador de forma legível na mensagem pro admin
// (não precisa normalizar pra formato de envio, já que quem RECEBE é o admin)
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
      name: "novo_recrutador", // precisa criar esse template no WhatsApp Business Manager
      language: {
        code: "pt_BR",
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: recruiterName },
            { type: "text", text: recruiterEmail },
            { type: "text", text: recruiterPhone },
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

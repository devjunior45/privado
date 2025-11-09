import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// 🔐 Variáveis do ambiente
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 💬 Enviar mensagem via WhatsApp API
async function sendMessage(phone, text, buttons = []) {
  const url = `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: phone,
    type: "interactive",
    interactive: {
      type: buttons.length > 0 ? "button" : "list",
      body: { text },
      ...(buttons.length > 0
        ? {
            action: {
              buttons: buttons.map((b) => ({
                type: "reply",
                reply: { id: b.id, title: b.title },
              })),
            },
          }
        : {}),
    },
  };

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });
}

// ✅ Verificação do Webhook (Meta)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado com sucesso!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 📩 Webhook principal
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    if (!body.entry?.[0]?.changes?.[0]?.value?.messages) {
      return res.sendStatus(200);
    }

    const message = body.entry[0].changes[0].value.messages[0];
    const phone = message.from;
    const text = message.text?.body?.trim();
    const buttonReply = message?.interactive?.button_reply?.id;

    console.log(`📨 Mensagem recebida: ${text || buttonReply} de ${phone}`);

    // 🔎 Buscar recrutador pelo número
    const { data: recruiter, error: recruiterErr } = await supabase
      .from("recruiters")
      .select("*")
      .eq("phone", phone)
      .eq("is_verified", true)
      .single();

    if (recruiterErr || !recruiter) {
      await sendMessage(
        phone,
        "❌ Acesso não autorizado. Verifique se seu número está vinculado a um recrutador verificado."
      );
      return res.sendStatus(200);
    }

    // 🧠 Lógica principal
    if (text === "1" || buttonReply === "ver_vagas") {
      // 🔹 Lista de vagas do recrutador
      const { data: jobs, error: jobsErr } = await supabase
        .from("job_posts")
        .select("id, title, status")
        .eq("recruiter_id", recruiter.id)
        .eq("active", true);

      if (jobsErr || !jobs?.length) {
        await sendMessage(phone, "⚠️ Nenhuma vaga ativa encontrada.");
        return res.sendStatus(200);
      }

      let list = "📋 *Suas vagas ativas:*\n\n";
      jobs.forEach((job, i) => {
        list += `${i + 1}. ${job.title}\n`;
      });
      list += "\nSelecione uma vaga para encerrar respondendo com o número dela.";

      await sendMessage(phone, list);
    } else if (text && /^[0-9]+$/.test(text)) {
      // 🔹 Seleção de vaga por número
      const { data: jobs } = await supabase
        .from("job_posts")
        .select("id, title, status")
        .eq("recruiter_id", recruiter.id)
        .eq("active", true);

      const selectedIndex = parseInt(text) - 1;
      const selectedJob = jobs?.[selectedIndex];

      if (!selectedJob) {
        await sendMessage(phone, "❌ Número inválido. Tente novamente.");
        return res.sendStatus(200);
      }

      // 🏁 Encerrar vaga
      const { data: updatedJob, error: closeErr } = await supabase
        .from("job_posts")
        .update({ status: "closed", active: false })
        .eq("id", selectedJob.id)
        .select();

      if (closeErr || !updatedJob?.length) {
        console.error("Erro ao encerrar vaga:", closeErr);
        await sendMessage(phone, "⚠️ Não foi possível encerrar a vaga.");
      } else {
        await sendMessage(phone, `✅ Vaga *${selectedJob.title}* encerrada com sucesso!`);
      }
    } else {
      // 🏠 Menu inicial com botões
      await sendMessage(phone, "Olá! O que deseja fazer?", [
        { id: "ver_vagas", title: "Ver minhas vagas" },
        { id: "encerrar_vaga", title: "Encerrar vaga" },
      ]);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro no webhook:", err);
    res.sendStatus(500);
  }
});

// 🚀 Iniciar servidor
app.listen(3000, () => console.log("🚀 Webhook rodando na porta 3000"));

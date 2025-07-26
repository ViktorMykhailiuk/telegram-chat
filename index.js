const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Дані Telegram
const TELEGRAM_TOKEN = "8060863541:AAGB330lUCBos4ywqAZjmCFAluY36DQOW2k";
const TELEGRAM_CHAT_ID = "388556587";

// 🧠 Тимчасове сховище повідомлень
const chatMemory = {};

// 🛡️ Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // для HTML-фронтенду

// 📩 Клієнт надсилає повідомлення
app.post("/message", async (req, res) => {
  const { text, clientId } = req.body;
  if (!text || !clientId) return res.status(400).send({ error: "Missing data" });

  const msg = `💬 Повідомлення з сайту [${clientId}]:\n${text}`;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
    }),
  });

  if (!chatMemory[clientId]) chatMemory[clientId] = [];
  chatMemory[clientId].push({ from: "client", text, time: Date.now() });

  res.send({ status: "ok" });
});

// 📥 Вебхук для отримання відповіді з Telegram
app.post("/telegram-webhook", (req, res) => {
  const message = req.body.message;
  if (!message || !message.text) return res.sendStatus(200);

  const text = message.text;
  const match = text.match(/\[(.*?)\]/); // шукаємо [clientId]
  const clientId = match?.[1];

  if (clientId && chatMemory[clientId]) {
    chatMemory[clientId].push({ from: "telegram", text, time: Date.now() });
  }

  res.sendStatus(200);
});

// 🔄 Отримати історію чату
app.get("/chat/:clientId", (req, res) => {
  const clientId = req.params.clientId;
  res.send(chatMemory[clientId] || []);
});

// 🎨 Простий фронтенд (для вставки в iframe)
app.get("/iframe", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// 🚀 Запуск
app.listen(PORT, () => {
  console.log(`🚀 Сервер працює на порту ${PORT}`);
});


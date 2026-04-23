const cors = require("cors");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { defineSecret } = require("firebase-functions/params");

setGlobalOptions({ maxInstances: 10 });

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const app = express();

const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

async function generateWithFallback(genAI, prompt) {
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      const message = error && error.message ? error.message : "";
      const isUnavailable = /not found|unsupported|404|not supported/i.test(message);

      lastError = error;
      if (!isUnavailable) {
        throw error;
      }
    }
  }

  throw lastError || new Error("No compatible Gemini model was available.");
}

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/process-text", async (req, res) => {
  const { inputText, mode } = req.body ?? {};
  const apiKey = GEMINI_API_KEY.value();

  if (!apiKey) {
    res.status(500).json({
      error: "Missing GEMINI_API_KEY secret in Firebase Functions.",
    });
    return;
  }

  if (typeof inputText !== "string" || !inputText.trim()) {
    res.status(400).json({ error: "inputText is required." });
    return;
  }

  if (mode !== "summarize" && mode !== "simplify") {
    res.status(400).json({
      error: "mode must be either 'summarize' or 'simplify'.",
    });
    return;
  }

  const instruction =
    mode === "summarize"
      ? "Summarize the following text into concise key points while preserving meaning. Keep a clear and readable paragraph format."
      : "Simplify the following text for general readers. Use plain language, short sentences, and maintain the original meaning.";

  const prompt = `${instruction}\n\nText:\n${inputText}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const output = await generateWithFallback(genAI, prompt);

    if (!output) {
      res.status(502).json({ error: "Gemini returned an empty response." });
      return;
    }

    res.json({ output });
  } catch (error) {
    console.error("Gemini function error:", error);
    res.status(500).json({
      error: error.message || "Failed to process content with Gemini.",
    });
  }
});

exports.processText = onRequest({ secrets: [GEMINI_API_KEY] }, app);
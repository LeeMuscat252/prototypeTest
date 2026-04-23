import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

async function generateWithFallback(genAIInstance, prompt) {
  let lastError = null

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAIInstance.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      return result.response.text().trim()
    } catch (error) {
      const message = error?.message ?? ''
      const isUnavailable =
        /not found|unsupported|404|not supported/i.test(message)

      lastError = error
      if (!isUnavailable) {
        throw error
      }
    }
  }

  throw lastError ?? new Error('No compatible Gemini model was available.')
}

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 3000

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. AI endpoints will return an error.')
}

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/process-text', async (req, res) => {
  const { inputText, mode } = req.body ?? {}

  if (!genAI) {
    res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' })
    return
  }

  if (typeof inputText !== 'string' || !inputText.trim()) {
    res.status(400).json({ error: 'inputText is required.' })
    return
  }

  if (mode !== 'summarize' && mode !== 'simplify') {
    res.status(400).json({ error: "mode must be either 'summarize' or 'simplify'." })
    return
  }

  const instruction =
    mode === 'summarize'
      ? 'Summarize the following text into concise key points while preserving meaning. Keep a clear and readable paragraph format.'
      : 'Simplify the following text for general readers. Use plain language, short sentences, and maintain the original meaning.'

  const prompt = `${instruction}\n\nText:\n${inputText}`

  try {
    const output = await generateWithFallback(genAI, prompt)

    if (!output) {
      res.status(502).json({ error: 'Gemini returned an empty response.' })
      return
    }

    res.json({ output })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to process content with Gemini.' })
  }
})

app.listen(port, () => {
  console.log(`Prototype backend running on http://localhost:${port}`)
})

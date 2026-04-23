import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

async function generateWithFallback(genAI, prompt) {
  let lastError = null

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const { inputText, mode } = req.body ?? {}
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    res.status(500).json({ error: 'Missing GEMINI_API_KEY.' })
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
    const genAI = new GoogleGenerativeAI(apiKey)
    const output = await generateWithFallback(genAI, prompt)

    if (!output) {
      res.status(502).json({ error: 'Gemini returned an empty response.' })
      return
    }

    res.status(200).json({ output })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to process with Gemini.' })
  }
}

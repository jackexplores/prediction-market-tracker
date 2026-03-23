const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'stepfun/step-3.5-flash:free'

type Message = { role: 'system' | 'user' | 'assistant'; content: string }

export async function streamCompletion(messages: Message[]): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  return fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages, stream: true }),
  })
}

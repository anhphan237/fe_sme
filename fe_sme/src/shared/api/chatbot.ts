import { fetchJson } from './client'

export async function chatbotQuery(payload: { query: string }) {
  return fetchJson<{ answer: string; sources: { title: string; snippet: string }[] }>(
    '/api/chatbot/query',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}


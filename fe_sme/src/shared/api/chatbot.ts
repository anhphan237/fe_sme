import { fetchJson } from './client'
import { gatewayRequest, useGateway } from './gateway'

export async function chatbotQuery(payload: { query: string }) {
  if (useGateway()) {
    const res = await gatewayRequest<{ question: string }, { answer?: string; sources?: { title: string; snippet: string }[] }>(
      'com.sme.ai.assistant.ask',
      { question: payload.query }
    )
    return {
      answer: res?.answer ?? '',
      sources: res?.sources ?? [],
    }
  }
  return fetchJson<{ answer: string; sources: { title: string; snippet: string }[] }>(
    '/api/chatbot/query',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}


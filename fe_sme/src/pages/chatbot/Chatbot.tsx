import { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useChatbotQuery } from '../../hooks/queries'

const conversations = [
  { id: 'chat-1', title: 'Access & policies' },
  { id: 'chat-2', title: 'Day one checklist' },
  { id: 'chat-3', title: 'Benefits FAQ' },
]

function Chatbot() {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<{ title: string; snippet: string }[]>([])
  const chatbot = useChatbotQuery()

  const handleAsk = async () => {
    const result = await chatbot.mutateAsync({ query })
    setAnswer(result.answer)
    setSources(result.sources)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chatbot"
        subtitle="Ask the onboarding assistant for instant guidance."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Conversations</h3>
            <Button variant="secondary">New chat</Button>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {conversations.map((chat) => (
              <div
                key={chat.id}
                className="rounded-2xl border border-stroke bg-slate-50 px-4 py-3"
              >
                {chat.title}
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="space-y-3">
            <div className="rounded-2xl border border-stroke bg-slate-50 p-4 text-sm">
              {answer || 'Ask a question to get started.'}
            </div>
            {sources.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Top sources</p>
                {sources.map((source) => (
                  <details key={source.title} className="rounded-2xl border border-stroke bg-white px-4 py-2">
                    <summary className="cursor-pointer text-sm font-semibold">
                      {source.title}
                    </summary>
                    <p className="mt-2 text-sm text-muted">{source.snippet}</p>
                  </details>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-2xl border border-stroke px-4 py-2 text-sm"
                placeholder="Ask about onboarding policies"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Button onClick={handleAsk}>Send</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Chatbot


import { useState, useRef, useEffect } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useMutation } from "@tanstack/react-query";
import { apiChatbotAsk } from "@/api/chatbot/chatbot.api";

const useChatbotQuery = () => useMutation({ mutationFn: apiChatbotAsk });
import { Bot, Send, User } from "lucide-react";
import { clsx } from "clsx";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; snippet: string }[];
  createdAt: Date;
};

const SUGGESTED_PROMPTS = [
  "What do I need to bring on my first day?",
  "How do I set up my workspace?",
  "Where can I find the employee handbook?",
  "What are the company benefits?",
];

function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [conversationTitle, setConversationTitle] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatbot = useChatbotQuery();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAsk = async (text?: string) => {
    const question = (text ?? query).trim();
    if (!question) return;

    setQuery("");
    if (!conversationTitle)
      setConversationTitle(
        question.slice(0, 40) + (question.length > 40 ? "…" : ""),
      );

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await chatbot.mutateAsync({ query: question });
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          result.answer ||
          "I couldn’t find a specific answer. Try rephrasing or ask your HR team.",
        sources: result.sources?.length ? result.sources : undefined,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationTitle(null);
    setQuery("");
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col space-y-4">
      <PageHeader
        title="Chatbot"
        subtitle="Ask the onboarding assistant for instant guidance."
      />

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Sidebar - conversations */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <Card className="flex h-full flex-col p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink">Chats</span>
              <Button
                variant="ghost"
                className="text-xs"
                onClick={handleNewChat}>
                New chat
              </Button>
            </div>
            <div className="mt-3 flex-1 overflow-auto text-sm text-muted">
              {conversationTitle ? (
                <div className="rounded-xl bg-slate-100 px-3 py-2 font-medium text-ink">
                  {conversationTitle}
                </div>
              ) : (
                <p className="italic">Start a conversation to see it here.</p>
              )}
            </div>
          </Card>
        </aside>

        {/* Main chat area */}
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Bot className="h-7 w-7 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-ink">
                  How can I help you today?
                </p>
                <p className="mt-1 text-sm text-muted">
                  Ask about policies, first day, or benefits.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleAsk(prompt)}
                      className="rounded-xl border border-stroke bg-white px-4 py-2 text-left text-sm text-muted transition hover:border-slate-300 hover:bg-slate-50 hover:text-ink">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={clsx(
                      "flex gap-3",
                      msg.role === "user" && "flex-row-reverse",
                    )}>
                    <div
                      className={clsx(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        msg.role === "user" ? "bg-slate-700" : "bg-slate-200",
                      )}>
                      {msg.role === "user" ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                    <div
                      className={clsx(
                        "max-w-[85%] space-y-2 rounded-2xl px-4 py-3 text-sm",
                        msg.role === "user"
                          ? "bg-slate-800 text-white"
                          : "bg-slate-100 text-ink",
                      )}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 border-t border-slate-200/80 pt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                            Sources
                          </p>
                          <ul className="space-y-2">
                            {msg.sources.map((s) => (
                              <li
                                key={s.title}
                                className="rounded-lg bg-white/80 px-3 py-2 text-xs text-muted">
                                <span className="font-medium text-ink">
                                  {s.title}
                                </span>
                                <p className="mt-1">{s.snippet}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {chatbot.isPending && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200">
                      <Bot className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-stroke bg-slate-50/80 p-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}>
              <input
                type="text"
                className="min-w-0 flex-1 rounded-2xl border border-stroke bg-white px-4 py-3 text-sm text-ink shadow-sm placeholder:text-muted focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Ask about onboarding, policies, or benefits…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={chatbot.isPending}
              />
              <Button
                type="submit"
                disabled={chatbot.isPending || !query.trim()}
                className="shrink-0 rounded-2xl px-5"
                icon={<Send className="h-4 w-4" />}>
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Chatbot;

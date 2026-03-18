import { useState, useRef, useEffect } from "react";
import { Card } from "antd";
import { useMutation } from "@tanstack/react-query";
import { apiChatbotAsk } from "@/api/chatbot/chatbot.api";
import BaseButton from "@/components/button";
import { Bot, CalendarDays, Flag, Send, User } from "lucide-react";
import { clsx } from "clsx";
import { useLocale } from "@/i18n";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; snippet: string }[];
  createdAt: Date;
};

const ONBOARDING_JOURNEY = [
  {
    key: "day1",
    titleKey: "chatbot.stage.day1",
    icon: Flag,
    prompts: ["chatbot.prompt.day1.first", "chatbot.prompt.day1.second"],
  },
  {
    key: "week1",
    titleKey: "chatbot.stage.week1",
    icon: CalendarDays,
    prompts: ["chatbot.prompt.week1.first", "chatbot.prompt.week1.second"],
  },
  {
    key: "month1",
    titleKey: "chatbot.stage.month1",
    icon: Bot,
    prompts: ["chatbot.prompt.month1.first", "chatbot.prompt.month1.second"],
  },
];

const Chatbot = () => {
  const { t } = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [conversationTitle, setConversationTitle] = useState<string | null>(
    null,
  );
  const [selectedStage, setSelectedStage] = useState(ONBOARDING_JOURNEY[0].key);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSeqRef = useRef(0);
  const chatbot = useMutation({ mutationFn: apiChatbotAsk });

  const nextMessageId = (role: Message["role"]) => {
    messageSeqRef.current += 1;
    return `${role}-${messageSeqRef.current}`;
  };

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
      id: nextMessageId("user"),
      role: "user",
      content: question,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await chatbot.mutateAsync({ query: question });
      const assistantMsg: Message = {
        id: nextMessageId("assistant"),
        role: "assistant",
        content: result.answer || t("chatbot.fallback.no_answer"),
        sources: result.sources?.length ? result.sources : undefined,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMsg: Message = {
        id: nextMessageId("assistant"),
        role: "assistant",
        content: t("chatbot.error.generic"),
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

  const selectedStageConfig =
    ONBOARDING_JOURNEY.find((x) => x.key === selectedStage) ??
    ONBOARDING_JOURNEY[0];

  return (
    <div className="relative flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-[radial-gradient(circle_at_20%_0%,rgba(186,230,253,0.22),transparent_40%),radial-gradient(circle_at_95%_10%,rgba(191,219,254,0.25),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#ffffff_48%,#f8fafc_100%)] p-4 shadow-sm sm:p-5">
      <div className="flex min-h-0 flex-1 gap-4">
        <aside className="hidden w-72 shrink-0 xl:block">
          <Card
            className="h-full overflow-hidden border-slate-200/80 bg-white/90"
            classNames={{ body: "h-full p-4" }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                {t("chatbot.journey.label")}
              </span>
              <BaseButton size="small" type="text" onClick={handleNewChat}>
                {t("chatbot.journey.new_chat")}
              </BaseButton>
            </div>

            <div className="mt-3 space-y-2">
              {ONBOARDING_JOURNEY.map((stage) => {
                const StageIcon = stage.icon;
                return (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => setSelectedStage(stage.key)}
                    className={clsx(
                      "w-full rounded-xl border px-3 py-3 text-left transition-all duration-200",
                      selectedStage === stage.key
                        ? "border-sky-300 bg-sky-50/90 shadow-sm"
                        : "border-slate-200 bg-white/90 hover:border-slate-300 hover:bg-white",
                    )}>
                    <div className="flex items-center gap-2">
                      <StageIcon className="h-4 w-4 text-sky-600" />
                      <span className="text-sm font-semibold text-slate-800">
                        {t(stage.titleKey)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("chatbot.journey.suggested_prompts_count", {
                        count: stage.prompts.length,
                      })}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/90 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("chatbot.journey.conversation")}
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-700">
                {conversationTitle ??
                  t("chatbot.journey.conversation_placeholder")}
              </p>
            </div>
          </Card>
        </aside>

        <Card
          className="flex min-h-0 flex-1 flex-col overflow-hidden border-slate-200/80 bg-white/95"
          classNames={{ body: "flex min-h-0 flex-1 flex-col p-0" }}>
          <div className="border-b border-slate-200/80 bg-slate-50/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {t("nav.chatbot")}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t("chatbot.panel.subtitle", {
                stage: t(selectedStageConfig.titleKey),
              })}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-white to-indigo-100 ring-1 ring-slate-200/70">
                  <Bot className="h-7 w-7 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-ink">
                  {t("chatbot.empty.title")}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {t("chatbot.empty.subtitle")}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {selectedStageConfig.prompts.map((promptKey) => (
                    <button
                      key={promptKey}
                      type="button"
                      onClick={() => handleAsk(t(promptKey))}
                      className="rounded-xl border border-stroke bg-white px-4 py-2 text-left text-sm text-muted shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-ink">
                      {t(promptKey)}
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
                            {t("chatbot.sources.label")}
                          </p>
                          <ul className="space-y-2">
                            {msg.sources.map((s) => (
                              <li
                                key={s.title}
                                className="rounded-lg bg-white/80 px-3 py-2 text-xs text-muted">
                                <span className="font-medium text-ink">
                                  {s.title}
                                </span>
                                {s.snippet ? (
                                  <p className="mt-1">{s.snippet}</p>
                                ) : null}
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
                    <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                      <span className="text-xs font-medium text-slate-500">
                        {t("chatbot.status.thinking")}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-stroke bg-slate-50/90 p-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}>
              <input
                type="text"
                className="min-w-0 flex-1 rounded-2xl border border-stroke bg-white px-4 py-3 text-sm text-ink shadow-sm placeholder:text-muted focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder={t("chatbot.input.placeholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={chatbot.isPending}
              />
              <BaseButton
                type="submit"
                disabled={chatbot.isPending || !query.trim()}
                className="shrink-0 rounded-2xl px-5"
                icon={<Send className="h-4 w-4" />}>
                {t("chatbot.input.send")}
              </BaseButton>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chatbot;

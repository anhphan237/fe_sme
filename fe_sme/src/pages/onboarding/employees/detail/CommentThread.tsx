import { useState } from "react";
import { Send } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@core/components/ui/Button";
import { Skeleton } from "@core/components/ui/Skeleton";
import { useToast } from "@core/components/ui/Toast";
import { useLocale } from "@/i18n";
import type { CommentResponse } from "@/interface/onboarding";

// ─── Local Hooks ──────────────────────────────────────────────────────────────
// TODO: com.sme.onboarding.task.comment.* operations are not yet in the backend

const useCommentsQuery = (_taskId?: string) =>
  useQuery<CommentResponse[]>({
    queryKey: ["task-comments"],
    queryFn: () => Promise.resolve([]),
    initialData: [],
  });

const useAddComment = () =>
  useMutation({
    mutationFn: (_payload: { taskId: string; message: string }) =>
      Promise.resolve(),
  });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommentThreadProps {
  taskId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CommentThread = ({ taskId }: CommentThreadProps) => {
  const { t } = useLocale();
  const toast = useToast();
  const { data: comments = [], isLoading } = useCommentsQuery(taskId);
  const addComment = useAddComment();

  const [message, setMessage] = useState("");

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ taskId, message: trimmed });
      setMessage("");
      toast(t("onboarding.comment.toast.sent"));
    } catch {
      toast(t("onboarding.comment.toast.failed"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {t("onboarding.comment.title")}
      </h4>

      {/* Comment list */}
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {isLoading ? (
          <>
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </>
        ) : comments.length > 0 ? (
          comments.map((c) => (
            <div
              key={c.commentId}
              className="rounded-xl border border-stroke bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-ink">
                  {c.authorName ?? t("onboarding.comment.unknown_author")}
                </span>
                {c.createdAt && (
                  <span className="text-[10px] text-muted">{c.createdAt}</span>
                )}
              </div>
              <p className="text-sm text-ink whitespace-pre-wrap">
                {c.message}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">{t("onboarding.comment.empty")}</p>
        )}
      </div>

      {/* Add comment form */}
      <div className="flex items-end gap-2">
        <textarea
          className="flex-1 resize-none rounded-xl border border-stroke bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10 transition"
          rows={2}
          placeholder={t("onboarding.comment.placeholder")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={addComment.isPending}
        />
        <Button
          variant="primary"
          className="shrink-0 px-3 py-2.5"
          onClick={handleSend}
          disabled={!message.trim() || addComment.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Modal } from "@core/components/ui/Modal";
import { Button } from "@core/components/ui/Button";
import { useToast } from "@core/components/ui/Toast";
import { useLocale } from "@/i18n";
import type { EvaluationCreateRequest } from "@/interface/onboarding";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EvaluationModalProps {
  open: boolean;
  onClose: () => void;
  instanceId: string;
  milestone: "7" | "30" | "60";
}

// ─── Component ────────────────────────────────────────────────────────────────

export const EvaluationModal = ({
  open,
  onClose,
  instanceId,
  milestone,
}: EvaluationModalProps) => {
  const { t } = useLocale();
  const toast = useToast();
  const queryClient = useQueryClient();
  const createEvaluation = useMutation({
    // TODO: com.sme.onboarding.evaluation.create not yet in backend
    mutationFn: (_payload: EvaluationCreateRequest) => Promise.resolve(),
  });

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [notes, setNotes] = useState("");

  const handleClose = () => {
    setRating(0);
    setHovered(0);
    setNotes("");
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    try {
      await createEvaluation.mutateAsync({
        instanceId,
        milestone,
        rating,
        notes: notes.trim() || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["evaluations", instanceId] });
      toast(t("onboarding.detail.eval.toast.saved"));
      handleClose();
    } catch {
      toast(t("onboarding.detail.eval.toast.failed"));
    }
  };

  const labelCls =
    "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted";
  const inputCls =
    "w-full rounded-xl border border-stroke bg-white px-3.5 py-2.5 text-sm text-ink transition placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10";

  return (
    <Modal
      open={open}
      title={t("onboarding.detail.eval.modal.title")}
      onClose={handleClose}>
      <div className="space-y-5">
        {/* Milestone label */}
        <p className="text-sm text-muted">
          {t("onboarding.detail.eval.day", { day: milestone })}
        </p>

        {/* Star rating */}
        <div>
          <label className={labelCls}>
            {t("onboarding.detail.eval.rating")}
          </label>
          <div className="flex gap-1.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={t("onboarding.detail.eval.rate_aria", { star })}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                className="p-0.5 transition-transform hover:scale-110 focus:outline-none">
                <Star
                  className="h-7 w-7 transition-colors"
                  fill={star <= (hovered || rating) ? "#f59e0b" : "none"}
                  stroke={star <= (hovered || rating) ? "#f59e0b" : "#d1d5db"}
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>
            {t("onboarding.detail.eval.notes")}
          </label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder={t("onboarding.detail.eval.notes_placeholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={handleClose}>
            {t("global.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={rating === 0 || createEvaluation.isPending}>
            {t("onboarding.detail.eval.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

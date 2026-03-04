import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n";

interface Props {
  step: number;
  totalSteps: number;
  isEdit: boolean;
  isPending: boolean;
  canAdvance: boolean;
  formName: string;
  onBack: () => void;
  onCancel: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function WizardFooter({
  step,
  totalSteps,
  isEdit,
  isPending,
  canAdvance,
  formName,
  onBack,
  onCancel,
  onNext,
  onSubmit,
}: Props) {
  const { t } = useLocale();
  const isLast = step === totalSteps - 1;

  const stepKeys = [
    "onboarding.template.editor.step.info",
    "onboarding.template.editor.step.stages",
    "onboarding.template.editor.step.tasks",
    "onboarding.template.editor.step.review",
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-stroke bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.07)] lg:left-64">
      <div className="mx-auto max-w-3xl px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left — back / cancel */}
          <div className="w-28 shrink-0">
            {step > 0 ? (
              <Button variant="ghost" onClick={onBack} className="gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {t("onboarding.template.editor.btn.back")}
              </Button>
            ) : (
              <Button variant="ghost" onClick={onCancel}>
                {t("onboarding.template.editor.btn.cancel")}
              </Button>
            )}
          </div>

          {/* Center — step indicator */}
          <div className="flex flex-1 flex-col items-center gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
              {t(stepKeys[step] ?? stepKeys[0])}
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={`block rounded-full transition-all duration-300 ${
                    i === step
                      ? "h-1.5 w-8 bg-brand"
                      : i < step
                        ? "h-1.5 w-4 bg-brand/40"
                        : "h-1.5 w-4 bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted/60">
              {step + 1} / {totalSteps}
            </p>
          </div>

          {/* Right — next / submit */}
          <div className="flex w-28 shrink-0 justify-end">
            {!isLast ? (
              <Button
                variant="primary"
                onClick={onNext}
                disabled={!canAdvance}
                className="gap-1.5">
                {t("onboarding.template.editor.btn.next")}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Button>
            ) : (
              <Button
                onClick={onSubmit}
                disabled={isPending || !formName.trim()}
                className="gap-1.5">
                {isPending ? (
                  <>
                    <svg
                      className="h-3.5 w-3.5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    {isEdit
                      ? t("onboarding.template.editor.btn.saving")
                      : t("onboarding.template.editor.btn.creating")}
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {isEdit
                      ? t("onboarding.template.editor.btn.save")
                      : t("onboarding.template.editor.btn.create")}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

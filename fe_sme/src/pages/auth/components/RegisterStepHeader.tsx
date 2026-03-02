import { useLocale } from "@/i18n";

const TITLE_KEYS = [
  "register.step0.title",
  "register.step1.title",
  "register.step2.title",
  "register.step3.title",
  "register.step4.title",
];

const SUBTITLE_KEYS = [
  "register.step0.subtitle",
  "register.step1.subtitle",
  "register.step2.subtitle",
  "register.step3.subtitle",
  "register.step4.subtitle",
];

interface RegisterStepHeaderProps {
  step: number;
  totalSteps?: number;
  errorMessage?: string | null;
}

export function RegisterStepHeader({
  step,
  totalSteps = 5,
  errorMessage,
}: RegisterStepHeaderProps) {
  const { t } = useLocale();

  return (
    <div className="mb-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/8 rounded-full mb-3">
        <span className="text-[11px] font-bold text-brand uppercase tracking-wider">
          {t("register.step_badge", {
            current: String(step + 1),
            total: String(totalSteps),
          })}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {t(TITLE_KEYS[step] ?? TITLE_KEYS[0])}
      </h1>
      <p className="text-[14px] text-gray-500">
        {t(SUBTITLE_KEYS[step] ?? SUBTITLE_KEYS[0])}
      </p>

      {errorMessage && (
        <div className="mt-4 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
          <svg
            className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
            viewBox="0 0 16 16"
            fill="none">
            <circle
              cx="8"
              cy="8"
              r="6.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M8 5v4M8 11.5v.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-[13px] text-red-600">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}

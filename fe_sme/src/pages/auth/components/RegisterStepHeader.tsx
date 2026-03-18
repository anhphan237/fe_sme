import { Alert } from "antd";
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
  totalSteps: number;
  error?: string | null;
}

export const RegisterStepHeader = ({
  step,
  totalSteps,
  error,
}: RegisterStepHeaderProps) => {
  const { t } = useLocale();

  return (
    <header className="mb-8">
      {/* Step progress dots */}
      <div className="flex items-center gap-2 mb-5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all duration-300 shrink-0 ${
              i === step
                ? "w-6 bg-brand"
                : i < step
                  ? "w-3 bg-brand/50"
                  : "w-3 bg-gray-200"
            }`}
            aria-hidden="true"
          />
        ))}
        <span className="ml-auto text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
          {t("register.step_badge", {
            current: String(step + 1),
            total: String(totalSteps),
          })}
        </span>
      </div>

      <h1 className="text-[22px] font-bold text-gray-900 leading-snug mb-1.5">
        {t(TITLE_KEYS[step] ?? TITLE_KEYS[0])}
      </h1>
      <p className="text-sm text-gray-500 leading-relaxed">
        {t(SUBTITLE_KEYS[step] ?? SUBTITLE_KEYS[0])}
      </p>
      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          className="mt-4 rounded-xl"
        />
      )}
    </header>
  );
};

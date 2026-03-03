import { useLocale } from "@/i18n";

interface RegisterNavButtonsProps {
  step: number;
  handleBack: () => void;
  handleNext: () => Promise<void>;
  registering: boolean;
}

export function RegisterNavButtons({
  step,
  handleBack,
  handleNext,
  registering,
}: RegisterNavButtonsProps) {
  const { t } = useLocale();

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
      <button
        type="button"
        onClick={handleBack}
        disabled={registering}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-40">
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
          <path
            d="M13 8H3M7 4l-4 4 4 4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t("register.btn.back")}
      </button>

      <button
        type="button"
        onClick={handleNext}
        disabled={registering}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand text-white text-[13px] font-semibold hover:bg-brandDark transition-all shadow-sm shadow-brand/20 disabled:opacity-60">
        {registering ? (
          <>
            <svg
              className="w-3.5 h-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity=".25"
              />
              <path
                d="M12 2a10 10 0 0110 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            {t("register.btn.registering")}
          </>
        ) : (
          <>
            {t("register.btn.continue")}
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}

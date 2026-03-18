import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale } from "@/i18n";
import BaseButton from "@/components/button";

interface RegisterStepNavigationProps {
  onBack: () => void;
  onNext: () => Promise<void> | void;
  loading?: boolean;
  nextLabel?: string;
  /** When true the Back button is hidden (e.g. first step) */
  hideBack?: boolean;
}

export const RegisterStepNavigation = ({
  onBack,
  onNext,
  loading = false,
  nextLabel,
  hideBack = false,
}: RegisterStepNavigationProps) => {
  const { t } = useLocale();

  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
      {hideBack ? (
        <span />
      ) : (
        <BaseButton
          onClick={onBack}
          disabled={loading}
          icon={<ArrowLeft className="w-3.5 h-3.5" />}>
          {t("register.btn.back")}
        </BaseButton>
      )}
      <BaseButton
        type="primary"
        onClick={onNext}
        loading={loading}
        disabled={loading}
        iconPosition="end"
        icon={<ArrowRight className="w-3.5 h-3.5" />}>
        {nextLabel ?? t("register.btn.continue")}
      </BaseButton>
    </div>
  );
};

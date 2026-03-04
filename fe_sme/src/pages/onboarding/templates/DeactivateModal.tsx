import { useLocale } from "@/i18n";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { OnboardingTemplate } from "@/shared/types";

export interface DeactivateModalProps {
  target: OnboardingTemplate | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeactivateModal({
  target,
  loading,
  onClose,
  onConfirm,
}: DeactivateModalProps) {
  const { t } = useLocale();
  return (
    <Modal
      open={!!target}
      title={t("onboarding.template.deactivate.title")}
      onClose={onClose}>
      {target && (
        <>
          <p className="text-sm text-muted">
            {t("onboarding.template.deactivate.message", { name: target.name })}
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>
              {t("global.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={loading}>
              {loading
                ? t("onboarding.template.deactivate.loading")
                : t("onboarding.template.deactivate.confirm")}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

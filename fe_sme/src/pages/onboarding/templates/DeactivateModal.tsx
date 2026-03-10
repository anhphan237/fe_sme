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
  const isActive = (target?.status ?? "ACTIVE").toUpperCase() === "ACTIVE";
  const prefix = isActive
    ? "onboarding.template.deactivate"
    : "onboarding.template.activate";

  return (
    <Modal open={!!target} title={t(`${prefix}.title`)} onClose={onClose}>
      {target && (
        <>
          <p className="text-sm text-muted">
            {t(`${prefix}.message`, { name: target.name })}
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose}>
              {t("global.cancel")}
            </Button>
            <Button
              variant={isActive ? "destructive" : "primary"}
              onClick={onConfirm}
              disabled={loading}>
              {loading ? t(`${prefix}.loading`) : t(`${prefix}.confirm`)}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

import { memo } from "react";
import { Button } from "antd";
import BaseModal from "@core/components/Modal/BaseModal";
import { useLocale } from "@/i18n";
import type { OnboardingTemplate } from "@/shared/types";

interface TemplateToggleModalProps {
  actionTarget: OnboardingTemplate | null;
  isActive: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
  onCancel?: () => void;
}

const modalKey = (isActive: boolean, suffix: string) =>
  `${isActive ? "onboarding.template.deactivate" : "onboarding.template.activate"}.${suffix}`;

export const TemplateToggleModal = memo(function TemplateToggleModal({
  actionTarget,
  isActive,
  isPending,
  onConfirm,
  onClose,
}: TemplateToggleModalProps) {
  const { t } = useLocale();

  return (
    <BaseModal
      open={!!actionTarget}
      title={t(modalKey(isActive, "title"))}
      onCancel={onClose}
      footer={null}>
      {actionTarget ? (
        <>
          <p className="text-sm text-muted">
            {t(modalKey(isActive, "message"), { name: actionTarget.name })}
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={onClose}>{t("global.cancel")}</Button>
            <Button
              type={isActive ? "default" : "primary"}
              danger={isActive}
              onClick={onConfirm}
              loading={isPending}>
              {t(modalKey(isActive, "confirm"))}
            </Button>
          </div>
        </>
      ) : null}
    </BaseModal>
  );
});

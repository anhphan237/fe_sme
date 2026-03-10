import { useLocale } from "@/i18n";
import React from "react";

import BaseButton from "../button";

type Props = {
  onOk: () => void;
  onCancel: () => void;
  disabled?: boolean;
};

const ModalFooter: React.FC<Props> = ({ onOk, onCancel, disabled = false }) => {
  const { t } = useLocale();
  return (
    <div>
      <BaseButton label={t("global.popup.reject")} onClick={onCancel} />
      <BaseButton
        label={t("global.popup.save")}
        type="primary"
        onClick={onOk}
        disabled={disabled}
        className="ml-2"
      />
    </div>
  );
};

export default ModalFooter;

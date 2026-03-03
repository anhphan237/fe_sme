/**
 * ModalFooter — cancel / save button pair for modals (ported from PMS)
 */
import BaseButton from "./BaseButton";

interface ModalFooterProps {
  onOk: () => void;
  onCancel: () => void;
  disabled?: boolean;
  okLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

const ModalFooter = ({
  onOk,
  onCancel,
  disabled = false,
  okLabel = "global.popup.save",
  cancelLabel = "global.popup.reject",
  loading = false,
}: ModalFooterProps) => {
  return (
    <div className="flex justify-end gap-2">
      <BaseButton label={cancelLabel} onClick={onCancel} disabled={loading} />
      <BaseButton
        label={okLabel}
        type="primary"
        onClick={onOk}
        disabled={disabled}
        loading={loading}
      />
    </div>
  );
};

export default ModalFooter;

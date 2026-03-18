import { useLocale } from "@/i18n";
import { Button } from "antd";
import {
  forwardRef,
  isValidElement,
  useImperativeHandle,
  useState,
} from "react";
import React from "react";

import usePromiseHolder from "@/hooks/usePromiseHolder";

import BaseModal, { type BaseModalProps } from "./BaseModal";
import "./ConfirmModal.css";

export interface ConfirmModalHandles {
  open: (params?: {
    message?: React.ReactNode;
  }) => Promise<{ code: number; message: string }>;
}

export const CONFIRM_CODE = {
  CONFIRMED: 200,
  CANCELED: -1,
} as const;
export type CONFIRM_CODE = (typeof CONFIRM_CODE)[keyof typeof CONFIRM_CODE];

interface ConfirmModalProps extends Omit<
  BaseModalProps,
  "onConfirm" | "onCancel"
> {
  message?: React.ReactNode;
}

const ConfirmModal = forwardRef<ConfirmModalHandles, ConfirmModalProps>(
  (props, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const { execute, resolve, reject } = usePromiseHolder<{
      code: number;
      message: string;
    }>({
      defaultValue: { code: -1, message: "unknown" },
    });
    const { t } = useLocale();
    const [message, setMessage] = useState<React.ReactNode>(
      props.message || "",
    );

    useImperativeHandle(ref, () => ({
      open: (params) => {
        if (params?.message) {
          setMessage(params.message);
        }
        setIsOpen(true);
        return execute();
      },
    }));

    const handleConfirm = () => {
      resolve({ code: CONFIRM_CODE.CONFIRMED, message: "Confirmed" });
      setIsOpen(false);
      setMessage("");
    };

    const handleCancel = () => {
      reject({ code: CONFIRM_CODE.CANCELED, message: "Canceled" });
      setIsOpen(false);
      setMessage("");
    };

    const renderDescription = () => {
      const result = message ?? props.message;
      return result && isValidElement(result)
        ? React.cloneElement(result)
        : result || "";
    };

    return (
      <BaseModal
        rootClassName="confirm-modal"
        closable={false}
        centered
        open={isOpen}
        onCancel={handleCancel}
        footer={null}
        {...props}>
        <div>
          <p className="text-gray-600">{renderDescription()}</p>
          <div className="flex justify-between mt-4">
            <Button
              className="w-[calc(50%_-_8px)]"
              type="primary"
              onClick={handleConfirm}>
              {t("global.confirm")}
            </Button>
            <Button className="w-[calc(50%_-_8px)]" onClick={handleCancel}>
              {t("global.cancel")}
            </Button>
          </div>
        </div>
      </BaseModal>
    );
  },
);

export default ConfirmModal;

import { Modal } from "antd";
import type { ModalProps } from "antd";
import React from "react";

export interface BaseModalProps extends ModalProps {}

const BaseModal: React.FC<BaseModalProps> = ({ open, children, ...props }) => {
  return (
    <Modal
      open={open}
      maskClosable={false}
      destroyOnClose={true}
      centered={true}
      {...props}>
      {children}
    </Modal>
  );
};

export default BaseModal;

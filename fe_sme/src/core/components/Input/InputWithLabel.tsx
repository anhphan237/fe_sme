import React from "react";
import { Input, type InputProps } from "antd";
import type { FormItemProps } from "antd/lib";
import type { NamePath } from "antd/es/form/interface";
import BaseFormItem from "@core/components/Form/BaseFormItem";

export interface InputWithLabelProps extends InputProps {
  name: NamePath;
  label?: React.ReactNode;
  formItemProps?: FormItemProps;
}

const BaseInput = ({
  name,
  label,
  formItemProps,
  ...props
}: InputWithLabelProps) => {
  return (
    <BaseFormItem key={name} label={label} name={name} {...formItemProps}>
      <Input {...props} />
    </BaseFormItem>
  );
};

export default BaseInput;

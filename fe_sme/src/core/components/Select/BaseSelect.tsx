import BaseFormItem from "@core/components/Form/BaseFormItem";
import { Select, type FormItemProps, type SelectProps } from "antd";
import type { NamePath } from "antd/es/form/interface";

export interface BaseSelectProps extends SelectProps {
  name: NamePath;
  label?: React.ReactNode;
  formItemProps?: FormItemProps;
}

const BaseSelect = ({
  name,
  label,
  formItemProps,
  ...props
}: BaseSelectProps) => {
  return (
    <BaseFormItem key={name} label={label} name={name} {...formItemProps}>
      <Select {...props} />
    </BaseFormItem>
  );
};

export default BaseSelect;

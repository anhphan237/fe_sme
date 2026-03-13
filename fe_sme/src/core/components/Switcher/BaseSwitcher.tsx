import BaseFormItem from "@core/components/Form/BaseFormItem";
import { Switch, type FormItemProps } from "antd";
import type { NamePath } from "antd/es/form/interface";
import type { SwitchProps } from "antd/lib";

export interface BaseSwitcherProps extends SwitchProps {
  name: NamePath;
  label?: React.ReactNode;
  formItemProps?: FormItemProps;
}

const BaseSwitcher = ({
  name,
  label,
  formItemProps,
  ...props
}: BaseSwitcherProps) => {
  return (
    <BaseFormItem label={label} name={name} {...formItemProps}>
      <Switch {...props} />
    </BaseFormItem>
  );
};

export default BaseSwitcher;

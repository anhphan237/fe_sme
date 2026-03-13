import BaseFormItem from "@core/components/Form/BaseFormItem";
import { AutoComplete, type FormItemProps } from "antd";
import type { NamePath } from "antd/es/form/interface";
import type { AutoCompleteProps } from "antd/lib";

export interface BaseAutoCompleteProps extends AutoCompleteProps {
  name: NamePath;
  label?: React.ReactNode;
  formItemProps?: FormItemProps;
}

const BaseAutoComplete = ({
  name,
  label,
  formItemProps,
  ...props
}: BaseAutoCompleteProps) => {
  return (
    <BaseFormItem label={label} name={name} {...formItemProps}>
      <AutoComplete {...props} />
    </BaseFormItem>
  );
};

export default BaseAutoComplete;

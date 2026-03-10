import BaseFormItem from "@core/components/Form/BaseFormItem";
import { DatePicker } from "antd";
import type { DatePickerProps, FormItemProps } from "antd";
import type { NamePath } from "antd/es/form/interface";

export interface BaseDatePickerProps extends DatePickerProps {
  name: NamePath;
  label?: React.ReactNode;
  formItemProps?: FormItemProps;
}

/**
 * BaseDatePicker — AntD DatePicker wrapped in BaseFormItem.
 * Uses dayjs (AntD v5 default) — no moment adapter needed.
 */
const BaseDatePicker = ({
  name,
  label,
  format,
  formItemProps,
  ...props
}: BaseDatePickerProps) => {
  return (
    <BaseFormItem key={name} label={label} name={name} {...formItemProps}>
      <DatePicker {...props} format={format ?? "DD-MM-YYYY"} />
    </BaseFormItem>
  );
};

export default BaseDatePicker;

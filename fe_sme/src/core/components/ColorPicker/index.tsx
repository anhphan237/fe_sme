import BaseFormItem from "@core/components/Form/BaseFormItem";
import { ColorPicker, ColorPickerProps, FormItemProps } from "antd";
import { Color } from "antd/es/color-picker";
import { NamePath } from "antd/es/form/interface";

export interface BaseColorPickerProps extends ColorPickerProps {
  name: NamePath;
  label?: React.ReactNode;
  formItemProps?: FormItemProps;
}

const BaseColorPicker = ({
  name,
  label,
  formItemProps,
  ...props
}: BaseColorPickerProps) => {
  return (
    <BaseFormItem
      label={label}
      name={name}
      getValueFromEvent={(color: Color) => color.toHexString()}
      {...formItemProps}>
      <ColorPicker {...props} />
    </BaseFormItem>
  );
};

export default BaseColorPicker;

import { Form, type FormItemProps } from "antd";

export interface BaseFormItemProps extends FormItemProps {}

const BaseFormItem: React.FC<BaseFormItemProps> = ({ className, ...props }) => {
  return (
    <Form.Item
      className={`!mb-0 ${className || ""}`}
      normalize={(value) => {
        if (typeof value === "string") {
          return value.trimStart();
        }
        return value;
      }}
      {...props}
    />
  );
};

export default BaseFormItem;

import Form from "antd/es/form";
import Select, { type SelectProps } from "antd/es/select";
import { useEffect, useState } from "react";

type Props = Omit<SelectProps, "value" | "onChange"> & {
  value: string | number | undefined;
  label: string;
  name: string;
  placeholder: string;
  errorMessage?: string;
  required?: boolean;
  onChange: (value: string | number | readonly string[]) => void;
  formClassName?: string;
};

const FormSelect = (props: Props) => {
  const {
    label,
    name: _name,
    placeholder,
    errorMessage,
    required,
    onChange,
    formClassName = "",
    value,
    onBlur,
    ...rest
  } = props;

  const [_changed, setChanged] = useState(false);

  useEffect(() => {
    return () => {
      setChanged(false);
    };
  }, []);

  return (
    <Form.Item
      label={label}
      rules={[{ required }]}
      help={errorMessage ?? null}
      validateStatus={errorMessage ? "error" : "success"}
      className={formClassName}>
      <Select
        placeholder={placeholder}
        onChange={(e) => {
          setChanged(true);
          onChange(e);
        }}
        value={value}
        defaultValue={value}
        {...rest}
        onBlur={onBlur}
      />
    </Form.Item>
  );
};

export default FormSelect;

/**
 * FormSelect - ported from PMS internal system
 * Ant Design based select with label + validation state
 *
 * @example
 * <FormSelect
 *   label="Vai trò"
 *   name="role"
 *   placeholder="Chọn vai trò"
 *   value={form.role}
 *   onChange={(val) => setForm({ ...form, role: val as string })}
 *   options={[
 *     { label: 'Admin', value: 'ADMIN' },
 *     { label: 'Staff', value: 'STAFF' },
 *   ]}
 *   required
 *   errorMessage={errors.role}
 * />
 */
import Form from "antd/es/form";
import Select from "antd/es/select";
import type { SelectProps } from "antd/es/select";
import { useEffect, useState } from "react";

export type FormSelectProps = Omit<SelectProps, "value" | "onChange"> & {
  value: string | number | undefined;
  label: string;
  name: string;
  placeholder: string;
  errorMessage?: string;
  required?: boolean;
  onChange: (value: string | number | readonly string[]) => void;
  formClassName?: string;
};

const FormSelect = (props: FormSelectProps) => {
  const {
    label,
    name,
    placeholder,
    errorMessage,
    required,
    onChange,
    formClassName = "",
    value,
    onBlur,
    ...rest
  } = props;

  const [, setChanged] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      setChanged(false);
    };
  }, []);

  return (
    <Form.Item
      label={label}
      rules={[{ required }]}
      help={errorMessage ? errorMessage : null}
      validateStatus={errorMessage ? "error" : undefined}
      className={formClassName}>
      <Select
        placeholder={placeholder}
        onChange={(e) => {
          setChanged(true);
          onChange(e);
        }}
        value={value ?? undefined}
        {...rest}
        onBlur={onBlur}
      />
    </Form.Item>
  );
};

export default FormSelect;

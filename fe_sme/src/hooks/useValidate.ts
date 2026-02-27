/**
 * useValidate — yup-free form validation hook
 * Adapted from PMS — uses simple required-field checking compatible with React Hook Form / custom forms
 */
import { getDefaultFormError } from "@/utils/helpers";
import { useEffect, useState } from "react";

type FieldError = { isValid: boolean; message: string };
type FormError = Record<string, FieldError>;

type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validate?: (value: unknown) => string | undefined;
};

type SchemaField = ValidationRule | ((value: unknown) => string | undefined);

type Schema<T> = Partial<Record<keyof T, SchemaField>>;

function validateField(value: unknown, rule: SchemaField): string | undefined {
  if (typeof rule === "function") return rule(value);

  const r = rule as ValidationRule;
  if (r.required && (value === undefined || value === null || value === "")) {
    return "Trường này là bắt buộc";
  }
  if (r.minLength && typeof value === "string" && value.length < r.minLength) {
    return `Tối thiểu ${r.minLength} ký tự`;
  }
  if (r.maxLength && typeof value === "string" && value.length > r.maxLength) {
    return `Tối đa ${r.maxLength} ký tự`;
  }
  if (r.pattern && typeof value === "string" && !r.pattern.test(value)) {
    return "Giá trị không hợp lệ";
  }
  if (r.validate) return r.validate(value);
  return undefined;
}

type Options<T> = {
  fields: (keyof T)[];
  formData: T;
  schema: Schema<T>;
  id: string;
};

export const useValidate = <T extends Record<string, unknown>>({
  fields,
  formData,
  schema,
  id,
}: Options<T>) => {
  const [formError, setFormError] = useState<FormError>(
    getDefaultFormError(fields as string[]),
  );
  const [isValidForm, setIsValidForm] = useState(false);
  const [isChange, setIsChange] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    if (isChange) handleValidate();
  }, [formData, isChange]);

  const handleValidate = () => {
    const errors = getDefaultFormError(fields as string[]);
    let valid = true;

    for (const field of fields) {
      const rule = schema[field];
      if (!rule) continue;
      const msg = validateField(formData[field as string], rule);
      if (msg) {
        errors[field as string] = { isValid: false, message: msg };
        valid = false;
      }
    }

    setFormError(errors);
    setIsValidForm(valid);
    return valid;
  };

  const refreshForm = () => {
    setFormError(getDefaultFormError(fields as string[]));
    setIsValidForm(false);
    setIsChange(false);
    setModalKey((k) => k + 1);
  };

  return {
    formError,
    isValidForm,
    isChange,
    setIsChange,
    modalKey: `${id}-${modalKey}`,
    refreshForm,
    setFormError,
    handleValidate,
  };
};

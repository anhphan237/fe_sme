import dayjs from "dayjs";

import BaseDatePicker, { BaseDatePickerProps } from ".";

export type LocalDatePickerProps = BaseDatePickerProps;

/**
 * LocalDatePicker — normalises ISO string ↔ dayjs for form fields.
 * getValueProps: ISO string → dayjs (for display)
 * normalize: dayjs → ISO string (for submission)
 */
const LocalDatePicker = ({ formItemProps, ...props }: LocalDatePickerProps) => {
  const { getValueProps, normalize, ...restFormItemProps } =
    formItemProps || {};

  return (
    <BaseDatePicker
      formItemProps={{
        ...restFormItemProps,
        getValueProps: (value?: string | null) => {
          if (getValueProps) return getValueProps(value);
          return {
            value: value && dayjs(value).isValid() ? dayjs(value) : null,
          };
        },
        normalize: (
          value: unknown,
          prevValues?: unknown,
          allValues?: unknown,
        ) => {
          if (normalize) return normalize(value, prevValues, allValues);
          if (!value) return null;
          const d = dayjs(value as string);
          return d.isValid() ? d.toISOString() : null;
        },
      }}
      {...props}
    />
  );
};

export default LocalDatePicker;

import moment from 'moment';

import BaseDatePicker, { BaseDatePickerProps } from '.';

export interface LocalDatePickerProps extends BaseDatePickerProps {}
const LocalDatePicker = ({ formItemProps, ...props }: LocalDatePickerProps) => {
    const { getValueProps, normalize, ...restFormItemProps } = formItemProps || {};
    return (
        <BaseDatePicker
            formItemProps={{
                ...restFormItemProps,
                getValueProps: (value?: string | null) => {
                    if (getValueProps) return getValueProps(value);
                    const sanitizedValue = value && moment(value).isValid() ? moment.utc(value).local() : null;
                    return { value: sanitizedValue };
                },
                normalize: (value?: string | null, prevValues?: any, allValues?: any) => {
                    if (normalize) return normalize(value, prevValues, allValues);
                    const isoValue = value && moment(value).isValid() ? moment(value).utc().toISOString() : null;
                    return isoValue;
                },
            }}
            {...props}
        />
    );
};

export default LocalDatePicker;

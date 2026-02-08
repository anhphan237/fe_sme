import BaseFormItem from '@core/components/Form/BaseFormItem';
import { DatePicker, DatePickerProps, FormItemProps } from 'antd';
import { NamePath } from 'antd/es/form/interface';
import type { Moment } from 'moment';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';

/**
 * @description: Dammmmm, DatePicker is not working with moment, so we need custom Date Library
 * @issue https://github.com/ant-design/ant-design/issues/50622#issuecomment-2317050774
 */
const CustomDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig) as typeof DatePicker;

export interface BaseDatePickerProps extends DatePickerProps {
    name: NamePath;
    label?: React.ReactNode;
    formItemProps?: FormItemProps;
}

const BaseDatePicker = ({ name, label, format, formItemProps, ...props }: BaseDatePickerProps) => {
    return (
        <BaseFormItem key={name} label={label} name={name} {...formItemProps}>
            <CustomDatePicker {...props} format={format ?? 'DD-MM-YYYY'} />
        </BaseFormItem>
    );
};

export default BaseDatePicker;

import BaseFormItem from '@core/components/Form/BaseFormItem';
import { FormItemProps, Select, SelectProps } from 'antd';
import { NamePath } from 'antd/es/form/interface';

export interface BaseSelectProps extends SelectProps {
    name: NamePath;
    label?: React.ReactNode;
    formItemProps?: FormItemProps;
}

const BaseSelect = ({ name, label, formItemProps, ...props }: BaseSelectProps) => {
    return (
        <BaseFormItem key={name} label={label} name={name} {...formItemProps}>
            <Select {...props} />
        </BaseFormItem>
    );
};

export default BaseSelect;

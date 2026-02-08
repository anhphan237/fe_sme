import BaseFormItem from '@core/components/Form/BaseFormItem';
import { Checkbox, FormItemProps } from 'antd';
import { NamePath } from 'antd/es/form/interface';
import { CheckboxProps } from 'antd/lib';

export interface BaseCheckboxProps extends CheckboxProps {
    name: NamePath;
    labelForm?: React.ReactNode;
    labelCheckbox?: React.ReactNode;
    formItemProps?: FormItemProps;
}

const BaseCheckbox = ({ name, labelForm, formItemProps, labelCheckbox, ...props }: BaseCheckboxProps) => {
    return (
        <BaseFormItem key={name} label={labelForm} name={name} valuePropName="checked" {...formItemProps}>
            <Checkbox {...props}>{labelCheckbox}</Checkbox>
        </BaseFormItem>
    );
};

export default BaseCheckbox;

import BaseFormItem from '@core/components/Form/BaseFormItem';
import { FormItemProps, Input, InputProps } from 'antd';
import { NamePath } from 'antd/es/form/interface';

export interface InputWithLabelProps extends InputProps {
    name: NamePath;
    label?: React.ReactNode;
    formItemProps?: FormItemProps;
}

const BaseInput = ({ name, label, formItemProps, ...props }: InputWithLabelProps) => {
    return (
        <BaseFormItem key={name} label={label} name={name} {...formItemProps}>
            <Input {...props} />
        </BaseFormItem>
    );
};

export default BaseInput;

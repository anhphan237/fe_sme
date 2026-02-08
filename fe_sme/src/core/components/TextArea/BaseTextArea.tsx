import BaseFormItem from '@core/components/Form/BaseFormItem';
import { FormItemProps, Input } from 'antd';
import { NamePath } from 'antd/es/form/interface';
import { TextAreaProps } from 'antd/es/input';

export interface BaseTextAreaProps extends TextAreaProps {
    name: NamePath;
    label?: React.ReactNode;
    formItemProps?: FormItemProps;
}

const BaseTextArea = ({ name, label, formItemProps, ...props }: BaseTextAreaProps) => {
    return (
        <BaseFormItem label={label} name={name} {...formItemProps}>
            <Input.TextArea rows={4} maxLength={200} {...props} />
        </BaseFormItem>
    );
};

export default BaseTextArea;

import { Form, FormItemProps } from 'antd';
import { isString } from 'lodash';

export interface BaseFormItemProps extends FormItemProps {}

const BaseFormItem: React.FC<BaseFormItemProps> = ({ className, ...props }) => {
    return (
        <Form.Item
            className={`!mb-0 ${className || ''}`}
            normalize={value => {
                if (isString(value)) {
                    return value.trimStart();
                }
                return value;
            }}
            {...props}
        />
    );
};

export default BaseFormItem;

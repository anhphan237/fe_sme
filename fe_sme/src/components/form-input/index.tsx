import Form from 'antd/es/form';
import Input, { InputProps } from 'antd/es/input';
import { useEffect, useState } from 'react';

type Props = Omit<InputProps, 'value' | 'onChange'> & {
    value: string | number;
    label: string;
    name: string;
    placeholder: string;
    errorMessage?: string;
    required?: boolean;
    onChange: (value: string) => void;
    inputClassName?: string;
    formClassName?: string;
};

const FormInput = (props: Props) => {
    const { label, name, placeholder, errorMessage, required, onChange, inputClassName = '', formClassName = '', value, onBlur, ...rest } = props;

    const [changed, setChanged] = useState<boolean>(false);

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
            validateStatus={errorMessage ? 'error' : 'success'}
            className={formClassName}
        >
            <Input
                placeholder={placeholder}
                onChange={e => {
                    setChanged(true);
                    onChange(e.target.value);
                }}
                value={value}
                defaultValue={value}
                {...rest}
                className={inputClassName}
                onBlur={onBlur}
            />
        </Form.Item>
    );
};

export default FormInput;

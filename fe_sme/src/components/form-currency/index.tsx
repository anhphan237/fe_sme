import Form from 'antd/es/form';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import CurrencyInput, { CurrencyInputProps } from 'react-currency-input-field';

type Props = Omit<CurrencyInputProps, 'value' | 'onChange'> & {
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

const FormCurrency = (props: Props) => {
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
            <CurrencyInput
                placeholder={placeholder}
                onValueChange={e => {
                    setChanged(true);
                    onChange(e as string);
                }}
                value={value}
                {...rest}
                intlConfig={{ locale: 'vi-VN', currency: 'VND' }}
                style={{
                    outline: 0,
                }}
                formatValueOnBlur={false}
                className={clsx('w-full border rounded pl-3 border-solid h-8', inputClassName, {
                    '!border-[#ff4d4f] focus-visible:!border-[#ff4d4f]': errorMessage,
                    'focus-visible:!border-[#4096ff]': !errorMessage,
                })}
                onBlur={onBlur}
            />
        </Form.Item>
    );
};

export default FormCurrency;

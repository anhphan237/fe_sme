import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import { useLocale } from '@/i18n';
import { Drawer, Form } from 'antd';
import { forwardRef, useImperativeHandle, useState } from 'react';

import DrawerFooter from '@/pages/sales/components/DrawerFooter';

import usePromiseHolder from '@/hooks/usePromiseHolder';

export interface WarehouseProductConfig {
    productNameView: string;
    weightActual: number;
    quantity: number;
}

interface Results {
    code: number;
    data?: Partial<WarehouseProductConfig>;
    message?: string;
}
export interface WarehouseProductProductConfigRef {
    open: (product: Partial<WarehouseProductConfig>) => Promise<Results>;
}
interface ProductConfigProps {}
const ProductConfig = (_: ProductConfigProps, ref: React.Ref<WarehouseProductProductConfigRef>) => {
    const { t } = useLocale();
    const [title, setTitle] = useState('');
    const [open, setOpen] = useState(false);
    const { resolve, reject, execute } = usePromiseHolder<Results>({});
    const [form] = Form.useForm<Partial<WarehouseProductConfig>>();
    const unit = Form.useWatch('unit', { form, preserve: true });

    const handleOpen = async (product: Partial<WarehouseProductConfig>) => {
        setTitle(product.productNameView || '');
        setOpen(true);
        form.setFieldsValue({ ...product });
        return execute();
    };

    useImperativeHandle(ref, () => ({
        open: handleOpen,
    }));

    const handleReset = () => {
        setTitle('');
        setOpen(false);
        form.resetFields();
    };

    const handleClose = () => {
        handleReset();
        reject({ code: -1, message: 'Closed' });
    };

    const handleSubmit = async () => {
        const formValues = form.getFieldsValue(true);
        resolve({ code: 200, data: formValues });
        handleReset();
    };

    return (
        <>
            <Drawer
                title={title}
                placement="right"
                open={open}
                onClose={handleClose}
                closable={false}
                maskClosable={false}
                width={550}
                styles={{
                    body: { padding: 8 },
                }}
                style={{ zIndex: 1200 }}
                footer={
                    <DrawerFooter
                        onOk={() => {
                            form.submit();
                        }}
                        onCancel={handleClose}
                    />
                }
            >
                <Form
                    form={form}
                    className="w-full flex flex-col bg-white gap-2 p-2 rounded-lg overflow-auto"
                    layout="vertical"
                    name="advanced_product_config"
                    onFinish={handleSubmit}
                >
                    <BaseInputNumber
                        name="weightActual"
                        label={t('sales.actual_weight')}
                        addonAfter="Kg"
                        min={0}
                        isMoneyFormat
                        placeholder={t('sales.actual_weight')}
                        formItemProps={{
                            required: true,
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            className: 'w-full',
                        }}
                    />
                    <BaseInputNumber
                        name="quantity"
                        label={t('sales.quantity')}
                        placeholder={t('sales.quantity')}
                        min={0}
                        isMoneyFormat
                        addonAfter={
                            unit ? (
                                <span className="inline-block max-w-10 truncate text-ellipsis" title={unit}>
                                    {unit}
                                </span>
                            ) : undefined
                        }
                        formItemProps={{
                            required: true,
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            className: 'w-full',
                        }}
                    />
                </Form>
            </Drawer>
        </>
    );
};

export default forwardRef(ProductConfig);

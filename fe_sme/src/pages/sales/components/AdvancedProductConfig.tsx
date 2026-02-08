import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseSelect from '@/core/components/Select/BaseSelect';
import { useLocale } from '@/i18n';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Divider, Drawer, Form, Popconfirm, Spin, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Table } from 'antd/lib';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';

import BaseButton from '@/components/button';

import usePromiseHolder from '@/hooks/usePromiseHolder';

import { formatNumber, uuidV4 } from '@/utils/helpers';

import { QUOTATION_CALCULATION_TYPE, QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

import { ProductDetail } from '@/interface/sales';

import './AdvancedProductConfig.less';
import DrawerFooter from './DrawerFooter';

const { Text } = Typography;

const FooterTitle = ({ totalQuantity, unit }: { totalQuantity?: number; unit: string }) => {
    return (
        <div className="mb-2">
            <div className="flex items-center justify-between ">
                <Text className="text-lg font-semibold">Tổng số lượng:</Text>
                <Text className="text-lg font-semibold text-colorPrimary">
                    {formatNumber(totalQuantity)} {unit}
                </Text>
            </div>
        </div>
    );
};

interface Results {
    code: number;
    data?: Partial<ProductDetail>;
    message?: string;
}
export interface AdvancedProductConfigRef {
    open: (product: Partial<ProductDetail>) => Promise<Results>;
}
interface AdvancedProductConfigProps {}
const AdvancedProductConfig = (_: AdvancedProductConfigProps, ref: React.Ref<AdvancedProductConfigRef>) => {
    const { t } = useLocale();
    const [title, setTitle] = useState('');
    const [open, setOpen] = useState(false);
    const { resolve, reject, execute } = usePromiseHolder<Results>({});
    const [form] = Form.useForm<
        Partial<
            ProductDetail & {
                unitCode: string;
                unitName: number;
                items: any[];
            }
        >
    >();
    const [isCalculating, setIsCalculating] = useState(false);

    const rootQuotationForm = Form.useFormInstance();
    const quotationStatus = Form.useWatch('status', { form: rootQuotationForm, preserve: true });
    const isDisabledQuotationForm = quotationStatus === QUOTATION_TARGET_STATUS.APPROVED;

    const watchedValues = Form.useWatch([], { form, preserve: true });
    const { unitCode, items } = watchedValues ?? {};

    const total = useMemo(() => {
        if (Array.isArray(items) && items.length > 0)
            return items?.reduce((sum, item) => {
                return sum + (item.length || 1) * (item.width || 1) * (item.multiplier || 1);
            }, 0);
    }, [items]);

    const handleOpen = async (product: Partial<ProductDetail>) => {
        setTitle(product.productNameView || '');
        setOpen(true);
        form.setFieldsValue({ ...product, supplierCalculateBy: product?.supplierCalculateBy ?? QUOTATION_CALCULATION_TYPE.BY_ITEM });
        return execute();
    };

    useImperativeHandle(ref, () => ({
        open: handleOpen,
    }));

    const handleReset = () => {
        setTitle('');
        setOpen(false);
        form.resetFields();
        setIsCalculating(false);
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
                        title={<FooterTitle totalQuantity={total || 0} unit={unitCode || 'm2'} />}
                        onOk={() => {
                            form.submit();
                        }}
                        applyBtnProps={{ disabled: isCalculating || isDisabledQuotationForm }}
                        cancelBtnProps={{ disabled: false }}
                        onCancel={handleClose}
                    />
                }
            >
                <Spin spinning={isCalculating}>
                    <Divider plain>Gợi ý bán</Divider>
                    <Form
                        form={form}
                        className="w-full flex flex-col bg-white gap-2 p-2 rounded-lg overflow-auto"
                        layout="vertical"
                        name="advanced_product_config"
                        onFinish={handleSubmit}
                        initialValues={{
                            items: [{ id: uuidV4() }],
                            unitName: 1,
                            unitCode: 'm2',
                        }}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <BaseSelect
                                name="unitName"
                                formItemProps={{
                                    className: 'flex-1',
                                }}
                                label="Quy cách"
                                options={[
                                    {
                                        value: 1,
                                        label: 'Tấm/miếng (nhựa, nhôm)',
                                    },
                                ]}
                            />
                            <BaseSelect
                                name="unitCode"
                                label="Tuỳ chọn hiển thị"
                                options={[
                                    {
                                        value: 'm2',
                                        label: 'm2',
                                    },
                                ]}
                            />
                        </div>
                        <Form.List name="items">
                            {(fields, { add, remove }) => {
                                const columns: ColumnsType = [
                                    {
                                        title: <span>{'Rộng'}</span>,
                                        dataIndex: 'width',
                                        width: 140,
                                        render: (_: any, __: any, index: number) => (
                                            <BaseInputNumber
                                                {...fields[index]}
                                                onPressEnter={() => add({ id: uuidV4() })}
                                                name={[fields[index].name, 'width']}
                                                label=""
                                                min={0}
                                                max={1000000000}
                                                isNumberFormat
                                                placeholder={'Rộng'}
                                                formItemProps={{
                                                    required: true,
                                                    rules: [{ required: true, message: t('global.message.required_field') }],
                                                    className: 'w-full',
                                                }}
                                            />
                                        ),
                                    },
                                    {
                                        title: <span>{'Dài'}</span>,
                                        dataIndex: 'length',
                                        width: 140,
                                        render: (_: any, __: any, index: number) => (
                                            <BaseInputNumber
                                                {...fields[index]}
                                                onPressEnter={() => add({ id: uuidV4() })}
                                                name={[fields[index].name, 'length']}
                                                label=""
                                                min={0}
                                                max={1000000000}
                                                placeholder={'Dài'}
                                                isNumberFormat
                                                formItemProps={{
                                                    required: true,
                                                    rules: [{ required: true, message: t('global.message.required_field') }],
                                                    className: 'w-full',
                                                }}
                                            />
                                        ),
                                    },
                                    {
                                        title: <span>{'SL/Hệ số'}</span>,
                                        dataIndex: 'multiplier',
                                        width: 140,
                                        render: (_: any, __: any, index: number) => (
                                            <BaseInputNumber
                                                {...fields[index]}
                                                onPressEnter={() => add({ id: uuidV4() })}
                                                name={[fields[index].name, 'multiplier']}
                                                label=""
                                                min={0}
                                                max={1000000000}
                                                placeholder={'SL/Hệ số'}
                                                isNumberFormat
                                                formItemProps={{
                                                    required: true,
                                                    rules: [{ required: true, message: t('global.message.required_field') }],
                                                    className: 'w-full',
                                                }}
                                            />
                                        ),
                                    },
                                    {
                                        dataIndex: 'actions',
                                        width: 80,
                                        align: 'center',
                                        className: 'text-center',
                                        render: (_: any, __: any, index: number) =>
                                            fields.length > 1 ? (
                                                <Popconfirm
                                                    title={t('global.popup.confirm_delete')}
                                                    onConfirm={() => remove(fields[index].name)}
                                                    okText={t('global.popup.ok')}
                                                    cancelText={t('global.popup.reject')}
                                                    placement="left"
                                                >
                                                    <div className="cursor-pointer text-red-600 flex gap-1">
                                                        <DeleteOutlined />
                                                    </div>
                                                </Popconfirm>
                                            ) : // <DeleteOutlined className="text-red-500 cursor-pointer" onClick={() => remove(fields[index].name)} />
                                            null,
                                    },
                                ];
                                return (
                                    <div className="space-y-4 my-4">
                                        <div className="col-span-6 font-bold flex justify-center items-center gap-2">
                                            <div className="h-[1px] w-full bg-gray-400 mt-1" />
                                            <BaseButton
                                                icon={<PlusOutlined />}
                                                label={'Thêm dòng'}
                                                type="primary"
                                                onClick={() => add({ id: uuidV4() })}
                                            />
                                        </div>
                                        <Table
                                            key="caculateData"
                                            bordered
                                            scroll={{ x: 'max-content', y: '60vh' }}
                                            columns={columns}
                                            dataSource={fields}
                                            pagination={false}
                                            rowKey="id"
                                        />
                                    </div>
                                );
                            }}
                        </Form.List>
                    </Form>
                </Spin>
            </Drawer>
        </>
    );
};

export default forwardRef(AdvancedProductConfig);

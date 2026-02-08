import { apiSearchSupplierInfo } from '@/api/supplier.api';
import BaseDatePicker from '@/core/components/DatePicker';
import DividerLabel from '@/core/components/Divider/DividerLabel';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Form, Input, Row, Space } from 'antd';
import { useState } from 'react';

import { SelectHelper, convertedDateProps } from '@/utils/helpers';

import QuickAddSupplier from './QuickAddSupplier';

const Information = () => {
    const { t } = useLocale();
    const form = Form.useFormInstance();
    const [open, setOpen] = useState(false);
    const supplier = Form.useWatch(['supplier'], { form, preserve: true });
    const getDataOneItem = (data: any[]) => {
        if (data.length === 1) return data[0];
        return null;
    };
    const isCreateMode = !form.getFieldValue('id');

    const handleChangeSupplier = (_: string, op: any) => {
        if (!op) return;
        form.setFieldsValue({
            supplier: {
                supplierTaxCode: op?.taxCode,
                supplierAddress: op?.address,
                supplierCode: op?.code,
                supplierName: op?.name,
                supplierPhone: op?.phone,
                supplierContactPerson: getDataOneItem(op?.supplierContactPersons)?.name,
                supplierContactPersonPhone: getDataOneItem(op?.supplierContactPersons)?.phone,
                supplierBankAccountNumber: getDataOneItem(op?.supplierBankAccounts)?.bankAccountNumber,
                supplierBankName: getDataOneItem(op?.supplierBankAccounts)?.bankName,
                supplierShortName: op?.nameShort,
                _original: op,
            },
        });
    };

    const handleChangeSupplierContractPerson = (_: string, op: { id: string; label: string; value: string }) => {
        if (!op) return;
        const supplierContactPerson = supplier?._original?.supplierContactPersons?.find((item: { id: string }) => item.id === op?.id);
        form.setFieldValue(['supplier', 'supplierContactPersonPhone'], supplierContactPerson?.phone);
    };

    return (
        <>
            <Row gutter={[16, 16]} className="mb-6" justify="start">
                <Col span={6}>
                    <BaseInput
                        label={t('purchase_order.code')}
                        placeholder={t('purchase_order.code')}
                        name="invoice"
                        disabled
                        formItemProps={{
                            labelAlign: 'left',
                        }}
                    />
                </Col>
                <Col span={6}>
                    <BaseDatePicker
                        label={t('sales.purchase_date')}
                        placeholder={t('sales.purchase_date')}
                        name="invoiceDate"
                        className="w-full"
                        format="DD-MM-YYYY HH:mm"
                        showTime
                        formItemProps={{
                            ...convertedDateProps,
                            rules: [{ required: true, message: t('global.message.required_field') }],
                        }}
                    />
                </Col>
                {/* <Col span={isCreateMode ? 6 : 4}>
                    <BaseSelect
                        label={t('global.status')}
                        placeholder={t('global.status')}
                        name="status"
                        options={[
                            { value: 0, label: 'Nháp' },
                            { value: 5, label: 'Hoàn thành' },
                            { value: 2, label: 'Hủy' },
                        ]}
                        formItemProps={{
                            labelAlign: 'left',
                            rules: [{ required: true, message: t('global.message.required_field') }],
                        }}
                    />
                </Col> */}
                <Col span={6}>
                    <BaseTextArea
                        label={t('product.add_edit.description')}
                        rows={1}
                        placeholder={t('product.add_edit.description')}
                        name="description"
                    />
                </Col>
                {!isCreateMode && (
                    <Col span={6}>
                        <BaseInput
                            label={t('global.created_by')}
                            placeholder={t('global.created_by')}
                            name="createdByName"
                            disabled
                            formItemProps={{
                                labelAlign: 'left',
                            }}
                        />
                    </Col>
                )}
                <DividerLabel label={t('sales.supplier_info')} />
                <Col span={6}>
                    <InfiniteScrollSelect
                        name={['supplier', 'supplierId']}
                        queryKey={['getSuppliers']}
                        label={t('sales.supplier')}
                        placeholder={t('sales.supplier')}
                        formItemProps={{
                            rules: [{ required: true, message: t('sales.supplier.required') }],
                            required: true,
                            labelAlign: 'left',
                        }}
                        showSearch
                        labelRender={item =>
                            SelectHelper.labelRender(item, supplier, ['supplierShortName', 'supplierId']) ||
                            SelectHelper.labelRender(item, supplier, ['supplierName', 'supplierId'])
                        }
                        onChange={handleChangeSupplier as any}
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const res = await apiSearchSupplierInfo({ pageNumber, pageSize, search }, { loading: false });
                            return res.data;
                        }}
                        dropdownRender={menu => (
                            <>
                                {menu}
                                <Divider style={{ margin: '8px 0' }} />
                                <Space style={{ padding: '0 8px 4px' }}>
                                    <Button type="link" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
                                        {t('global.tips.create')}
                                    </Button>
                                </Space>
                            </>
                        )}
                        mapData={(data: any[]) =>
                            data.map((item: any) => ({
                                ...item,
                                label: item.nameShort ?? item.name ?? '',
                                value: item.id,
                            }))
                        }
                    />
                </Col>
                <Col span={6}>
                    <BaseInput
                        label={t('sales.address')}
                        placeholder={t('sales.address')}
                        name={['supplier', 'supplierAddress']}
                        formItemProps={{
                            labelAlign: 'left',
                        }}
                    />
                </Col>
                <Col span={6}>
                    <BaseSelect
                        label={t('customer.contact_person')}
                        placeholder={t('customer.contact_person')}
                        name={['supplier', 'supplierContactPerson']}
                        options={supplier?._original?.supplierContactPersons?.map((item: { name: string; id: string }) => ({
                            id: item?.id,
                            value: item?.name,
                            label: item?.name,
                        }))}
                        onChange={handleChangeSupplierContractPerson as any}
                        formItemProps={{
                            className: 'w-full',
                        }}
                    />
                </Col>
                <Col span={6}>
                    <label htmlFor="supplierPhone" className="inline-block mb-2">
                        {t('customer.phone')}
                    </label>
                    <Input
                        id="supplierPhone"
                        placeholder={t('customer.phone')}
                        value={supplier?.supplierContactPersonPhone ?? supplier?.supplierPhone}
                        disabled
                    />
                </Col>
            </Row>
            <QuickAddSupplier open={open} onClose={() => setOpen(false)} />
        </>
    );
};

export default Information;

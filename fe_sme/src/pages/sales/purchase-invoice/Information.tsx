import { apiSearchCustomerInfo } from '@/api/customer.api';
import { AppRouters } from '@/constants';
import BaseDatePicker from '@/core/components/DatePicker';
import DividerLabel from '@/core/components/Divider/DividerLabel';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { Col, Form, Input, Row } from 'antd';
import { useNavigate } from 'react-router-dom';

import { SelectHelper, convertedDateProps } from '@/utils/helpers';

import { UserCustomer } from '@/interface/sales';

const Information = () => {
    const { t } = useLocale();
    const form = Form.useFormInstance();
    const supplier = Form.useWatch(['supplier'], { form, preserve: true });
    const purchaseCode = Form.useWatch('purchaseCode', { form, preserve: true });
    const purchaseId = Form.useWatch('purchaseId', { form, preserve: true });
    const getDataOneItem = (data: any[]) => {
        if (data.length === 1) return data[0];
        return null;
    };

    const navigate = useNavigate();

    const handleChangeSupplier = (_: string, op: UserCustomer) => {
        if (!op) return;
        form.setFieldsValue({
            supplier: {
                supplierTaxCode: op?.taxCode,
                supplierAddress: op?.address,
                supplierCode: op?.code,
                supplierName: op?.name,
                supplierPhone: op?.phone,
                supplierContactPerson: getDataOneItem(op?.customerContactPersons)?.name || undefined,
                supplierContactPersonPhone: getDataOneItem(op?.customerContactPersons)?.phone || undefined,
                supplierBankAccountNumber: getDataOneItem(op?.customerBankAccounts)?.bankAccountNumber,
                supplierBankName: getDataOneItem(op?.customerBankAccounts)?.bankName,
                supplierShortName: op?.nameShort,
                _original: op,
            },
        });
    };

    const handleChangeSupplierContactPerson = (_: string, op: { id: string; label: string; value: string }) => {
        if (!op) return;
        const supplierContactPerson = supplier?._original?.customerContactPersons?.find((item: { id: string }) => item.id === op?.id);
        form.setFieldValue(['supplier', 'supplierContactPersonPhone'], supplierContactPerson?.phone);
    };

    return (
        <>
            <Row gutter={[16, 16]} className="mb-6" justify="start">
                <Col span={24}>
                    <span className="text-lg">
                        <span className="font-medium">{t('purchase_invoice.purchase_order_code')}:</span>{' '}
                        <strong
                            className="text-colorPrimary cursor-pointer"
                            onClick={() => {
                                navigate(
                                    purchaseCode?.startsWith('DHT')
                                        ? `${AppRouters.REFUND}/${purchaseId}`
                                        : `${AppRouters.PURCHASE_ORDERS}/${purchaseId}`,
                                );
                            }}
                        >
                            {purchaseCode}
                        </strong>
                    </span>
                </Col>
                <Col span={6}>
                    <BaseInput
                        label={t('purchase_invoice.code')}
                        placeholder={t('purchase_invoice.code')}
                        name="code"
                        disabled
                        formItemProps={{
                            labelAlign: 'left',
                        }}
                    />
                </Col>
                <Col span={6}>
                    <BaseDatePicker
                        label={t('purchase_invoice.purchase_date')}
                        placeholder={t('purchase_invoice.purchase_date')}
                        name="purchaseDate"
                        className="w-full"
                        format="DD-MM-YYYY HH:mm"
                        showTime
                        formItemProps={{
                            ...convertedDateProps,
                            rules: [{ required: true, message: t('global.message.required_field') }],
                        }}
                    />
                </Col>
                <Col span={6}>
                    <BaseTextArea
                        label={t('product.add_edit.description')}
                        rows={1}
                        placeholder={t('product.add_edit.description')}
                        name="description"
                    />
                </Col>
                <DividerLabel label={t('purchase_invoice.supplier')} />
                <Col span={6}>
                    <InfiniteScrollSelect
                        name={['supplier', 'supplierId']}
                        queryKey={['getSuppliers']}
                        label={t('purchase_invoice.supplier')}
                        placeholder={t('purchase_invoice.supplier')}
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
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
                            const res = await apiSearchCustomerInfo({ pageNumber, pageSize, search }, { loading: false });
                            return res.data;
                        }}
                        mapData={(data: UserCustomer[]) =>
                            data.map((item: UserCustomer) => ({
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
                        disabled
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
                        options={supplier?._original?.customerContactPersons?.map((item: { name: string; id: string }) => ({
                            id: item?.id,
                            value: item?.name,
                            label: item?.name,
                        }))}
                        onChange={handleChangeSupplierContactPerson as any}
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
        </>
    );
};

export default Information;

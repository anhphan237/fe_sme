import { apiSearchPurchaseInvoice } from '@/api/purchase-invoice.api';
import BaseDatePicker from '@/core/components/DatePicker';
import DividerLabel from '@/core/components/Divider/DividerLabel';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseSelect from '@/core/components/Select/BaseSelect';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { Col, Form, Input, Row } from 'antd';
import moment from 'moment';

import { convertTimeToInput, getMinMaxDateDisabledTime } from '@/utils/format-datetime';
import { SelectHelper, convertedDateProps } from '@/utils/helpers';

const Information = () => {
    const { t } = useLocale();
    const form = Form.useFormInstance();
    const supplier = Form.useWatch(['supplier'], { form, preserve: true });
    const purchaseInvoiceDate = Form.useWatch('purchaseInvoiceDate', { form, preserve: true });

    return (
        <>
            <Row gutter={[16, 16]} className="mb-6" justify="start">
                <Col span={4}>
                    <InfiniteScrollSelect
                        label={t('purchase_invoice.refund')}
                        placeholder={t('purchase_invoice.refund')}
                        queryKey={['getListPurchaseInvoiceFromRefund']}
                        onChange={(_, record) => form.setFieldsValue({ ...record, purchaseReturnDate: moment.utc().local() })}
                        name="purchaseInvoiceId"
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            labelAlign: 'left',
                        }}
                        showSearch
                        labelRender={item => item.label ?? form.getFieldValue('purchaseInvoiceCode')}
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchPurchaseInvoice({ pageNumber, pageSize, search, isOrderReturn: false }, { loading: false });
                            return resp.data;
                        }}
                        mapData={(data: any[]) =>
                            data.map(item => ({
                                ...item,
                                key: item.id,
                                value: item.id,
                                label: item.code,
                                status: 0,
                                purchaseInvoiceCode: item.code,
                                purchaseInvoiceDate: item.purchaseDate,
                            }))
                        }
                    />
                </Col>

                <Col span={4}>
                    <BaseDatePicker
                        label={t('purchase_refund.return_shipping_date')}
                        placeholder={t('purchase_refund.return_shipping_date')}
                        name="purchaseReturnDate"
                        className="w-full"
                        format="DD-MM-YYYY HH:mm"
                        allowClear={false}
                        showTime={{
                            disabledTime: getMinMaxDateDisabledTime(convertTimeToInput(purchaseInvoiceDate)) as any,
                        }}
                        minDate={(convertTimeToInput(purchaseInvoiceDate) || undefined) as any}
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            required: true,
                            ...convertedDateProps,
                        }}
                    />
                </Col>

                <Col span={7}>
                    <BaseTextArea
                        label={t('purchase_refund.return_reason')}
                        rows={1}
                        placeholder={t('purchase_refund.return_reason')}
                        name="reasonReturn"
                    />
                </Col>
                <DividerLabel label={t('purchase_invoice.order_info')} />
                <Col span={4}>
                    <BaseDatePicker
                        label={t('purchase_refund.purchase_date')}
                        placeholder={t('purchase_refund.purchase_date')}
                        name="purchaseInvoiceDate"
                        className="w-full"
                        format="DD-MM-YYYY HH:mm"
                        disabled
                        showTime
                        formItemProps={{
                            ...convertedDateProps,
                        }}
                    />
                </Col>
                <Col span={7}>
                    <BaseTextArea
                        label={t('product.add_edit.description')}
                        rows={1}
                        disabled
                        placeholder={t('product.add_edit.description')}
                        name="description"
                    />
                </Col>
                <DividerLabel label={t('purchase_refund.supplier_info')} />
                <Col span={6}>
                    <BaseSelect
                        name={['supplier', 'supplierId']}
                        label={t('purchase_refund.supplier')}
                        placeholder={t('purchase_refund.supplier')}
                        disabled
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
                    />
                </Col>
                <Col span={6}>
                    <BaseInput
                        label={t('customer.tax_code')}
                        placeholder={t('customer.tax_code')}
                        name={['supplier', 'supplierTaxCode']}
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
                        disabled
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

import { apiSearchInvoice } from '@/api/contract.api';
import BaseDatePicker from '@/core/components/DatePicker';
import DividerLabel from '@/core/components/Divider/DividerLabel';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
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
    const customer = Form.useWatch(['customer'], { form, preserve: true });
    const invoiceDate = Form.useWatch('invoiceDate', { form, preserve: true });
    return (
        <>
            <Row gutter={[16, 16]} className="mb-6" justify="start">
                <Col span={6}>
                    <InfiniteScrollSelect
                        label={t('Invoice')}
                        placeholder={t('Invoice')}
                        queryKey={['getListInvoiceFromRefund']}
                        onChange={(_, record: any) =>
                            form.setFieldsValue({
                                ...record,
                                orderReturnDate: moment.utc().local(),
                                status: 0,
                            })
                        }
                        name="invoiceId"
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            labelAlign: 'left',
                        }}
                        showSearch
                        labelRender={item => item.label ?? form.getFieldValue('invoiceCode')}
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchInvoice({ pageNumber, pageSize, search, isPurchaseReturn: false }, { loading: false });
                            return resp.data;
                        }}
                        mapData={(data: any[]) =>
                            data.map(item => ({
                                ...item,
                                key: item.id,
                                value: item.id,
                                label: item.code,
                                status: 0,
                                invoiceCode: item.code,
                            }))
                        }
                    />
                </Col>
                {/* <Col span={6}>
                    <BaseInputNumber
                        label={t('sales.total_refund')}
                        placeholder={t('sales.total_refund')}
                        name="totalRefund"
                        isMoneyFormat
                        formItemProps={{
                            rules: [{ required: true, message: t('sales.customer.required') }],
                            labelAlign: 'left',
                        }}
                    />
                </Col> */}

                <Col span={6}>
                    <BaseDatePicker
                        name="orderReturnDate"
                        label={t('sales.return_date')}
                        className="w-full"
                        format="DD-MM-YYYY HH:mm"
                        allowClear={false}
                        showTime={{
                            disabledTime: getMinMaxDateDisabledTime(convertTimeToInput(invoiceDate)) as any,
                        }}
                        minDate={(convertTimeToInput(invoiceDate) || undefined) as any}
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            required: true,
                            ...convertedDateProps,
                        }}
                    />
                </Col>

                {/* <Col span={6}>
                    <BaseSelect
                        label={t('logistics.enter_warehouse.exporter')}
                        placeholder={t('logistics.enter_warehouse.exporter')}
                        name={['personInCharge', 'userId']}
                        disabled
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            required: true,
                            labelAlign: 'left',
                        }}
                        showSearch
                        labelRender={item => item.label ?? form.getFieldValue(['personInCharge', 'userName'])}
                    />
                </Col> */}

                <Col span={7}>
                    <BaseTextArea label={t('sales.return_reason')} rows={1} placeholder={t('sales.return_reason')} name="reasonReturn" />
                </Col>
                <DividerLabel label={t('purchase_invoice.order_info')} />
                <Col span={6}>
                    <BaseDatePicker
                        label={t('sales.order_date')}
                        placeholder={t('sales.order_date')}
                        name="invoiceDate"
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
                <DividerLabel label={t('sales.customer_info')} />
                <Col span={6}>
                    <BaseSelect
                        name={['customer', 'customerId']}
                        label={t('sales.customer')}
                        placeholder={t('sales.customer')}
                        disabled
                        formItemProps={{
                            rules: [{ required: true, message: t('sales.customer.required') }],
                            required: true,
                            labelAlign: 'left',
                        }}
                        showSearch
                        labelRender={item =>
                            SelectHelper.labelRender(item, customer, ['customerShortName', 'customerId']) ||
                            SelectHelper.labelRender(item, customer, ['customerName', 'customerId'])
                        }
                    />
                </Col>
                <Col span={6}>
                    <BaseInput
                        label={t('customer.tax_code')}
                        placeholder={t('customer.tax_code')}
                        name={['customer', 'customerTaxCode']}
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
                        name={['customer', 'customerContactPerson']}
                        options={customer?._original?.customerContactPersons?.map((item: { name: string; id: string }) => ({
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
                    <label htmlFor="customerPhone" className="inline-block mb-2">
                        {t('customer.phone')}
                    </label>
                    <Input
                        id="customerPhone"
                        placeholder={t('customer.phone')}
                        value={customer?.customerContactPersonPhone ?? customer?.customerPhone}
                        disabled
                    />
                </Col>
                <DividerLabel label={t('sales.order_fee_info')} />
                <Col span={5} className="relative">
                    <BaseInputNumber
                        label={t('sales.shipping_fee')}
                        placeholder={t('sales.shipping_fee')}
                        name="deliveryFee"
                        isMoneyFormat
                        disabled
                        formItemProps={{
                            wrapperCol: { span: 24 },
                        }}
                    />
                </Col>
                <Col span={5}>
                    <BaseInputNumber
                        label={t('sales.discount')}
                        placeholder={t('sales.discount')}
                        name="discountAmount"
                        isMoneyFormat
                        disabled
                        formItemProps={{
                            wrapperCol: { span: 24 },
                        }}
                    />
                </Col>
                {/* </>
                )} */}

                <Col span={5}>
                    <BaseInputNumber
                        label={t('sales.old_debt')}
                        placeholder={t('sales.old_debt')}
                        name="previousDebt"
                        min={0}
                        isMoneyFormat
                        disabled
                        formItemProps={{
                            wrapperCol: { span: 24 },
                        }}
                    />
                </Col>
            </Row>
        </>
    );
};

export default Information;

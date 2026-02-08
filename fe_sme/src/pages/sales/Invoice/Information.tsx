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
    const customer = Form.useWatch(['customer'], { form, preserve: true });
    const orderCode = Form.useWatch('orderCode', { form, preserve: true });
    const orderId = Form.useWatch('orderId', { form, preserve: true });
    const getDataOneItem = (data: any[]) => {
        if (data.length === 1) return data[0];
        return null;
    };

    const navigate = useNavigate();

    const handleChangeCustomer = (_: string, op: UserCustomer) => {
        if (!op) return;
        form.setFieldsValue({
            customer: {
                customerTaxCode: op?.taxCode,
                customerAddress: op?.address,
                customerCode: op?.code,
                customerName: op?.name,
                customerPhone: op?.phone,
                customerContactPerson: getDataOneItem(op?.customerContactPersons)?.name,
                customerContactPersonPhone: getDataOneItem(op?.customerContactPersons)?.phone,
                customerBankAccountNumber: getDataOneItem(op?.customerBankAccounts)?.bankAccountNumber,
                customerBankName: getDataOneItem(op?.customerBankAccounts)?.bankName,
                customerShortName: op?.nameShort,
                _original: op,
            },
        });
    };

    const handleChangeCustomerContractPerson = (_: string, op: { id: string; label: string; value: string }) => {
        if (!op) return;
        const customerContactPerson = customer?._original?.customerContactPersons?.find((item: { id: string }) => item.id === op?.id);
        form.setFieldValue(['customer', 'customerContactPersonPhone'], customerContactPerson?.phone);
    };

    return (
        <>
            <Row gutter={[16, 16]} className="mb-6" justify="start">
                <Col span={24}>
                    <span className="text-lg">
                        <span className="font-medium">{t('sale.order_code')}:</span>{' '}
                        <strong
                            className="text-colorPrimary cursor-pointer"
                            onClick={() => {
                                navigate(
                                    orderCode?.startsWith('DHH')
                                        ? `${AppRouters.PURCHASE_REFUND}/${orderId}`
                                        : `${AppRouters.SALES_ORDER}/${orderId}`,
                                );
                            }}
                        >
                            {orderCode}
                        </strong>
                    </span>
                </Col>
                <Col span={6}>
                    <BaseInput
                        label={t('sales.invoice_number')}
                        placeholder={t('sales.invoice_number')}
                        name="code"
                        disabled
                        formItemProps={{
                            labelAlign: 'left',
                        }}
                    />
                </Col>
                <Col span={6}>
                    <BaseDatePicker
                        label={t('sales.order_date')}
                        placeholder={t('sales.order_date')}
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
                {/* <Col span={6}>
                    <InfiniteScrollSelect
                        label={t('logistics.enter_warehouse.exporter')}
                        placeholder={t('logistics.enter_warehouse.exporter')}
                        queryKey={['getListUsersFromEnter']}
                        onChange={handleChangeUser}
                        name={['personInCharge', 'userId']}
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            required: true,
                            labelAlign: 'left',
                        }}
                        showSearch
                        labelRender={item => SelectHelper.labelRender(item, personInCharge, ['userName', 'userId'])}
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchUsers(pageNumber, pageSize, search, { loading: false });
                            return resp.data;
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
                <DividerLabel label={t('sales.customer_info')} />
                <Col span={6}>
                    <InfiniteScrollSelect
                        name={['customer', 'customerId']}
                        queryKey={['getCustomers']}
                        label={t('sales.customer')}
                        placeholder={t('sales.customer')}
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
                        onChange={handleChangeCustomer as any}
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
                        name={['customer', 'customerAddress']}
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
                        onChange={handleChangeCustomerContractPerson as any}
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
            </Row>
        </>
    );
};

export default Information;

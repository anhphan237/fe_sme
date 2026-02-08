import { apiAddInvoice, apiGetDetailInvoice, apiUpdateInvoice } from '@/api/contract.api';
import { apiGetDetailCustomerInfo } from '@/api/customer.api';
import { AppRouters } from '@/constants';
import InvoiceTag from '@/core/components/Status/InvoiceTag';
import { useLocale } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/stores';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Form, Spin } from 'antd';
import { get } from 'lodash';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Documents, { AttachmentRef } from '@/pages/sales/Order/add-or-edit/Documents';
import DebtPaymentSteps from '@/pages/sales/components/DebtPaymentSteps';
import QuickRefund from '@/pages/sales/components/QuickRefund';
import RightControl from '@/pages/sales/components/RightControl';

import BaseFloatButton from '@/components/button/BaseFloatButton';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import { IAddEditInvoice } from '@/interface/contract';

import AddOrEditFooter from './Footer';
import Information from './Information';
import Products from './Products';

const AddOrEdit = () => {
    const [form] = Form.useForm<IAddEditInvoice>();
    const { t } = useLocale();
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const attachmentRef = useRef<AttachmentRef>(null);
    const quickRefundRef = useRef<any>(null);

    const isEdit = !!id && id !== 'add';
    const dispatch = useAppDispatch();
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const watchedFormValues = Form.useWatch<IAddEditInvoice>([], { form, preserve: true });
    const attachments = Form.useWatch('attachments', { form, preserve: true }) || [];
    const customer = Form.useWatch(['customer'], { form, preserve: true });

    const generateAttachmentPath = () => {
        if (isEdit) {
            const attachments = get(watchedFormValues, 'attachments', []);
            const firstPath = attachments?.[0]?.path?.split('/')?.slice(-1)?.join('/');
            if (firstPath) {
                return `${AppRouters.INVOICE}/Attachments/${firstPath}`;
            } else {
                return `${AppRouters.INVOICE}/Attachments/${new Date().getTime()}`;
            }
        }
        return `${AppRouters.INVOICE}/Attachments/${new Date().getTime()}`;
    };

    const {
        data: invoiceDetail,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['getDetailInvoice', id],
        queryFn: async () => {
            const res = await apiGetDetailInvoice(id || '', { loading: false });
            if (id) {
                dispatch(
                    setBreadCrumbs({
                        [id]: `${t('sales.invoice.edit')}`,
                    }),
                );
            }
            if (res?.data) {
                const clonedData = { ...res?.data };
                if (clonedData?.customer?.customerId) {
                    const customerDetailResponse = await apiGetDetailCustomerInfo(clonedData.customer.customerId, { loading: false });
                    clonedData.customer._original = customerDetailResponse?.data ?? {};
                }
                form.setFieldsValue({
                    ...clonedData,
                    details: clonedData?.details
                        ?.sort((a: any, b: any) => a?.number - b?.number)
                        ?.map((item: any) => ({
                            ...item,
                            _attachmentPath: generateAttachmentPath(),
                            _outputConvert: item?.weightTheoretical / item?.quantity,
                        })),
                });
            }
            return res?.data;
        },
        throwOnError: () => {
            notify.error('message.failed');
            return false;
        },
        enabled: isEdit,
    });

    // const { data: debtTransactions, refetch: refetchDebtTransactions } = useQuery({
    //     queryKey: ['getDebtTransactions', invoiceDetail?.debtDocumentId],
    //     queryFn: async () => {
    //         const res = await apiSearchDebtTransactions(
    //             {
    //                 debtDocumentId: invoiceDetail?.debtDocumentId,
    //                 pageSize: 10,
    //                 pageNumber: 1,
    //             },
    //             { loading: false },
    //         );
    //         return res?.data || [];
    //     },
    //     enabled: isEdit && !!invoiceDetail?.debtDocumentId,
    // });

    const handleAddEdit = async () => {
        const data: IAddEditInvoice = form.getFieldsValue(true);
        const params = {
            ...(isEdit && { id: invoiceDetail?.id }),
            ...data,
            attachments:
                attachments?.map((item: any) => {
                    const { id, uid, lastModifiedDate, originFileObj, status, ...rest } = item;
                    return rest;
                }) ?? [],
            details: (data?.details ?? []).map((item: any, index: number) => {
                return {
                    ...item,
                    number: index + 1,
                };
            }),
        };
        delete params?.customer?.currentCustomer;
        const res = isEdit ? await apiUpdateInvoice(params) : await apiAddInvoice(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            if (data?.isSaveAdd) {
                form.resetFields();
            } else {
                navigate(AppRouters.INVOICE);
            }
        } else notify.error(t('message.failed'));
    };

    const handleOpenDocuments = async () => {
        try {
            const response = await attachmentRef.current?.open(form.getFieldValue('attachments') || []);
            if (response?.code === 200) {
                form.setFieldValue('attachments', response.data);
            }
        } catch (error: any) {
            if (error?.code === -1) return;
            notify.error(error?.message || t('global.message.error_occurs'));
        }
    };

    const handleQuickRefund = async () => {
        try {
            await quickRefundRef?.current?.open({
                invoiceId: invoiceDetail?.id,
                debtDocumentId: invoiceDetail?.debtDocumentId,
                invoiceDate: form.getFieldValue('invoiceDate'),
                totalAmount: invoiceDetail?.totalAmount,
                code: invoiceDetail?.code,
                customerName: customer?.customerName,
                customerId: customer?.customerId,
                customerCode: customer?.customerCode,
                customerShortName: (customer as any)?._original?.nameShort || '',
                customerTaxCode: customer?.customerTaxCode || '',
                customerContactPerson: customer?.customerContactPerson || '',
                customerContactPersonPhone: customer?.customerContactPersonPhone || '',
                address: customer?.customerAddress,
                phone: customer?.customerPhone,
                customerBankAccountName: customer?.customerBankAccountName || '',
                customerBankAccountNumber: customer?.customerBankAccountNumber || '',
                customerBankName: customer?.customerBankName || '',
                customerBankBranch: customer?.customerBankBranch || '',
                details: form.getFieldValue('details'),
                discountAmount: invoiceDetail?.discountAmount || 0,
                deliveryFee: invoiceDetail?.deliveryFee || 0,
                previousDebt: invoiceDetail?.previousDebt || 0,
                advancedAmount: invoiceDetail?.advancedAmount || 0,
                personInCharge: {
                    userId: currentUser?.id || '',
                    userCode: currentUser?.code || '',
                    userName: currentUser?.fullName || '',
                    userPhone: currentUser?.phoneNumber || '',
                    userPosition: currentUser?.positions?.map((pos: any) => pos.id)?.join(';') || '',
                },
            });
            refetch();
        } catch (error) {}
    };

    return (
        <div className="py-2 px-4 max-h-[calc(100vh_-_104px)]">
            <RightControl>
                <BaseFloatButton
                    icon={<FontAwesomeIcon icon={faFileExcel} size="lg" />}
                    badge={{ count: attachments?.length }}
                    type="primary"
                    onClick={handleOpenDocuments}
                    title={t('global.file')}
                />
            </RightControl>
            <Documents ref={attachmentRef} attachmentPath={generateAttachmentPath()} disabled={true} />
            <Spin spinning={isLoading || isFetching}>
                <Form
                    name="form-sale-management"
                    layout="vertical"
                    rootClassName="relative"
                    className="w-full h-[calc(100vh_-_94px)] flex flex-col bg-white rounded-lg overflow-auto"
                    autoComplete="off"
                    form={form as any}
                    disabled
                    onFinish={handleAddEdit}
                    onKeyDown={e => {
                        if (e.key === 'Enter') e.preventDefault();
                    }}
                    initialValues={{
                        _attachmentPath: generateAttachmentPath(),
                    }}
                    preserve
                >
                    {isEdit && <InvoiceTag value={invoiceDetail?.status} className="absolute top-1 right-0  !text-lg" />}
                    <div className="max-w-full grow p-4 box-border">
                        <Information />
                        <Products />
                        {isEdit && invoiceDetail?.paymentHistorys && (
                            <DebtPaymentSteps
                                transactions={invoiceDetail.paymentHistorys.map((history: any) => ({
                                    amount: history.amount,
                                    createdByName: history.personInCharge,
                                    transactionDate: history.transactionDate,
                                    paymentType: history.paymentType,
                                    paymentMethodName: history.paymentMethod,
                                    description: history.description,
                                    returnReason: history.reasonReturn,
                                    remainingAmountAfterPayment: history.remainingAmountAfterPayment,
                                }))}
                                debtInfo={{
                                    totalAmount: invoiceDetail?.totalAmount || 0,
                                    paidAmount: invoiceDetail?.totalAmountPaid || 0,
                                    remainingAmount: invoiceDetail?.remainingAmount || 0,
                                }}
                                createdDate={invoiceDetail?.created}
                            />
                        )}
                    </div>
                    <AddOrEditFooter refetch={refetch} handleQuickRefund={handleQuickRefund} />
                </Form>
            </Spin>
            <QuickRefund
                ref={quickRefundRef}
                data={{
                    invoiceId: invoiceDetail?.id,
                    customerName: customer?.customerName,
                    customerId: customer?.customerId,
                    customerCode: customer?.customerCode,
                    customerShortName: (customer as any)?._original?.nameShort,
                    customerTaxCode: customer?.customerTaxCode,
                    customerContactPerson: customer?.customerContactPerson,
                    customerContactPersonPhone: customer?.customerContactPersonPhone,
                    address: customer?.customerAddress,
                    phone: customer?.customerPhone,
                    customerBankAccountName: customer?.customerBankAccountName,
                    customerBankAccountNumber: customer?.customerBankAccountNumber,
                    customerBankName: customer?.customerBankName,
                    customerBankBranch: customer?.customerBankBranch,
                    code: invoiceDetail?.code,
                    details: form.getFieldValue('details'),
                    invoiceDate: form.getFieldValue('invoiceDate'),
                    totalAmount: invoiceDetail?.totalAmount,
                    debtDocumentId: invoiceDetail?.debtDocumentId,
                    orderId: invoiceDetail?.orderId,
                    discountAmount: invoiceDetail?.discountAmount,
                    deliveryFee: invoiceDetail?.deliveryFee,
                    previousDebt: invoiceDetail?.previousDebt,
                    advancedAmount: invoiceDetail?.advancedAmount,
                    personInCharge: {
                        userId: currentUser?.id || '',
                        userCode: currentUser?.code || '',
                        userName: currentUser?.fullName || '',
                        userPhone: currentUser?.phoneNumber || '',
                        userPosition: currentUser?.positions?.map((pos: any) => pos.id)?.join(';') || '',
                    },
                }}
            />
        </div>
    );
};

export default AddOrEdit;

import { apiGetDetailCustomerInfo } from '@/api/customer.api';
import { apiCreateQuotation, apiGetDetailQuotation, apiUpdateQuotation } from '@/api/quotation';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import ApproveTag from '@/core/components/Status/ApproveTag';
import { useLocale } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/stores';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Form, Spin } from 'antd';
import { get } from 'lodash';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import BaseFloatButton from '@/components/button/BaseFloatButton';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { decodeJson, handleCommonError } from '@/utils/helpers';

import { QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

import { FormQuotation } from '@/interface/sales';

import DebtPaymentSteps from '../../components/DebtPaymentSteps';
import QuickPay from '../../components/QuickPay';
import QuickRefund from '../../components/QuickRefund';
import RightControl from '../../components/RightControl';
import { Helper } from '../../utils';
import Documents, { AttachmentRef } from './Documents';
import AddOrEditFooter from './Footer';
import Information from './Information';
import PersonInCharge from './PersonInCharge';
import Products from './Products';

const AddOrEdit = () => {
    const [form] = Form.useForm<FormQuotation>();
    const { t } = useLocale();
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEdit = !!id && id !== 'add';
    const personInCharge = Form.useWatch(['personInCharge'], { form, preserve: true });
    const customer = Form.useWatch(['customer'], { form, preserve: true });
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const dispatch = useAppDispatch();
    const watchedFormValues = Form.useWatch<FormQuotation>([], { form, preserve: true });
    const attachmentRef = useRef<AttachmentRef>(null);
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.SALES_ORDER]);
    const quickPayRef = useRef<any>(null);
    const quickRefundRef = useRef<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const generateAttachmentPath = () => {
        if (isEdit) {
            const attachments = get(watchedFormValues, 'attachments', []);
            const firstPath = attachments?.[0]?.path?.split('/')?.slice(-1)?.join('/');
            if (firstPath) {
                return `${AppRouters.SALES_ORDER}/Attachments/${firstPath}`;
            } else {
                return `${AppRouters.SALES_ORDER}/Attachments/${new Date().getTime()}`;
            }
        }
        return `${AppRouters.SALES_ORDER}/Attachments/${new Date().getTime()}`;
    };

    const {
        data: quotationDetail,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['getDetailQuotation', id],
        queryFn: async () => {
            const res = await apiGetDetailQuotation(id || '');
            if (res?.data) {
                const clonedData = { ...res?.data };
                if (clonedData?.customer?.customerId) {
                    const customerDetailResponse = await apiGetDetailCustomerInfo(clonedData.customer.customerId, { loading: false });
                    clonedData.customer._original = customerDetailResponse?.data ?? {};
                }
                form.setFieldsValue({
                    ...clonedData,
                    isDraft: clonedData?.status === 0,
                    details: clonedData?.details
                        ?.sort((a: any, b: any) => a?.number - b?.number)
                        ?.map((item: any) => {
                            const decodedAttributes = item?.suggestAttributeJson ? decodeJson<Record<string, any>>(item.suggestAttributeJson) : null;

                            return {
                                ...item,
                                _attachmentPath: generateAttachmentPath(),
                                _inventoryData: item?.quantityInStock || 0,
                                ...(decodedAttributes ?? {}),
                            };
                        }),
                });
                if (id) {
                    dispatch(
                        setBreadCrumbs({
                            [id]: `${t('menu.order')} ${clonedData?.customer?.customerName || ''}`,
                        }),
                    );
                }
            }
            return res?.data;
        },

        throwOnError: () => {
            notify.error('message.failed');
            return false;
        },
        enabled: isEdit,
        refetchOnWindowFocus: false,
    });
    useEffect(() => {
        if (personInCharge || !currentUser || isEdit) return;
        form.setFieldsValue({
            personInCharge: {
                userId: currentUser?.id,
                userCode: currentUser?.code,
                userName: currentUser?.fullName,
                userPhone: currentUser?.phoneNumber,
                userEmail: currentUser?.email,
                userPosition: currentUser?.positions?.map((user: any) => user.id)?.join(';'),
            },
        });
    }, [currentUser]);

    const sanitizeQuotationData = (data: FormQuotation) => {
        const sanitizedData = { ...data };
        delete sanitizedData.customer?._original;
        delete (sanitizedData as any)?._totalSellingPrice;
        delete (sanitizedData as any)?._attachmentPath;
        const { totalQuantity } = Helper.sumUp(sanitizedData?.details ?? []);
        sanitizedData.totalQuantity = totalQuantity;

        if (sanitizedData?.isDraft) {
            sanitizedData.status = 0;
        } else {
            sanitizedData.status = 1;
        }
        delete (sanitizedData as any)?.isDraft;

        if (id) {
            if (sanitizedData?.customer) sanitizedData.customer.quotationIssueId = id;
            if (sanitizedData?.delivery) sanitizedData.delivery.quotationIssueId = id;
            if (sanitizedData?.personInCharge) sanitizedData.personInCharge.quotationIssueId = id;
            if (sanitizedData?.warehouse) sanitizedData.warehouse.quotationIssueId = id;
        }

        let index = 1;
        for (const prod of sanitizedData?.details ?? []) {
            delete (prod as any)?._outputConvert;
            delete (prod as any)?._inventoryData;
            delete (prod as any)?._isPromotional;
            prod.amount = (prod.sellingPrice || 0) * (prod.quantity || 0) * (prod.weight || 1);
            if (id) prod.quotationIssueId = id;
            (prod as any).number = index++;
        }

        for (const attachment of sanitizedData?.attachments ?? []) {
            delete (attachment as any)?.status;
            delete (attachment as any)?.originFileObj;
            delete (attachment as any)?.uid;
            delete (attachment as any)?.id;
            if (id) attachment.quotationIssueId = id;
        }
        return sanitizedData;
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            await form.validateFields();
            const formValues: FormQuotation = form.getFieldsValue(true);
            const params = sanitizeQuotationData(formValues);

            params.details = params.details?.map(item => ({
                ...item,
                suggestAttributeJson: JSON.stringify({
                    items: item.items,
                    unitCode: item.unitCode,
                    unitName: item.unitName,
                }),
            }));

            const { totalAmount } = Helper.sumUp(params?.details ?? [], params?.previousDebt || 0);
            const deliveryFee = params?.deliveryFee || 0;
            const discount = params?.discountAmount || 0;
            const totalPrice = totalAmount + deliveryFee - discount;
            if (totalPrice <= 0) {
                notify.error(t('sales.messages.total_must_greater_than_zero'));
                return;
            }
            params.totalAmount = totalPrice;
            form.setFieldValue('totalAmount', totalPrice);

            let response: any;
            if (isEdit) {
                response = await apiUpdateQuotation({
                    payload: {
                        ...params,
                        id: quotationDetail?.id,
                    },
                });
            } else {
                response = await apiCreateQuotation({ payload: params });
            }
            if (response?.succeeded) {
                notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
                if (formValues?._quickPay) {
                    form.setFieldValue('invoice', response.data?.invoice);
                    await quickPayRef?.current?.open({
                        debtDocumentId: response.data?.debtDocumentId,
                        invoiceDate: response.data?.invoiceDate || form.getFieldValue('invoiceDate'),
                        remainingAmount: response.data?.remainingAmount || response.data?.totalAmount,
                        totalAmount: response.data?.totalAmount || params.totalAmount,
                        status: response.data?.status || 1,
                        isEditMode: false,
                    });
                }
                if (formValues?._continueToAdd) {
                    form.resetFields();
                    form.setFieldsValue({
                        personInCharge: {
                            userId: currentUser?.id,
                            userCode: currentUser?.code,
                            userName: currentUser?.fullName,
                            userPhone: currentUser?.phoneNumber,
                            userPosition: currentUser?.positions?.map((user: any) => user.id)?.join(';'),
                        },
                        _continueToAdd: true,
                    });
                } else {
                    navigate(AppRouters.SALES_ORDER);
                }
            } else throw response;
        } catch (error) {
            handleCommonError(error, t);
        } finally {
            setIsSubmitting(false);
        }
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

    const handleQuickPay = async () => {
        try {
            await form.validateFields();

            const status = quotationDetail?.status;
            let debtDocumentId = form.getFieldValue('debtDocumentId');
            let invoiceDate = form.getFieldValue('invoiceDate');
            let remainingAmount = form.getFieldValue('remainingAmount');
            let totalAmount = form.getFieldValue('totalAmount');
            let needUpdateBeforePay = status === QUOTATION_TARGET_STATUS.REQUEST;
            if (needUpdateBeforePay) {
                const formValues: FormQuotation = form.getFieldsValue(true);
                const params = sanitizeQuotationData(formValues);
                const { totalAmount } = Helper.sumUp(params?.details ?? [], params?.previousDebt || 0);
                const deliveryFee = params?.deliveryFee || 0;
                const discount = params?.discountAmount || 0;
                params.totalAmount = totalAmount + deliveryFee - discount;
                const response = await apiUpdateQuotation({
                    payload: {
                        ...params,
                        id: quotationDetail?.id,
                    },
                });
                if (!response?.succeeded) {
                    throw response;
                }
                notify.success(t('message.update_success'));
                debtDocumentId = response.data?.debtDocumentId;
                remainingAmount = response.data?.remainingAmount;

                await refetch();
            }

            await quickPayRef?.current?.open({
                debtDocumentId,
                invoiceDate,
                remainingAmount,
                totalAmount,
                status: quotationDetail?.status,
                isEditMode: isEdit,
            });
            await refetch();
        } catch (error: any) {
            if (error?.code === -1) return;
            handleCommonError(error, t);
        }
    };

    const handleQuickRefund = async () => {
        try {
            await quickRefundRef?.current?.open({
                invoiceId: quotationDetail?.invoiceId,
                debtDocumentId: form.getFieldValue('debtDocumentId'),
                invoiceDate: form.getFieldValue('invoiceDate'),
                totalAmount: form.getFieldValue('totalAmount'),
                code: quotationDetail?.invoiceCode,
                customerName: customer?.customerName,
                customerId: customer?.customerId,
                customerCode: customer?.customerCode,
                customerShortName: customer?.customerShortName || '',
                customerTaxCode: customer?.customerTaxCode || '',
                customerContactPerson: customer?.customerContactPerson || '',
                customerContactPersonPhone: customer?.customerContactPersonPhone || '',
                address: customer?.customerAddress,
                phone: customer?.customerPhone,
                customerBankAccountName: customer?.customerBankAccountName || '',
                customerBankAccountNumber: customer?.customerBankAccountNumber || '',
                customerBankName: customer?.customerBankName || '',
                customerBankBranch: customer?.customerBankBranch || '',
                orderId: quotationDetail?.id,
                details: form.getFieldValue('details'),
                discountAmount: form.getFieldValue('discountAmount') || 0,
                deliveryFee: form.getFieldValue('deliveryFee') || 0,
                previousDebt: form.getFieldValue('previousDebt') || 0,
                advancedAmount: form.getFieldValue('advancedAmount') || 0,
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
        <div className="py-4 px-8 max-h-[calc(100vh_-_104px)]">
            <Spin spinning={isLoading || isFetching}>
                <Form
                    name="form-sale-management"
                    layout="vertical"
                    rootClassName="relative"
                    className="w-full h-[calc(100vh_-_104px)] flex flex-col bg-white rounded-lg overflow-auto"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    form={form}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                            e.preventDefault();
                        }
                    }}
                    initialValues={{
                        _attachmentPath: generateAttachmentPath(),
                        ...(!isEdit && { invoiceDate: moment(), _quickPay: false }),
                    }}
                    preserve
                    disabled={
                        (quotationDetail?.status !== QUOTATION_TARGET_STATUS.REQUEST &&
                            quotationDetail?.status !== QUOTATION_TARGET_STATUS.DRAFT &&
                            isEdit) ||
                        !isFullPermission
                    }
                >
                    {isEdit && <ApproveTag value={quotationDetail?.status} className="absolute top-1 right-0  !text-lg" />}
                    <RightControl>
                        <BaseFloatButton
                            icon={<FontAwesomeIcon icon={faFileExcel} size="lg" />}
                            badge={{ count: watchedFormValues?.attachments?.length }}
                            type="primary"
                            onClick={handleOpenDocuments}
                            title={t('global.file')}
                        />
                    </RightControl>
                    <div className="max-w-full grow p-4 box-border">
                        <Information />
                        <PersonInCharge />
                        <Products />
                        {isEdit && quotationDetail?.paymentHistorys && (
                            <DebtPaymentSteps
                                transactions={quotationDetail.paymentHistorys.map((history: any) => ({
                                    amount: history.amount,
                                    createdByName: history.personInCharge,
                                    transactionDate: history.transactionDate,
                                    paymentType: history.paymentType,
                                    paymentMethodName: history.paymentMethod,
                                    returnReason: history.reasonReturn,
                                    remainingAmountAfterPayment: history.remainingAmountAfterPayment,
                                }))}
                                debtInfo={{
                                    totalAmount: quotationDetail?.totalAmount || 0,
                                    paidAmount: quotationDetail?.totalAmountPaid || 0,
                                    remainingAmount: quotationDetail?.remainingAmount || 0,
                                }}
                                createdDate={quotationDetail?.created}
                            />
                        )}
                    </div>
                    <Documents
                        ref={attachmentRef}
                        attachmentPath={generateAttachmentPath()}
                        disabled={
                            (quotationDetail?.status !== QUOTATION_TARGET_STATUS.REQUEST &&
                                quotationDetail?.status !== QUOTATION_TARGET_STATUS.DRAFT) ||
                            !isFullPermission
                        }
                    />
                    <AddOrEditFooter
                        refetchDetail={() => refetch()}
                        handleQuickPay={handleQuickPay}
                        handleQuickRefund={handleQuickRefund}
                        isSubmitting={isSubmitting}
                    />
                </Form>
            </Spin>
            <QuickPay
                ref={quickPayRef}
                data={{
                    customerName: customer?.customerName,
                    address: customer?.customerAddress,
                    phone: customer?.customerPhone,
                    code: form.getFieldValue('invoice'),
                    details: form.getFieldValue('details'),
                    previousDebt: form.getFieldValue('previousDebt') || 0,
                    deliveryFee: form.getFieldValue('deliveryFee') || 0,
                    discount: form.getFieldValue('discountAmount') || 0,
                    totalAmount: form.getFieldValue('totalAmount') || 0,
                    invoiceDate: form.getFieldValue('invoiceDate'),
                    totalAmountPaid: quotationDetail?.totalAmountPaid || 0,
                }}
            />
            <QuickRefund
                ref={quickRefundRef}
                data={{
                    invoiceId: quotationDetail?.invoiceId,
                    customerName: customer?.customerName,
                    customerId: customer?.customerId,
                    customerCode: customer?.customerCode,
                    customerShortName: customer?.customerShortName,
                    customerTaxCode: customer?.customerTaxCode,
                    customerContactPerson: customer?.customerContactPerson,
                    customerContactPersonPhone: customer?.customerContactPersonPhone,
                    address: customer?.customerAddress,
                    phone: customer?.customerPhone,
                    customerBankAccountName: customer?.customerBankAccountName,
                    customerBankAccountNumber: customer?.customerBankAccountNumber,
                    customerBankName: customer?.customerBankName,
                    customerBankBranch: customer?.customerBankBranch,
                    code: quotationDetail?.invoiceCode,
                    details: form.getFieldValue('details'),
                    invoiceDate: form.getFieldValue('invoiceDate'),
                    totalAmount: form.getFieldValue('totalAmount'),
                    debtDocumentId: form.getFieldValue('debtDocumentId'),
                    discountAmount: form.getFieldValue('discountAmount') || 0,
                    deliveryFee: form.getFieldValue('deliveryFee') || 0,
                    previousDebt: form.getFieldValue('previousDebt') || 0,
                    advancedAmount: form.getFieldValue('advancedAmount') || 0,
                    orderId: quotationDetail?.id,
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

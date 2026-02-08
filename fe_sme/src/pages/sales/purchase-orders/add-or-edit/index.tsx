import { apiCreatePurchase, apiGetDetailPurchase, apiUpdatePurchase } from '@/api/purchase.api';
import { apiGetDetailSupplierInfo } from '@/api/supplier.api';
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

import { handleCommonError } from '@/utils/helpers';

import { PURCHASE_STATUS } from '@/constants/sales/purchase';

import { FormPurchase } from '@/interface/sales';

import DebtPaymentSteps from '../../components/DebtPaymentSteps';
import RightControl from '../../components/RightControl';
import { Helper } from '../../utils';
import Documents, { AttachmentRef } from './Documents';
import AddOrEditFooter from './Footer';
import Information from './Information';
import PersonInCharge from './PersonInCharge';
import Products from './Products';

const AddOrEdit = () => {
    const [form] = Form.useForm<FormPurchase>();
    const { t } = useLocale();
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const isEdit = !!id && id !== 'add';
    const personInCharge = Form.useWatch(['personInCharge'], { form, preserve: true });
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const dispatch = useAppDispatch();
    const watchedFormValues = Form.useWatch<FormPurchase>([], { form, preserve: true });
    const attachmentRef = useRef<AttachmentRef>(null);
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.PURCHASE_ORDERS]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const generateAttachmentPath = () => {
        if (isEdit) {
            const attachments = get(watchedFormValues, 'attachments', []);
            const firstPath = attachments?.[0]?.path?.split('/')?.slice(-1)?.join('/');
            if (firstPath) {
                return `${AppRouters.PURCHASE_ORDERS}/Attachments/${firstPath}`;
            } else {
                return `${AppRouters.PURCHASE_ORDERS}/Attachments/${new Date().getTime()}`;
            }
        }
        return `${AppRouters.PURCHASE_ORDERS}/Attachments/${new Date().getTime()}`;
    };

    const {
        data: purchaseDetail,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ['getDetailPurchase', id],
        queryFn: async () => {
            const res = await apiGetDetailPurchase(id || '');
            if (res?.data) {
                const clonedData = { ...res?.data };
                if (clonedData?.supplier?.supplierId) {
                    const supplierDetailResponse = await apiGetDetailSupplierInfo(clonedData.supplier.supplierId, { loading: false });
                    clonedData.supplier._original = supplierDetailResponse?.data ?? {};
                }
                form.setFieldsValue({
                    ...clonedData,
                    isDraft: clonedData?.status === 0,
                    details: clonedData?.details
                        ?.sort((a: any, b: any) => a?.number - b?.number)
                        ?.map((item: any) => ({
                            ...item,
                            _attachmentPath: generateAttachmentPath(),
                        })),
                });
                if (id) {
                    dispatch(
                        setBreadCrumbs({
                            [id]: `${t('sales.purchase_orders')} ${clonedData?.supplier?.supplierName || ''}`,
                        }),
                    );
                }
            }
            return res?.data;
        },

        throwOnError: () => {
            notify.error(t('message.failed'));
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

    const sanitizePurchaseData = (data: FormPurchase) => {
        const sanitizedData = { ...data };
        delete sanitizedData.supplier?._original;
        delete (sanitizedData as any)?._totalSellingPrice;
        delete (sanitizedData as any)?._attachmentPath;
        const { totalQuantity } = Helper.sumUp(sanitizedData?.details ?? []);
        sanitizedData.totalQuantity = totalQuantity;

        delete (sanitizedData as any)?.isDraft;

        if (id) {
            if (sanitizedData?.supplier) sanitizedData.supplier.purchaseIssueId = id;
            if (sanitizedData?.delivery) sanitizedData.delivery.purchaseIssueId = id;
            if (sanitizedData?.personInCharge) sanitizedData.personInCharge.purchaseIssueId = id;
            if (sanitizedData?.warehouse) sanitizedData.warehouse.purchaseIssueId = id;
        }

        let index = 1;
        for (const prod of sanitizedData?.details ?? []) {
            delete (prod as any)?._outputConvert;
            delete (prod as any)?._inventoryData;
            delete (prod as any)?._isPromotional;
            prod.amount = (prod.importprice || 0) * (prod.quantity || 0) * (prod.weight || 1);
            if (id) prod.purchaseIssueId = id;
            (prod as any).number = index++;
        }

        for (const attachment of sanitizedData?.attachments ?? []) {
            delete (attachment as any)?.status;
            delete (attachment as any)?.originFileObj;
            delete (attachment as any)?.uid;
            delete (attachment as any)?.id;
            if (id) attachment.purchaseIssueId = id;
        }
        return sanitizedData;
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            await form.validateFields();
            const formValues: FormPurchase = form.getFieldsValue(true);
            const params = sanitizePurchaseData(formValues);

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
                response = await apiUpdatePurchase({
                    ...params,
                    id: purchaseDetail?.id,
                });
            } else {
                response = await apiCreatePurchase(params);
            }
            if (response?.succeeded) {
                notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
                if (formValues?._continueToAdd) {
                    form.resetFields();
                    form.setFieldsValue({
                        personInCharge: {
                            userId: currentUser?.id,
                            userCode: currentUser?.code,
                            userName: currentUser?.fullName,
                            userPhone: currentUser?.phoneNumber,
                            userEmail: currentUser?.email,
                            userPosition: currentUser?.positions?.map((user: any) => user.id)?.join(';'),
                        },
                        _continueToAdd: true,
                    });
                } else {
                    navigate(AppRouters.PURCHASE_ORDERS);
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
                        ...(!isEdit && { invoiceDate: moment(), status: PURCHASE_STATUS.DRAFT }),
                    }}
                    preserve
                    disabled={
                        (purchaseDetail?.status !== PURCHASE_STATUS.REQUEST && purchaseDetail?.status !== PURCHASE_STATUS.DRAFT && isEdit) ||
                        !isFullPermission
                    }
                >
                    {isEdit && <ApproveTag value={purchaseDetail?.status} className="absolute top-1 right-0  !text-lg" />}
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
                        {isEdit && purchaseDetail?.paymentHistorys && (
                            <DebtPaymentSteps
                                type="purchase"
                                transactions={purchaseDetail?.paymentHistorys.map((transaction: any) => ({
                                    id: transaction.id,
                                    amount: transaction.amount,
                                    personInCharge: transaction.personInCharge,
                                    transactionDate: transaction.transactionDate,
                                    paymentMethodName: transaction.paymentMethod,
                                    description: transaction.description,
                                    paymentType: transaction.paymentType,
                                    returnReason: transaction.reasonReturn,
                                    remainingAmountAfterPayment: transaction.remainingAmountAfterPayment,
                                }))}
                                debtInfo={{
                                    totalAmount: purchaseDetail?.totalAmount || 0,
                                    paidAmount: purchaseDetail?.paidAmount || 0,
                                    remainingAmount: purchaseDetail?.remainingAmount || 0,
                                }}
                                createdDate={purchaseDetail?.created}
                            />
                        )}
                    </div>
                    <Documents
                        ref={attachmentRef}
                        attachmentPath={generateAttachmentPath()}
                        disabled={
                            (purchaseDetail?.status !== PURCHASE_STATUS.REQUEST && purchaseDetail?.status !== PURCHASE_STATUS.DRAFT) ||
                            !isFullPermission
                        }
                    />
                    <AddOrEditFooter isSubmitting={isSubmitting} initialStatus={purchaseDetail?.status} />
                </Form>
            </Spin>
        </div>
    );
};

export default AddOrEdit;

import { apiCreatePurchaseInvoice, apiGetDetailPurchaseInvoice, apiUpdatePurchaseInvoice } from '@/api/purchase-invoice.api';
import { apiGetDetailSupplierInfo } from '@/api/supplier.api';
import { AppRouters } from '@/constants';
import InvoiceTag from '@/core/components/Status/InvoiceTag';
import { useLocale } from '@/i18n';
import { useAppDispatch } from '@/stores';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Form, Spin } from 'antd';
import { get } from 'lodash';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Documents, { AttachmentRef } from '@/pages/sales/Order/add-or-edit/Documents';
import DebtPaymentSteps from '@/pages/sales/components/DebtPaymentSteps';
import RightControl from '@/pages/sales/components/RightControl';

import BaseFloatButton from '@/components/button/BaseFloatButton';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import { IAddEditPurchaseInvoice } from '@/interface/sales/purchase-invoice';

import AddOrEditFooter from './Footer';
import Information from './Information';
import Products from './Products';

const AddOrEdit = () => {
    const [form] = Form.useForm<IAddEditPurchaseInvoice>();
    const { t } = useLocale();
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const attachmentRef = useRef<AttachmentRef>(null);

    const isEdit = !!id && id !== 'add';
    const dispatch = useAppDispatch();
    const watchedFormValues = Form.useWatch<IAddEditPurchaseInvoice>([], { form, preserve: true });
    const attachments = Form.useWatch('attachments', { form, preserve: true }) || [];

    const generateAttachmentPath = () => {
        if (isEdit) {
            const attachments = get(watchedFormValues, 'attachments', []);
            const firstPath = attachments?.[0]?.path?.split('/')?.slice(-1)?.join('/');
            if (firstPath) {
                return `${AppRouters.PURCHASE_INVOICE}/Attachments/${firstPath}`;
            } else {
                return `${AppRouters.PURCHASE_INVOICE}/Attachments/${new Date().getTime()}`;
            }
        }
        return `${AppRouters.PURCHASE_INVOICE}/Attachments/${new Date().getTime()}`;
    };

    const {
        data: invoiceDetail,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['getDetailPurchaseInvoice', id],
        queryFn: async () => {
            const res = await apiGetDetailPurchaseInvoice(id || '', { loading: false });
            if (id) {
                dispatch(
                    setBreadCrumbs({
                        [id]: `${t('menu.purchase_invoice_edit')}`,
                    }),
                );
            }
            if (res?.data) {
                const clonedData = { ...res?.data };
                if (clonedData?.supplier?.supplierId) {
                    const supplierDetailResponse = await apiGetDetailSupplierInfo(clonedData.supplier.supplierId, { loading: false });
                    clonedData.supplier._original = supplierDetailResponse?.data ?? {};
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

    const handleAddEdit = async () => {
        const data: IAddEditPurchaseInvoice = form.getFieldsValue(true);
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
        delete params?.supplier?.currentSupplier;
        const res = isEdit ? await apiUpdatePurchaseInvoice(params) : await apiCreatePurchaseInvoice(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            if (data?.isSaveAdd) {
                form.resetFields();
            } else {
                navigate(AppRouters.PURCHASE_INVOICE);
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
                                type="purchase"
                                transactions={invoiceDetail.paymentHistorys.map((transaction: any) => ({
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
                                    totalAmount: invoiceDetail?.totalAmount || 0,
                                    paidAmount: invoiceDetail?.totalAmountPaid || 0,
                                    remainingAmount: invoiceDetail?.remainingAmount || 0,
                                }}
                                createdDate={invoiceDetail?.created}
                            />
                        )}
                    </div>
                    <AddOrEditFooter refetch={refetch} />
                </Form>
            </Spin>
        </div>
    );
};

export default AddOrEdit;

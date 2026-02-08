import { apiAddOrderRefund, apiGetDetailOrderRefund, apiUpdateOrderRefund } from '@/api/contract.api';
import { apiGetDetailCustomerInfo } from '@/api/customer.api';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import { COMMON_STATUS } from '@/core/components/Status/RefundTag';
import { useLocale } from '@/i18n';
import { useAppDispatch } from '@/stores';
import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Form, Spin } from 'antd';
import { get } from 'lodash';
import { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import RightControl from '@/pages/sales/components/RightControl';

import BaseFloatButton from '@/components/button/BaseFloatButton';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { decodeJson } from '@/utils/helpers';

import { IAddEditInvoice } from '@/interface/contract';
import { IAddEditWarehouseConfig } from '@/interface/logistics';

import { sellingPriceByItem } from '../../utils';
import Documents, { AttachmentRef } from './Documents';
import AddOrEditFooter from './Footer';
import Information from './Information';
import Products from './Products';

const AddOrEdit = () => {
    const [form] = Form.useForm();
    const { t } = useLocale();
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const attachmentRef = useRef<AttachmentRef>(null);

    const isEdit = !!id && id !== 'add';
    const dispatch = useAppDispatch();
    const watchedFormValues = Form.useWatch<IAddEditInvoice>([], { form, preserve: true });
    const attachments = Form.useWatch('attachments', { form, preserve: true }) || [];
    const customerId = Form.useWatch(['customer', 'customerId'], { form, preserve: true }) || '';
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.REFUND]);

    useQuery<{ data: IAddEditWarehouseConfig[] }>({
        queryKey: ['getCustomerInfoById', customerId],
        queryFn: async () => {
            const res = await apiGetDetailCustomerInfo(customerId, { loading: false });
            const dataCustomer = res?.data ?? {};
            form.setFieldValue(['customer', '_original'], dataCustomer);
            return res.data;
        },
        enabled: !!customerId && !isEdit,
    });

    const generateAttachmentPath = () => {
        if (isEdit) {
            const attachments = get(watchedFormValues, 'attachments', []);
            const firstPath = attachments?.[0]?.path?.split('/')?.slice(-1)?.join('/');
            if (firstPath) {
                return `${AppRouters.REFUND}/Attachments/${firstPath}`;
            } else {
                return `${AppRouters.REFUND}/Attachments/${new Date().getTime()}`;
            }
        }
        return `${AppRouters.REFUND}/Attachments/${new Date().getTime()}`;
    };

    const {
        data: refundDetail,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ['getDetailOrderRefund', id],
        queryFn: async () => {
            const res = await apiGetDetailOrderRefund(id || '');
            if (id) {
                dispatch(
                    setBreadCrumbs({
                        [id]: `${t('sales.return.edit')}`,
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
                    deliveryFee: clonedData?.deliveryFee || 0,
                    discountAmount: clonedData?.discountAmount || 0,
                    previousDebt: clonedData?.previousDebt || 0,
                    details: clonedData?.details
                        ?.sort((a: any, b: any) => a?.number - b?.number)
                        ?.map((item: any) => {
                            const decodedAttributes = item?.suggestAttributeJson ? decodeJson<Record<string, any>>(item.suggestAttributeJson) : null;

                            return {
                                ...item,
                                _attachmentPath: generateAttachmentPath(),
                                _outputConvert: item?.weightTheoretical / item?.quantity,
                                returnQuantity: item?.returnQuantity || 0,
                                ...(decodedAttributes ?? {}),
                            };
                        }),
                });
            }
            return res?.data;
        },
        throwOnError: () => {
            notify.error(t('message.failed'));
            return false;
        },
        enabled: isEdit,
    });

    const handleAddEdit = async () => {
        const data = form.getFieldsValue(true);

        const refundDetails = (data?.details ?? []).map((item: any, index: number) => {
            const refundItem = {
                ...item,
                quantity: item.returnQuantity || 0,
            };
            const returnAmount = sellingPriceByItem(refundItem, 'sale');

            return {
                ...(isEdit ? { id: item.id } : {}),
                productId: item.productId,
                productCode: item.productCode,
                productName: item.productName,
                productType: item.productType,
                productGroup: item.productGroup,
                unit: item.unit,
                quantity: item.quantity || 0,
                returnQuantity: item.returnQuantity || 0,
                amount: returnAmount || 0,
                costPrice: item.costPrice || 0,
                sellingPrice: item.sellingPrice || 0,
                productStatus: item.productStatus,
                weight: item.weight || 0,
                suggestAttributeJson: item.suggestAttributeJson || '',
                number: index + 1,
            };
        });

        if (refundDetails.length === 0) {
            notify.error(t('sales.messages.required_products'));
            return;
        }
        const hasRefundProducts = refundDetails.some((item: any) => (item.returnQuantity || 0) > 0);
        if (!hasRefundProducts) {
            notify.error(t('sales.messages.required_at_least_one_refund_product'));
            return;
        }

        const totalRefundAmount = refundDetails.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        const totalReturnQuantity = refundDetails.reduce((sum: number, item: any) => sum + (item.returnQuantity || 0), 0);

        const params = {
            ...(isEdit && { id: refundDetail?.id }),
            ...(data.code && { code: data.code }),
            invoiceId: data.invoiceId,
            invoiceCode: data.invoiceCode,
            invoiceDate: data.invoiceDate,
            orderId: data.orderId,
            orderCode: data.orderCode,
            orderReturnDate: data.orderReturnDate,
            deliveryDate: data.deliveryDate,
            receiptDate: data.receiptDate,
            totalQuantity: data.totalQuantity || 0,
            discountAmount: data.discountAmount || 0,
            advancedAmount: data.advancedAmount || 0,
            deliveryFee: data.deliveryFee || 0,
            totalAmount: data.totalAmount || 0,
            previousDebt: data.previousDebt || 0,
            status: data.status || 0,
            description: data.description || '',
            reasonReturn: data.reasonReturn || '',
            totalRefund: totalRefundAmount,
            totalReturnQuantity: totalReturnQuantity,
            customer: data.customer
                ? {
                      customerId: data.customer.customerId,
                      customerCode: data.customer.customerCode,
                      customerName: data.customer.customerName,
                      customerShortName: data.customer.customerShortName,
                      customerPhone: data.customer.customerPhone,
                      customerAddress: data.customer.customerAddress,
                      customerTaxCode: data.customer.customerTaxCode,
                      customerContactPerson: data.customer.customerContactPerson,
                      customerContactPersonPhone: data.customer.customerContactPersonPhone,
                      customerBankAccountName: data.customer.customerBankAccountName,
                      customerBankAccountNumber: data.customer.customerBankAccountNumber,
                      customerBankName: data.customer.customerBankName,
                      customerBankBranch: data.customer.customerBankBranch,
                  }
                : undefined,
            personInCharge: data.personInCharge
                ? {
                      userId: data.personInCharge.userId,
                      userCode: data.personInCharge.userCode,
                      userName: data.personInCharge.userName,
                      userPhone: data.personInCharge.userPhone,
                      userPosition: data.personInCharge.userPosition,
                  }
                : undefined,
            details: refundDetails,
            attachments:
                attachments?.map((item: any) => ({
                    name: item.name,
                    description: item.description || '',
                    extension: item.extension,
                    path: item.path,
                })) ?? [],
        };

        const res = isEdit ? await apiUpdateOrderRefund(params) : await apiAddOrderRefund(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            if (data?.isSaveAdd) {
                form.resetFields();
            } else {
                navigate(AppRouters.REFUND);
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
            <Documents
                ref={attachmentRef}
                attachmentPath={generateAttachmentPath()}
                disabled={!isFullPermission || !isEdit || refundDetail?.status === 1}
            />
            <Spin spinning={isLoading || isFetching}>
                <Form
                    name="form-sale-management"
                    layout="vertical"
                    rootClassName="relative"
                    className="w-full h-[calc(100vh_-_94px)] flex flex-col bg-white rounded-lg overflow-auto"
                    autoComplete="off"
                    form={form}
                    disabled={!isFullPermission || (isEdit && refundDetail?.status === 1)}
                    onFinish={handleAddEdit}
                    onKeyDown={e => {
                        if (e.key === 'Enter') e.preventDefault();
                    }}
                    initialValues={{
                        _attachmentPath: generateAttachmentPath(),
                        ...(isEdit ? {} : { status: COMMON_STATUS.NOT_REFUND }),
                    }}
                    preserve
                >
                    <div className="max-w-full grow p-4 box-border">
                        <Information />
                        <Products />
                    </div>
                    <AddOrEditFooter initialStatus={refundDetail?.status} />
                </Form>
            </Spin>
        </div>
    );
};

export default AddOrEdit;

import { apiCreatePurchaseReturn, apiGetDetailPurchaseReturn, apiUpdatePurchaseReturn } from '@/api/purchase-return.api';
import { apiGetDetailSupplierInfo } from '@/api/supplier.api';
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

import { IAddEditInvoice } from '@/interface/contract';
import { IAddEditWarehouseConfig } from '@/interface/logistics';

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
    const supplierId = Form.useWatch(['supplier', 'supplierId'], { form, preserve: true }) || '';
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.PURCHASE_REFUND_EDIT]);

    useQuery<{ data: IAddEditWarehouseConfig[] }>({
        queryKey: ['getSupplierInfoById', supplierId],
        queryFn: async () => {
            const res = await apiGetDetailSupplierInfo(supplierId, { loading: false });
            const dataSupplier = res?.data ?? {};
            form.setFieldValue(['supplier', '_original'], dataSupplier);
            return res.data;
        },
        enabled: !!supplierId && !isEdit,
    });

    const generateAttachmentPath = () => {
        if (isEdit) {
            const attachments = get(watchedFormValues, 'attachments', []);
            const firstPath = attachments?.[0]?.path?.split('/')?.slice(-1)?.join('/');
            if (firstPath) {
                return `${AppRouters.PURCHASE_REFUND}/Attachments/${firstPath}`;
            } else {
                return `${AppRouters.PURCHASE_REFUND}/Attachments/${new Date().getTime()}`;
            }
        }
        return `${AppRouters.PURCHASE_REFUND}/Attachments/${new Date().getTime()}`;
    };

    const {
        data: refundDetail,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ['getDetailPurchaseReturn', id],
        queryFn: async () => {
            const res = await apiGetDetailPurchaseReturn(id || '');
            if (id) {
                dispatch(
                    setBreadCrumbs({
                        [id]: `${t('menu.purchase_refund_edit')}`,
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
                            returnQuantity: item?.returnQuantity || 0,
                        })),
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
            const returnAmount = (item?.importprice || 0) * (item?.returnQuantity || 0) * (item?.weight || 1);

            return {
                productId: item.productId,
                productCode: item.productCode,
                productName: item.productName,
                productType: item.productType,
                productGroup: item.productGroup,
                unit: item.unit,
                quantity: item.quantity || 0,
                returnQuantity: item.returnQuantity || 0,
                amount: returnAmount || 0,
                importprice: item.importprice || 0,
                productStatus: item.productStatus,
                weight: item.weight || 0,
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
            purchaseInvoiceId: data.purchaseInvoiceId,
            purchaseInvoiceCode: data.purchaseInvoiceCode,
            purchaseInvoiceDate: data.purchaseInvoiceDate,
            purchaseId: data.purchaseId,
            purchaseCode: data.purchaseCode,
            purchaseReturnDate: data.purchaseReturnDate,
            totalQuantity: data.totalQuantity || 0,
            totalAmount: data.totalAmount || 0,
            status: data.status || 0,
            description: data.description || '',
            reasonReturn: data.reasonReturn || '',
            totalRefund: totalRefundAmount,
            totalReturnQuantity: totalReturnQuantity,
            supplier: data.supplier
                ? {
                      supplierId: data.supplier.supplierId,
                      supplierCode: data.supplier.supplierCode,
                      supplierName: data.supplier.supplierName,
                      supplierShortName: data.supplier.supplierShortName,
                      supplierPhone: data.supplier.supplierPhone,
                      supplierAddress: data.supplier.supplierAddress,
                      supplierTaxCode: data.supplier.supplierTaxCode,
                      supplierContactPerson: data.supplier.supplierContactPerson,
                      supplierContactPersonPhone: data.supplier.supplierContactPersonPhone,
                      supplierBankAccountName: data.supplier.supplierBankAccountName,
                      supplierBankAccountNumber: data.supplier.supplierBankAccountNumber,
                      supplierBankName: data.supplier.supplierBankName,
                      supplierBankBranch: data.supplier.supplierBankBranch,
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

        const res = isEdit ? await apiUpdatePurchaseReturn(params) : await apiCreatePurchaseReturn(params);
        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));
            if (data?.isSaveAdd) {
                form.resetFields();
            } else {
                navigate(AppRouters.PURCHASE_REFUND);
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

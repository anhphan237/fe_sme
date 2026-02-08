import { apiAddOrderRefund } from '@/api/contract.api';
import { apiGetFileFromPath, apiUploadFile } from '@/api/file.api';
import { AppRouters } from '@/constants';
import BaseDatePicker from '@/core/components/DatePicker';
import FormDragger, { FormDraggerProps } from '@/core/components/Dragger/FormDragger';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { CloseOutlined } from '@ant-design/icons';
import { faFileExcel, faFilePdf, faFileWord, faImage, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Drawer, Form, Spin, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { omit } from 'lodash';
import moment from 'moment';
import { Ref, forwardRef, useImperativeHandle, useState } from 'react';

import DrawerFooter from '@/pages/sales/components/DrawerFooter';

import { notify } from '@/components/toast-message';

import usePromiseHolder from '@/hooks/usePromiseHolder';

import { convertTimeToInput, getMinMaxDateDisabledTime } from '@/utils/format-datetime';
import { FileHelper, InputHelper, convertedDateProps, formatMoney, formatNumber } from '@/utils/helpers';

import { RegexValidate } from '@/constants/global';

import { sellingPriceByItem } from '../utils';

const { Text } = Typography;

interface QuickRefundProps {
    data?: {
        customerName?: string;
        customerId?: string;
        customerCode?: string;
        customerShortName?: string;
        customerTaxCode?: string;
        customerContactPerson?: string;
        customerContactPersonPhone?: string;
        address?: string;
        phone?: string;
        customerBankAccountName?: string;
        customerBankAccountNumber?: string;
        customerBankName?: string;
        customerBankBranch?: string;
        code?: string;
        details?: any[];
        invoiceDate?: string;
        totalAmount?: number;
        debtDocumentId?: string;
        invoiceId?: string;
        orderId?: string;
        discountAmount?: number;
        deliveryFee?: number;
        previousDebt?: number;
        advancedAmount?: number;
        personInCharge?: {
            userId?: string;
            userCode?: string;
            userName?: string;
            userPhone?: string;
            userPosition?: string;
        };
    };
}

interface IRefundAttachment {
    id?: string;
    name: string;
    description?: string;
    extension: string;
    path: string;
    status?: string;
    uid?: string;
}

const QuickRefund = (props: QuickRefundProps, ref: Ref<any>) => {
    const { t } = useLocale();
    const [form] = Form.useForm();
    const attachments = Form.useWatch<IRefundAttachment[]>('attachments', { form, preserve: true }) || [];
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
    const { execute, resolve } = usePromiseHolder({});
    const invoiceDate = Form.useWatch('invoiceDate', { form, preserve: true });

    const handleOpen = async (initValue?: any) => {
        if (initValue) {
            form.setFieldsValue({
                refundDate: moment.utc().local(),
                invoiceDate: initValue?.invoiceDate ? convertTimeToInput(initValue?.invoiceDate) : null,
                debtDocumentId: initValue?.debtDocumentId,
                orderInvoiceCode: initValue?.code || '',
                customerName: initValue?.customerName || '',
                customerPhone: initValue?.phone || '',
                totalAmount: initValue?.totalAmount || 0,
            });
            setSelectedProducts(
                initValue?.details?.map((item: any, index: number) => ({
                    ...item,
                    key: index,
                    refundQuantity: 0,
                })) || [],
            );
        }
        setOpen(true);
        return execute();
    };

    useImperativeHandle(ref, () => ({
        open: handleOpen,
    }));

    const onSubmit = async () => {
        try {
            const allValues = await form.validateFields();
            const values = omit(allValues, ['debtDocumentId']);

            const refundDetails = selectedProducts.map((item, index) => {
                const returnQuantity = item.refundQuantity || 0;
                const returnAmount = sellingPriceByItem(
                    {
                        ...item,
                        quantity: returnQuantity,
                    },
                    'sale',
                );
                return {
                    productId: item.productId,
                    productCode: item.productCode,
                    productName: item.productName,
                    productType: item.productType || '',
                    productGroup: item.productGroup || '',
                    unit: item.unit || item.unitName || '',
                    quantity: item.quantity || 0,
                    returnQuantity: returnQuantity,
                    amount: returnAmount || 0,
                    costPrice: item.costPrice || 0,
                    sellingPrice: item.sellingPrice || 0,
                    productStatus: item.productStatus || '',
                    weight: item.weight || 0,
                    suggestAttributeJson: item.suggestAttributeJson || '',
                    number: index + 1,
                };
            });

            if (refundDetails.length === 0) {
                notify.error(t('sales.messages.required_products'));
                return;
            }
            const hasRefundProducts = refundDetails.some(item => item.returnQuantity > 0);
            if (!hasRefundProducts) {
                notify.error(t('sales.messages.required_at_least_one_refund_product'));
                return;
            }
            const totalRefundAmount = refundDetails.reduce((sum, item) => sum + (item.amount || 0), 0);
            const totalReturnQuantity = refundDetails.reduce((sum, item) => sum + item.returnQuantity, 0);
            const totalQuantity = refundDetails.reduce((sum, item) => sum + (item.quantity || 0), 0);

            const params = {
                invoiceId: props.data?.invoiceId || '',
                invoiceCode: props.data?.code || '',
                invoiceDate: props.data?.invoiceDate || new Date().toISOString(),
                orderId: props.data?.orderId || '',
                orderCode: props.data?.code || '',
                orderReturnDate: values.refundDate,
                deliveryDate: null,
                receiptDate: null,
                totalQuantity: totalQuantity,
                discountAmount: props.data?.discountAmount || 0,
                advancedAmount: props.data?.advancedAmount || 0,
                deliveryFee: props.data?.deliveryFee || 0,
                totalAmount: props.data?.totalAmount || 0,
                previousDebt: props.data?.previousDebt || 0,
                status: 0,
                description: values.reason || '',
                reasonReturn: values.reason || '',
                totalRefund: totalRefundAmount,
                totalReturnQuantity: totalReturnQuantity,
                customer: {
                    customerId: props.data?.customerId,
                    customerCode: props.data?.customerCode,
                    customerName: props.data?.customerName,
                    customerShortName: props.data?.customerShortName,
                    customerPhone: props.data?.phone,
                    customerAddress: props.data?.address,
                    customerTaxCode: props.data?.customerTaxCode,
                    customerContactPerson: props.data?.customerContactPerson,
                    customerContactPersonPhone: props.data?.customerContactPersonPhone,
                    customerBankAccountName: props.data?.customerBankAccountName,
                    customerBankAccountNumber: props.data?.customerBankAccountNumber,
                    customerBankName: props.data?.customerBankName,
                    customerBankBranch: props.data?.customerBankBranch,
                },
                personInCharge: {
                    userId: props.data?.personInCharge?.userId,
                    userCode: props.data?.personInCharge?.userCode,
                    userName: props.data?.personInCharge?.userName,
                    userPhone: props.data?.personInCharge?.userPhone,
                    userPosition: props.data?.personInCharge?.userPosition,
                },
                details: refundDetails,
                attachments:
                    attachments?.map((item: any) => ({
                        name: item.name,
                        description: item.description || '',
                        extension: item.extension,
                        path: item.path,
                    })) ?? [],
            };

            const res = await apiAddOrderRefund(params as any);
            if (res.succeeded) {
                notify.success(t('purchase_refund.create_success'));
                onClose();
                resolve(res);
            } else {
                notify.error(t('message.failed'));
            }
        } catch (error) {
            notify.error(t('global.message.error_occurs'));
        }
    };

    const customRequest = async (options: any) => {
        const { file, onSuccess, onError } = options;
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            const response = await apiUploadFile(formData, `${AppRouters.REFUND}/Attachments/${new Date().getTime()}`, { override: true });
            if (!response || !response.succeeded || !response.data.filePath) throw new Error(t('global.message.error'));
            onSuccess?.(response);
            const updatedAttachments = form.getFieldValue('attachments') || [];
            const newAtt = [...updatedAttachments];
            const matched = newAtt.find((a: any) => a.uid === file.uid);
            if (matched) {
                matched.path = response.data.filePath;
                matched.status = 'done';
                matched.id = file.uid;
                matched.extension = file.name.split('.').pop() || '';
                matched.name = file.name;
                matched.description = file.type;
            } else {
                newAtt.push({
                    id: file.uid,
                    name: file.name,
                    description: file.type,
                    extension: file.name.split('.').pop() || '',
                    path: response.data.filePath,
                    status: 'done',
                });
            }
            notify.success('global.message.success');
            form.setFieldValue('attachments', newAtt);
        } catch (error) {
            onError?.(error);
            notify.error(t('global.message.error'));
        } finally {
            setLoading(false);
        }
    };

    const customIconRender: FormDraggerProps<any>['iconRender'] = file => {
        const extension = file.response?.extension?.toLowerCase() ?? (file as any).extension?.toLowerCase();
        const isLoading = file.status === 'uploading';
        if (isLoading) return <Spin size="small" className="text-primary" spinning />;
        if (['png', 'jpg', 'jpeg'].includes(extension)) {
            return <FontAwesomeIcon icon={faImage} />;
        }
        if (['pdf'].includes(extension)) {
            return <FontAwesomeIcon icon={faFilePdf} />;
        }
        if (['docx'].includes(extension)) {
            return <FontAwesomeIcon icon={faFileWord} />;
        }
        if (['xlsx', 'xls'].includes(extension)) {
            return <FontAwesomeIcon icon={faFileExcel} />;
        }
        return <FontAwesomeIcon icon={faPaperclip} />;
    };

    const handlePreview = async (file: any) => {
        try {
            const filePath = (file?.url ?? file?.path) as string;
            const dataBlob = await apiGetFileFromPath(filePath);
            await FileHelper.downloadFromBlob(dataBlob as any, file.name);
            notify.success(t('global.message.export_success'));
        } catch (error) {
            notify.error('global.message.export_failed');
        }
    };

    const handleRemove = async (file: any) => {
        const updatedAttachments = form.getFieldValue('attachments') || [];
        const index = updatedAttachments.findIndex((a: any) => a.uid === file.uid || a.id === file.uid);
        if (index !== -1) {
            const newAttachments = [...updatedAttachments];
            newAttachments.splice(index, 1);
            form.setFieldValue('attachments', newAttachments);
        } else {
            notify.error(t('global.message.error_occurs'));
            return false;
        }
        return true;
    };

    const onClose = () => {
        resolve('');
        setOpen(false);
        form.resetFields();
        setSelectedProducts([]);
    };

    const handleQuantityChange = (value: number, record: any) => {
        const updated = selectedProducts.map(p => (p.key === record.key ? { ...p, refundQuantity: value || 0 } : p));
        setSelectedProducts(updated);
    };

    const columns: ColumnsType = [
        {
            title: t('category.list.index'),
            dataIndex: 'stt',
            align: 'center',
            className: 'text-center',
            width: 60,
            fixed: 'left',
            render: (_: any, __: any, index: number) => index + 1,
            onCell: () => ({ width: 60 }),
            onHeaderCell: () => ({ width: 60 }),
        },
        {
            title: t('sales.product_name'),
            dataIndex: 'productName',
            width: 250,
            onCell: () => ({ style: { width: 250, maxWidth: 250 } }),
            onHeaderCell: () => ({ width: 250 }),
            fixed: 'left',
            ellipsis: true,
            className: 'truncate',
            render: (value: string, record: any) => (
                <div>
                    <Text className="!inline-block !font-semibold whitespace-nowrap truncate" title={value}>
                        {value}
                    </Text>
                    <div className="flex flex-col gap-2 text-xs !font-semibold">
                        {Array.isArray(record?.items) &&
                            record?.items?.length > 0 &&
                            record?.items?.map((item: any) => (
                                <span>
                                    {item.width}m * {item.length}m * {item.multiplier}
                                </span>
                            ))}
                    </div>
                </div>
            ),
        },

        {
            title: t('sales.quantity'),
            dataIndex: 'quantity',
            width: 100,
            align: 'center',
            fixed: 'left',
            onCell: () => ({ style: { width: 100, maxWidth: 100 } }),
            onHeaderCell: () => ({ width: 100 }),
            className: 'truncate',
            render: (value: number) => <Text className="truncate">{InputHelper.formatNumber(value || 0)}</Text>,
        },
        {
            title: (
                <>
                    {t('sales.return_quickrefund')} <span className="text-red-500">*</span>
                </>
            ),
            dataIndex: 'refundQuantity',
            width: 130,
            align: 'left',
            onCell: () => ({ style: { width: 130, maxWidth: 130 } }),
            onHeaderCell: () => ({ width: 130 }),
            className: 'truncate',
            render: (_: any, record: any) => (
                <BaseInputNumber
                    name={`refundQuantity_${record.key}`}
                    label=""
                    value={record.refundQuantity}
                    onChange={value => handleQuantityChange(value as number, record)}
                    min={0}
                    max={record.quantity}
                    placeholder={t('sales.return_quickrefund')}
                    formatter={value => formatNumber(value || 0, 0)}
                    parser={value => value?.replace(RegexValidate.QUANTITY_PARSE_PATTERN, '') || ''}
                    formItemProps={{
                        className: 'w-full',
                    }}
                />
            ),
        },
        {
            title: t('product.add_edit.unit'),
            dataIndex: 'unit',
            width: 100,
            align: 'right',
            onCell: () => ({ style: { width: 100, maxWidth: 100 } }),
            onHeaderCell: () => ({ width: 100 }),
            className: 'truncate',
            render: (value: string) => <Text className="truncate">{value}</Text>,
        },
        {
            title: t('sales.product_weight_item'),
            dataIndex: 'weight',
            width: 130,
            align: 'right',
            onCell: () => ({ style: { width: 130, maxWidth: 130 } }),
            onHeaderCell: () => ({ width: 130 }),
            className: 'truncate',
            render: (value: number) => <Text className="truncate">{InputHelper.formatNumber(value || 0)}</Text>,
        },
        {
            title: t('sales.unit_price'),
            dataIndex: 'sellingPrice',
            width: 130,
            fixed: 'right',
            align: 'right',
            onCell: () => ({ style: { width: 130, maxWidth: 130 } }),
            onHeaderCell: () => ({ width: 130 }),
            className: 'truncate',
            render: (value: number) => <Text className="truncate">{formatMoney(value || 0)}</Text>,
        },
        {
            title: t('sales.actual_price'),
            dataIndex: 'actualPrice',
            width: 150,
            fixed: 'right',
            align: 'right',
            onCell: () => ({ style: { width: 150, maxWidth: 150 } }),
            onHeaderCell: () => ({ width: 150 }),
            className: 'truncate',
            render: (_: any, record: any) => {
                const amount = sellingPriceByItem(
                    {
                        ...record,
                        quantity: record.refundQuantity || 0,
                    },
                    'sale',
                );
                return <Text className="truncate font-semibold">{formatMoney(amount || 0)}</Text>;
            },
        },
    ];

    const totalRefundAmount = selectedProducts.reduce((sum, item) => {
        const amount = sellingPriceByItem(
            {
                ...item,
                quantity: item.refundQuantity || 0,
            },
            'sale',
        );
        return sum + amount;
    }, 0);

    return (
        <Drawer
            title={
                <div className="flex justify-between items-center w-full">
                    <span>{t('sales.return')}</span>
                    <CloseOutlined onClick={onClose} className="cursor-pointer" />
                </div>
            }
            placement="right"
            open={open}
            onClose={onClose}
            maskClosable={false}
            closable={false}
            destroyOnClose
            width={900}
            styles={{
                body: { padding: 16 },
            }}
            style={{ zIndex: 1200 }}
            footer={
                <DrawerFooter
                    applyBtnProps={{ label: t('global.save'), disabled: loading }}
                    onCancel={onClose}
                    cancelBtnProps={{ disabled: false, label: t('global.cancel') }}
                    onOk={() => form.submit()}
                />
            }
        >
            <Form
                name="form-quick-refund"
                layout="vertical"
                rootClassName="relative"
                className="w-full h-full flex flex-col gap-4 bg-white rounded-lg overflow-auto"
                autoComplete="off"
                form={form}
                onFinish={onSubmit}
                preserve
                disabled={false}
                clearOnDestroy
            >
                <div className="grid grid-cols-3 gap-4">
                    <BaseInput name="orderInvoiceCode" label={t('sales.invoice_number')} disabled readOnly className="font-semibold" />
                    <BaseDatePicker
                        name="invoiceDate"
                        label={t('sales.order_date')}
                        className="w-full"
                        format="DD-MM-YYYY HH:mm"
                        disabled
                        formItemProps={{
                            ...convertedDateProps,
                        }}
                    />
                    <BaseDatePicker
                        name="refundDate"
                        label={t('sales.return_date')}
                        className="w-full"
                        format="DD-MM-YYYY HH:mm"
                        allowClear={false}
                        showTime={
                            invoiceDate
                                ? {
                                      disabledTime: getMinMaxDateDisabledTime(invoiceDate) as any,
                                  }
                                : undefined
                        }
                        minDate={invoiceDate ? (invoiceDate as any) : undefined}
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            required: true,
                            ...convertedDateProps,
                        }}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <BaseInput name="customerName" label={t('customer.name')} disabled readOnly />
                    <BaseInput name="customerPhone" label={t('customer.phone')} disabled readOnly />
                    <BaseTextArea name="reason" label={t('sales.return_reason')} placeholder={t('sales.return_reason')} rows={1} />
                </div>

                <div>
                    <label className="font-medium mb-2 block">
                        {t('sales.product_name')} <span className="text-red-500">*</span>
                    </label>
                    <Table
                        columns={columns}
                        dataSource={selectedProducts}
                        pagination={false}
                        size="small"
                        scroll={{ y: 300, x: 'max-content' }}
                        bordered
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
                        <span className="text-base font-medium text-blue-900">{t('sales.total_price')}:</span>
                        <span className="text-xl font-bold text-blue-600">{formatMoney(form.getFieldValue('totalAmount') || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-200">
                        <span className="text-base font-medium text-red-900">{t('sales.total_refund')}:</span>
                        <span className="text-xl font-bold text-red-600">{formatMoney(totalRefundAmount)}</span>
                    </div>
                </div>

                <FormDragger
                    name="attachments"
                    customRequest={customRequest}
                    listType="text"
                    showUploadList
                    formItemProps={{
                        normalize: val => {
                            return val?.fileList?.map((file: any) => ({ ...file, uid: file.uid || file.id })) || [];
                        },
                    }}
                    fileList={attachments.map(attachment => ({
                        ...attachment,
                        uid: attachment.id || attachment.uid || `file-${Date.now()}-${Math.random()}`,
                        name: attachment.name,
                        status: (attachment?.status as any) ?? 'done',
                        url: attachment.path,
                        extension: attachment.extension,
                        lastModified: undefined,
                    }))}
                    onPreview={handlePreview}
                    onRemove={handleRemove}
                    disabled={loading}
                    accept=".xlsx,.xls,.png,.jpg,.jpeg,.pdf,.docx"
                    iconRender={customIconRender}
                />
            </Form>
        </Drawer>
    );
};

export default forwardRef(QuickRefund);

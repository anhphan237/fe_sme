import { apiSearchPaymentMethod } from '@/api/category.api';
import { apiCreateDebtTransactionPayable, apiUpdateDebtTransaction } from '@/api/debt-receivables.api';
import { apiGetFileFromPath, apiUploadFile } from '@/api/file.api';
import { apiSearchUsers } from '@/api/user.api';
import BaseDatePicker from '@/core/components/DatePicker';
import FormDragger, { FormDraggerProps } from '@/core/components/Dragger/FormDragger';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { faFileExcel, faFilePdf, faFileWord, faImage, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Drawer, Form, Modal, Spin } from 'antd';
import { isEmpty } from 'lodash';
import { useState } from 'react';

import DrawerFooter from '@/pages/sales/components/DrawerFooter';

import { notify } from '@/components/toast-message';

import { convertTimeToInput } from '@/utils/format-datetime';
import { FileHelper, updateDebtLocalStorage } from '@/utils/helpers';

import { AppRouters } from '@/constants/router';
import { QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

import { IDebtTransactionAttachment } from '@/interface/debt-receivables';

interface IProps {
    initValue: any;
    onClose: () => void;
    debtDocumentId?: string;
    remainingAmount?: number;
}

const getPositionNames = (user: any) => user.positions?.map((p: any) => p.name || p.positionName || p.id)?.join(', ') || '';

const AddEditTransaction = (props: IProps) => {
    const { initValue, onClose, debtDocumentId, remainingAmount } = props;

    const { t } = useLocale();
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const [form] = Form.useForm();
    const attachments = Form.useWatch<IDebtTransactionAttachment[]>('attachments', { form, preserve: true }) || [];
    const [loading, setLoading] = useState(false);
    const isEdit = !!initValue?.isEdit;
    const isAddNew = isEmpty(initValue) || !initValue?.isEdit;
    const generateAttachmentPath = () => {
        if (isEdit) {
            const firstPath = attachments?.[0]?.path?.split('/')?.slice(-1)?.join('/');
            if (firstPath) {
                return `${AppRouters.DEBT_PAYABLE_TRANSACTION}/Attachments/${firstPath}`;
            } else {
                return `${AppRouters.DEBT_PAYABLE_TRANSACTION}/Attachments/${new Date().getTime()}`;
            }
        }
        return `${AppRouters.DEBT_PAYABLE_TRANSACTION}/Attachments/${new Date().getTime()}`;
    };

    const onSubmit = async () => {
        const values = await form.validateFields();

        const params = {
            ...(isEdit && {
                id: initValue?.id,
                debtTransactionId: initValue?.id,
                isDebtPayable: true,
            }),
            ...values,
            transactionType: 0,
            debtDocumentId,
            ...(isEdit
                ? {
                      transactionDate: values.transactionDate,
                  }
                : {
                      paymentMethodCode: values.paymentMethodCode,
                      amount: values.amount,
                      description: values.description,
                      attachments:
                          attachments?.map((item: any) => {
                              const {
                                  id,
                                  uid,
                                  lastModifiedDate,
                                  originFileObj,
                                  status,
                                  percent,
                                  size,
                                  type,
                                  lastModified,
                                  debtTransactionId,
                                  created,
                                  ...rest
                              } = item;
                              return rest;
                          }) ?? [],
                  }),
        };

        const res = isEdit ? await apiUpdateDebtTransaction(params) : await apiCreateDebtTransactionPayable([params]);

        if (res.succeeded) {
            notify.success(isEdit ? t('message.update_success') : t('message.add_success'));

            if (isAddNew) {
                updateDebtLocalStorage(debtDocumentId!, values.amount);
            }

            onClose();
        } else {
            notify.error(t('message.failed'));
        }
    };

    const customRequest = async (options: any) => {
        const { file, onSuccess, onError } = options;
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            const response = await apiUploadFile(formData, generateAttachmentPath(), { override: true });
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
                    quotationIssueId: 'detailId',
                    name: file.name,
                    description: file.type,
                    extension: file.name.split('.').pop() || '',
                    path: response.data.filePath,
                    status: 'done',
                });
            }
            notify.success(t('global.message.success'));
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
            notify.error(t('global.message.export_failed'));
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

    const handleConfirmSubmit = () => {
        Modal.confirm({
            title: t('finance_accounting.debt_transaction.confirm_save'),
            content: t('finance_accounting.debt_transaction.confirm_save_content'),
            okText: t('global.confirm'),
            cancelText: t('global.cancel'),
            onOk: async () => {
                await onSubmit();
            },
        });
    };

    return (
        <>
            <Drawer
                title={
                    isEdit ? (
                        <div className="flex justify-between">{t('finance_accounting.debt_transaction.update')}</div>
                    ) : (
                        t('finance_accounting.debt_transaction.add')
                    )
                }
                placement="right"
                open={!!initValue}
                onClose={onClose}
                closable={false}
                maskClosable={false}
                destroyOnClose
                width={550}
                styles={{
                    body: { padding: 16 },
                }}
                style={{ zIndex: 1200 }}
                footer={
                    <DrawerFooter
                        applyBtnProps={{ label: t('global.save'), disabled: initValue?.status !== QUOTATION_TARGET_STATUS.DRAFT && isEdit }}
                        onCancel={onClose}
                        onOk={handleConfirmSubmit}
                    />
                }
            >
                <Form
                    name="form-transaction"
                    layout="vertical"
                    rootClassName="relative"
                    className="w-full h-[calc(100vh_-_94px)] flex flex-col gap-4 bg-white rounded-lg overflow-auto"
                    autoComplete="off"
                    form={form}
                    disabled={initValue?.status !== QUOTATION_TARGET_STATUS.DRAFT && isEdit}
                    initialValues={{
                        ...initValue,
                        transactionDate: initValue?.transactionDate ? convertTimeToInput(initValue?.transactionDate) : null,
                        remainingAmount: remainingAmount,
                        personInCharge: initValue?.personInCharge || {
                            userId: currentUser?.id,
                            userName: currentUser?.fullName,
                            userCode: currentUser?.code,
                            userPhone: currentUser?.phoneNumber,
                            userPosition: getPositionNames(currentUser),
                        },
                    }}
                    preserve
                    clearOnDestroy
                >
                    <BaseDatePicker
                        name="transactionDate"
                        label={t('finance_accounting.implementation_date')}
                        className="w-full"
                        showTime
                        format="DD-MM-YYYY HH:mm"
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                    />
                    <InfiniteScrollSelect
                        name={['personInCharge', 'userId']}
                        queryKey={['getUserForTransaction']}
                        label={t('finance_accounting.payment_slip.requester')}
                        placeholder={t('finance_accounting.payment_slip.requester')}
                        labelRender={item => item?.label ?? form.getFieldValue(['personInCharge', 'userName'])}
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            required: true,
                        }}
                        disabled={isEdit}
                        showSearch
                        mapData={(data: any[]) =>
                            data.map(user => ({
                                key: user.id,
                                value: user.id,
                                label: user.fullName,
                                ...user,
                                positionNames: getPositionNames(user),
                            }))
                        }
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchUsers(pageNumber, pageSize, search);
                            return resp.data;
                        }}
                        onChange={(value, option: any) => {
                            form.setFieldValue(['personInCharge'], {
                                userId: value,
                                userName: option?.label || option?.fullName,
                                userCode: option?.code,
                                userPhone: option?.phoneNumber,
                                userPosition: option?.positionNames || '',
                            });
                        }}
                    />
                    <BaseInput name={['personInCharge', 'userCode']} formItemProps={{ className: 'hidden' }} />
                    <BaseInput name={['personInCharge', 'userName']} formItemProps={{ className: 'hidden' }} />
                    <BaseInput name={['personInCharge', 'userPhone']} formItemProps={{ className: 'hidden' }} />
                    <BaseInput name={['personInCharge', 'userPosition']} formItemProps={{ className: 'hidden' }} />
                    <InfiniteScrollSelect
                        name="paymentMethodCode"
                        queryKey={['getPaymentMethodForPay']}
                        label={t('finance_accounting.transaction_type')}
                        placeholder={t('finance_accounting.transaction_type')}
                        labelRender={item => item?.label ?? form.getFieldValue('paymentMethodName')}
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                            required: true,
                        }}
                        disabled={isEdit}
                        showSearch
                        mapData={(data: any[]) =>
                            data.map((item: any) => ({
                                key: item.code,
                                ...item,
                                label: item.name || item.paymentMethodName,
                                value: item.code,
                            }))
                        }
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchPaymentMethod({ pageNumber, pageSize, search }, { loading: false });
                            return resp.data;
                        }}
                    />
                    <BaseInputNumber
                        isMoneyFormat
                        name="remainingAmount"
                        label={t('finance_accounting.payables.owedAmount')}
                        placeholder={t('finance_accounting.payables.owedAmount')}
                        disabled
                    />
                    <BaseInputNumber
                        isMoneyFormat
                        name="amount"
                        label={t('finance_accounting.amount')}
                        placeholder={t('finance_accounting.amount')}
                        disabled={isEdit}
                        min={1}
                        max={remainingAmount}
                        formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }] }}
                    />
                    <BaseTextArea
                        name="description"
                        label={t('finance_accounting.content')}
                        placeholder={t('finance_accounting.content')}
                        disabled={isEdit}
                    />
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
                            uid: attachment.id,
                            name: attachment.name,
                            status: attachment?.status ?? 'done',
                            url: attachment.path,
                            extension: attachment.extension,
                            lastModified: undefined,
                        }))}
                        onPreview={handlePreview}
                        onRemove={handleRemove}
                        disabled={isEdit || loading}
                        accept=".xlsx,.xls,.png,.jpg,.jpeg,.pdf,.docx"
                        iconRender={customIconRender}
                    />
                </Form>
            </Drawer>
        </>
    );
};

export default AddEditTransaction;

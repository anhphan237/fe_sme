import { apiSearchPaymentMethod } from '@/api/category.api';
import { apiCreateDebtTransactionPayable } from '@/api/debt-receivables.api';
import { apiSearchUsers } from '@/api/user.api';
import BaseDatePicker from '@/core/components/DatePicker';
import DividerLabel from '@/core/components/Divider/DividerLabel';
import BaseInput from '@/core/components/Input/InputWithLabel';
import InfiniteScrollSelect from '@/core/components/Select/InfinitieScroll';
import BaseTextArea from '@/core/components/TextArea/BaseTextArea';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { Drawer, Form, Modal } from 'antd';
import { useState } from 'react';

import DrawerFooter from '@/pages/sales/components/DrawerFooter';

import BulkPaymentTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { formatMoney, handleCommonError } from '@/utils/helpers';

import type { IDebtTransactionAttachment } from '@/interface/debt-receivables';

const { Column } = BulkPaymentTable;

interface ColumnType {
    id: string;
    documentNumber: string;
    supplierName?: string;
    remainingAmount: number;
}

interface IProps {
    open: boolean;
    selectedRecords: ColumnType[];
    onClose: () => void;
    onSuccess: () => void;
}

const BulkPaymentModal = ({ open, selectedRecords, onClose, onSuccess }: IProps) => {
    const { t } = useLocale();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const attachments = Form.useWatch<IDebtTransactionAttachment[]>('attachments', { form, preserve: true }) || [];
    const getPositionNames = (user: any) => user.positions?.map((p: any) => p.name || p.positionName || p.id)?.join(', ') || '';
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};

    const totalAmount = selectedRecords.reduce((sum, record) => sum + (record.remainingAmount || 0), 0);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const transactionRequests = selectedRecords.map(record => ({
                debtDocumentId: record.id,
                transactionDate: values.transactionDate.toISOString(),
                transactionType: 0,
                amount: record.remainingAmount,
                description: values.description || `Thanh toán cho ${record.documentNumber}`,
                paymentMethodCode: values.paymentMethodCode,
                personInCharge: values.personInCharge,
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
            }));

            const result = await apiCreateDebtTransactionPayable(transactionRequests);

            if (result?.succeeded) {
                notify.success(`${t('finance_accounting.debt_transaction.success')} ${transactionRequests.length} ${t('Invoice')}`);
                form.resetFields();
                onSuccess();
                onClose();
            } else {
                notify.error(t('message.failed'));
            }
        } catch (error: any) {
            handleCommonError(error, t);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    const handleConfirmSubmit = () => {
        Modal.confirm({
            title: t('finance_accounting.debt_transaction.confirm_save'),
            content: t('finance_accounting.debt_transaction.confirm_save_content'),
            okText: t('global.confirm'),
            cancelText: t('global.cancel'),
            onOk: async () => {
                await handleSubmit();
            },
        });
    };

    return (
        <Drawer
            title={t('finance_accounting.debt_transaction.add')}
            placement="right"
            open={open}
            onClose={handleCancel}
            closable={false}
            maskClosable={false}
            destroyOnClose
            width={650}
            styles={{
                body: { padding: 16 },
            }}
            style={{ zIndex: 1200 }}
            footer={
                <DrawerFooter
                    applyBtnProps={{
                        label: t('global.save'),
                        loading: loading,
                    }}
                    onCancel={handleCancel}
                    onOk={handleConfirmSubmit}
                />
            }
        >
            <div className="h-full overflow-auto">
                <div className="mb-4">
                    <h3 className="font-semibold mb-3 mx-4">
                        {t('finance_accounting.receivables')} ({selectedRecords.length} {t('Invoice')})
                    </h3>

                    <BulkPaymentTable<ColumnType>
                        dataSource={selectedRecords}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ y: 250 }}
                        wrapClassName="!h-auto"
                    >
                        <Column
                            title={<div className="text-center">{t('category.list.index')}</div>}
                            dataIndex="index"
                            width={50}
                            align="center"
                            key="index"
                            render={(_, __, index: number) => <div className="flex items-center justify-center">{index + 1}</div>}
                        />
                        <Column
                            title={t('finance_accounting.receivables.documentNumber')}
                            dataIndex="documentNumber"
                            key="documentNumber"
                            width={120}
                            align="center"
                            render={(value: string) => <span className="font-medium text-blue-600">{value}</span>}
                        />
                        <Column
                            title={t('finance_accounting.receivables.customerName')}
                            dataIndex="supplierName"
                            key="supplierName"
                            width={120}
                            ellipsis
                            render={(value: string) => value || '-'}
                        />
                        <Column
                            title={t('finance_accounting.owed')}
                            dataIndex="remainingAmount"
                            key="remainingAmount"
                            align="right"
                            width={130}
                            render={(value: number) => <span className="font-medium ">{formatMoney(value)}</span>}
                        />
                    </BulkPaymentTable>

                    <div className="flex justify-end items-center text-base mx-2 mt-2">
                        <span className="mr-2">{t('sales.total_price')}:</span>
                        <span className="font-bold text-lg text-green-600">{formatMoney(totalAmount)}</span>
                    </div>
                </div>

                <DividerLabel label={t('sales.payment_info')} />

                <Form
                    name="form-transaction"
                    form={form}
                    layout="vertical"
                    rootClassName="relative"
                    className="w-full flex flex-col gap-4 bg-white rounded-lg mt-2"
                    initialValues={{
                        transactionDate: null,
                        personInCharge: {
                            userId: currentUser?.id,
                            userName: currentUser?.fullName,
                            userCode: currentUser?.code,
                            userPhone: currentUser?.phoneNumber,
                            userPosition: getPositionNames(currentUser),
                        },
                    }}
                >
                    <BaseDatePicker
                        name="transactionDate"
                        label={t('finance_accounting.implementation_date')}
                        className="w-full"
                        showTime
                        format="DD-MM-YYYY HH:mm"
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                        }}
                    />

                    <InfiniteScrollSelect
                        name="paymentMethodCode"
                        label={t('finance_accounting.transaction_type')}
                        placeholder={t('finance_accounting.transaction_type')}
                        formItemProps={{
                            rules: [{ required: true, message: t('global.message.required_field') }],
                        }}
                        showSearch
                        mapData={(data: any[]) =>
                            data.map((item: any) => ({
                                key: item.code,
                                label: item.name,
                                value: item.code,
                            }))
                        }
                        fetchData={async ({ pageNumber, pageSize, search }) => {
                            const resp = await apiSearchPaymentMethod({ pageNumber, pageSize, search }, { loading: false });
                            return resp.data;
                        }}
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

                    <BaseTextArea name="description" label={t('finance_accounting.content')} placeholder={t('finance_accounting.content')} rows={1} />
                </Form>
            </div>
        </Drawer>
    );
};

export default BulkPaymentModal;

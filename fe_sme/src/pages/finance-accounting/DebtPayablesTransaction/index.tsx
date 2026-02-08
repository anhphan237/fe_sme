import { apiDeleteDebtTransactionPayable, apiSearchDebtTransactionsPayable } from '@/api/debt-receivables.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters, DefaultMappingPermission, DefaultRoles } from '@/constants';
import PaymentTag from '@/core/components/Status/PaymentTag';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { IDebtInfoLocalStorageValue } from '@/types';
import { DeleteOutlined, LeftOutlined } from '@ant-design/icons';
import { faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Popconfirm } from 'antd';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';
import DateRangeFilter from '@/components/custom-range-picker';
import Search from '@/components/search';
import DebtPayablesTransactionTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { formatMoney, getDebtInfoLocalStorage, updateDebtLocalStorage } from '@/utils/helpers';

import { IDebtTransaction } from '@/interface/debt-receivables';

import AddEditTransaction from './AddEditTransaction';

const { Column } = DebtPayablesTransactionTable;

const DebtPayablesTransaction = () => {
    const { id: debtDocumentId } = useParams<{ id?: string }>();
    const { t } = useLocale();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation();
    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        debtDocumentId,
    });
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    const isAdmin = currentUser?.roles?.some(role => role.code === DefaultRoles.ADMIN || role.code === DefaultRoles.SUPER_ADMIN) ?? false;

    const [open, setOpen] = useState<any>(null);
    const [debtInfo, setDebtInfo] = useState<IDebtInfoLocalStorageValue>({ remainingAmount: 0, paidAmount: 0, totalAmount: 0 });
    const [documentNumber, setDocumentNumber] = useState<string>('');
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.DEBT_DETAIL_TRANSACTION]) && debtInfo.remainingAmount > 0;

    const status = useMemo(() => {
        if (debtInfo.paidAmount === 0) return 0;
        if (debtInfo.remainingAmount <= 0) return 2;
        return 1;
    }, [debtInfo]);

    const { data, refetch, isFetching } = useQuery({
        queryKey: ['getListDebtTransactionTransaction', filter],
        queryFn: async () => {
            const res = await apiSearchDebtTransactionsPayable(filter, { loading: false });
            return res;
        },
        enabled: !!debtDocumentId,
    });

    useEffect(() => {
        if (!debtDocumentId) return;

        const stateCustomerName = (location.state as any)?.customerName;
        const stateDocumentNumber = (location.state as any)?.documentNumber;

        const debtInfo = getDebtInfoLocalStorage(debtDocumentId);
        const localCustomerName = debtInfo?.customerName;
        const localDocumentNumber = debtInfo?.documentNumber;
        const customerName = stateCustomerName || localCustomerName || '';
        const documentNumber = stateDocumentNumber || localDocumentNumber || '';
        setDocumentNumber(documentNumber);
        dispatch(
            setBreadCrumbs({
                [debtDocumentId]: customerName ? ` ${customerName}` : t('finance_accounting.debt_tracking_payable.update'),
                transaction: t('finance_accounting.debt_tracking_payable.history'),
            }),
        );
        handleGetDebtInfo(debtDocumentId);
        const handleUpdate = () => handleGetDebtInfo(debtDocumentId);
        window.addEventListener('localDebtChange', () => handleGetDebtInfo(debtDocumentId));
        return () => window.removeEventListener('localDebtChange', handleUpdate);
    }, [debtDocumentId, location.state]);

    const handleGetDebtInfo = (debtDocumentId: string) => {
        const newDebtInfo = getDebtInfoLocalStorage(debtDocumentId);
        if (newDebtInfo) setDebtInfo(newDebtInfo);
    };

    const handleDelete = async (record: IDebtTransaction) => {
        const res = await apiDeleteDebtTransactionPayable(record.id);
        if (res.succeeded) {
            notify.success(t('message.delete_success'));
            updateDebtLocalStorage(debtDocumentId!, -record.amount);
            refetch();
        } else notify.error(t('message.delete_failed'));
    };
    const handleEdit = (record: IDebtTransaction) => {
        setOpen({
            ...record,
            isEdit: true,
        });
    };
    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between flex-wrap mx-2 gap-2">
                <div className="flex gap-2 items-center">
                    <BaseButton type="primary" label={t('global.back')} icon={<LeftOutlined />} onClick={() => navigate(-1)} />

                    {isFullPermission && (
                        <BaseButton icon={<FontAwesomeIcon icon={faPlus} size="lg" />} onClick={() => setOpen({})} label={t('Add new')} />
                    )}
                    {documentNumber && (
                        <span className="text-base font-medium">
                            <span className="text-gray-600">{t('sales.purchase_number')}:</span>{' '}
                            <span className="text-blue-600">{documentNumber}</span>
                        </span>
                    )}
                </div>
                <div className="flex gap-2 w-1/2 justify-end">
                    <DateRangeFilter
                        onChange={({ fromDate, toDate }) => {
                            setFilter({
                                ...filter,
                                pageNumber: 1,
                                filter: {
                                    ...filter.filter,
                                    ...(fromDate ? { range: { from: fromDate.toISOString(), to: toDate?.toISOString() } } : { range: undefined }),
                                },
                            });
                        }}
                    />
                    <Search
                        placeholder={t('global.search_table')}
                        allowClear
                        className="btn-search-table"
                        onSearch={value => {
                            setFilter({ ...filter, pageNumber: 1, filter: { searchValue: value } });
                        }}
                    />
                </div>
            </div>
            <div className="flex justify-end gap-12 text-lg p-2">
                <span>
                    {`${t('finance_accounting.payment_slip.totalAmount')}: `}
                    <strong
                        className={clsx({
                            'text-green-600': debtInfo?.totalAmount! > 0,
                            'text-red-600': debtInfo?.totalAmount! < 0,
                        })}
                    >
                        {formatMoney(debtInfo.totalAmount!)}
                    </strong>
                </span>
                <span>
                    {`${t('finance_accounting.payment_slip.status.paid')}: `}
                    <strong
                        className={clsx({
                            'text-green-600': debtInfo?.paidAmount! > 0,
                            'text-red-600': debtInfo?.paidAmount! < 0,
                        })}
                    >
                        {formatMoney(debtInfo.paidAmount!)}
                    </strong>
                </span>
                <span>
                    {`${t('finance_accounting.payables.owedAmount')}: `}
                    <strong
                        className={clsx({
                            'text-green-600': debtInfo?.remainingAmount! > 0,
                            'text-red-600': debtInfo?.remainingAmount! < 0,
                        })}
                    >
                        {formatMoney(debtInfo.remainingAmount!)}
                    </strong>
                </span>
                <PaymentTag value={status} />
            </div>
            <DebtPayablesTransactionTable<IDebtTransaction>
                dataSource={data?.data || []}
                rowKey={record => record.id}
                loading={isFetching}
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: data?.totalItems,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
            >
                <Column
                    title={<div className="flex justify-center items-center">{t('category.list.index')}</div>}
                    dataIndex="index"
                    fixed="left"
                    onCell={() => ({ width: 50 })}
                    onHeaderCell={() => ({ style: { width: 50, minWidth: 50 } })}
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('finance_accounting.implementation_date')}
                    dataIndex="transactionDate"
                    fixed="left"
                    ellipsis
                    onCell={() => ({ width: 200 })}
                    onHeaderCell={() => ({ style: { width: 200, minWidth: 200 } })}
                    key="transactionDate"
                    render={(_, record: IDebtTransaction) => formatDateTime(record?.transactionDate)}
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 250 })}
                    onHeaderCell={() => ({ style: { width: 250, minWidth: 250 } })}
                    title={t('customer.person_in_charge')}
                    dataIndex="personInCharge"
                    key="personInCharge"
                    render={(_, record: IDebtTransaction) => record.personInCharge?.userName || '-'}
                />
                <Column
                    ellipsis
                    onCell={() => ({ width: 180 })}
                    onHeaderCell={() => ({ style: { width: 180, minWidth: 180 } })}
                    title={t('finance_accounting.transaction_type')}
                    dataIndex="paymentMethodName"
                    key="paymentMethodName"
                />
                <Column
                    title={t('finance_accounting.amount')}
                    ellipsis
                    onCell={() => ({ width: 170 })}
                    onHeaderCell={() => ({ style: { width: 170, minWidth: 170 } })}
                    align="left"
                    dataIndex="amount"
                    key="amount"
                    render={(_, record: IDebtTransaction) => formatMoney(record?.amount)}
                />
                <Column
                    title={t('finance_accounting.content')}
                    ellipsis
                    onCell={() => ({ width: 250 })}
                    onHeaderCell={() => ({ style: { width: 250, minWidth: 250 } })}
                    align="left"
                    dataIndex="description"
                    key="description"
                />
                {(isFullPermission || isAdmin) && (
                    <Column
                        ellipsis
                        fixed="right"
                        width={80}
                        onCell={() => ({ width: 80 })}
                        onHeaderCell={() => ({ style: { width: 80, minWidth: 80 } })}
                        align="center"
                        dataIndex="action"
                        key="action"
                        render={(_, record: IDebtTransaction) => (
                            <div className="flex gap-4 justify-center">
                                {isAdmin && <FontAwesomeIcon icon={faEdit} className="cursor-pointer " onClick={() => handleEdit(record)} />}
                                {isFullPermission && (
                                    <Popconfirm
                                        title={t('global.popup.confirm_delete')}
                                        onConfirm={() => handleDelete(record)}
                                        okText={t('global.popup.ok')}
                                        cancelText={t('global.popup.reject')}
                                        placement="left"
                                    >
                                        <DeleteOutlined className="cursor-pointer text-red-600 flex gap-1" />
                                    </Popconfirm>
                                )}
                            </div>
                        )}
                    />
                )}
            </DebtPayablesTransactionTable>
            {!!open && debtDocumentId && (
                <AddEditTransaction
                    initValue={open}
                    onClose={() => {
                        setOpen(null);
                        refetch();
                    }}
                    debtDocumentId={debtDocumentId}
                    remainingAmount={debtInfo.remainingAmount}
                />
            )}
        </div>
    );
};

export default DebtPayablesTransaction;

import { apiSearchDebtPayablesBySupplierId } from '@/api/finance-accounting.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import ExportModal, { ExportModalRef } from '@/core/components/FileManager/ExportModal';
import PaymentTag, { COMMON_STATUS } from '@/core/components/Status/PaymentTag';
import { useLocale } from '@/i18n';
import { faDownload, faMoneyBillTransfer } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';
import DateRangeFilter from '@/components/custom-range-picker';
import Search from '@/components/search';
import ReceivablesTable from '@/components/table';
import { notify } from '@/components/toast-message';

import { setBreadCrumbs } from '@/stores/global.store';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { FileHelper, formatMoney, saveDebtInfoLocalStorage } from '@/utils/helpers';

import { QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

import BulkPaymentModal from './BulkPaymentModal';

const { Column } = ReceivablesTable;

interface ColumnType {
    id: string;
    supplierId: string;
    supplierName?: string;
    supplierTypeName?: string;
    documentNumber: string;
    documentDate: string;
    purchaseId?: string;
    purchaseCode?: string;
    status?: string;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
}

const DebtPayableSupplier = () => {
    const { t } = useLocale();
    const navigate = useNavigate();
    const { id: supplierId } = useParams<{ id?: string }>();
    const [selectedRows, setSelectedRows] = useState<ColumnType[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const exportRef = useRef<ExportModalRef>(null);
    const canExport = useCheckIsFullPermission(DefaultMappingPermission['FinanceReport']);
    const dispatch = useDispatch();
    const location = useLocation();
    const receivedType = location.state?.type;

    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        Type: receivedType,
        filter: { searchValue: '' },
        filters: [{ key: 'status', value: [COMMON_STATUS.PENDING, COMMON_STATUS.PROCESSING] }],
    });

    const { data, refetch } = useQuery({
        queryKey: ['getListDebtPayablesSupplier', filter, supplierId],
        queryFn: async () => {
            const res = await apiSearchDebtPayablesBySupplierId({
                ...filter,
                supplierId,
            });
            return res;
        },
    });

    useEffect(() => {
        if (!supplierId) return;
        dispatch(
            setBreadCrumbs({
                [supplierId]: t('finance_accounting.payables.detail'),
            }),
        );
    }, [supplierId]);

    const handleStatusChange = (values: number[]) => {
        setFilter({
            ...filter,
            pageNumber: 1,
            filters: values.length ? [{ key: 'status', value: values }] : undefined,
        });
    };

    const statusOptions = [
        { label: t('sales.status.pending'), value: COMMON_STATUS.PENDING },
        { label: t('sales.status.inprogress'), value: COMMON_STATUS.PROCESSING },
        { label: t('sales.status.paid'), value: COMMON_STATUS.PROCESSED },
        { label: t('global.status.cancelled'), value: COMMON_STATUS.CANCELLED },
    ];

    const handleExportDebt = async () => {
        try {
            const response = await exportRef.current?.open(statusOptions);

            FileHelper.downloadFileFromResponse(response as any);
            notify.success(t('global.message.export_success'));
        } catch {}
    };

    const rowSelection: TableRowSelection<ColumnType> = {
        type: 'checkbox',
        selectedRowKeys: selectedRows.map(item => item.id),
        onChange: (selectedRowKeys, selectedRecords) => {
            setSelectedRows(selectedRecords);
        },
        getCheckboxProps: record => ({
            disabled: Number(record.status) === COMMON_STATUS.PROCESSED || Number(record.status) === COMMON_STATUS.CANCELLED,
        }),
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4 mx-2">
                <div className="flex gap-2">
                    <BaseButton
                        type="primary"
                        label="sales.pay"
                        icon={<FontAwesomeIcon icon={faMoneyBillTransfer} />}
                        onClick={() => setIsPaymentModalOpen(true)}
                        disabled={selectedRows.length <= 1}
                    />

                    <BaseButton
                        onClick={handleExportDebt}
                        label={t('export.title')}
                        icon={<FontAwesomeIcon icon={faDownload} />}
                        disabled={!canExport}
                    />
                </div>

                <div className="flex flex-row gap-2 justify-end">
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

                    <Select
                        mode="multiple"
                        className="w-52 min-w-52"
                        maxTagCount="responsive"
                        placeholder={t('sales.invoice_status')}
                        value={(filter.filters?.find(f => f.key === 'status')?.value as number[]) || []}
                        onChange={handleStatusChange}
                        options={statusOptions}
                        allowClear
                        showSearch={false}
                    />

                    <Search
                        placeholder={t('global.search_table')}
                        allowClear
                        className="btn-search-table"
                        onSearch={value =>
                            setFilter({
                                ...filter,
                                pageNumber: 1,
                                filter: { ...filter.filter, searchValue: value },
                            })
                        }
                    />
                </div>
            </div>

            <div className="flex justify-end text-lg mx-2 mb-2">
                <span>
                    {`${t('finance_accounting.payables.owedAmount')}: `}
                    <strong className="text-green-600">{formatMoney(data?.totalMoney || 0)}</strong>
                </span>
            </div>
            <ReceivablesTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record.id}
                rowSelection={rowSelection}
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
                    width={30}
                    fixed="left"
                    minWidth={30}
                    key="index"
                    ellipsis
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('sales.purchase_number')}
                    dataIndex="documentNumber"
                    width={100}
                    minWidth={100}
                    fixed="left"
                    align="center"
                    key="documentNumber"
                    ellipsis
                    render={(_, record: ColumnType) => {
                        const isDisabled = Number(record?.status) === QUOTATION_TARGET_STATUS.CANCELLED;

                        return (
                            <div
                                className={`font-medium ${isDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 cursor-pointer'}`}
                                onClick={() => {
                                    if (isDisabled) return;

                                    saveDebtInfoLocalStorage(
                                        {
                                            totalAmount: record.totalAmount,
                                            paidAmount: record.paidAmount,
                                            remainingAmount: record.remainingAmount,
                                        },
                                        record.id,
                                        record.supplierName,
                                        record.documentNumber,
                                    );

                                    navigate(`${AppRouters.DEBT_PAYABLE_TRANSACTION}/${record.id}`, {
                                        state: { supplierName: record.supplierName, documentNumber: record.documentNumber },
                                    });
                                }}
                            >
                                {record?.documentNumber}
                            </div>
                        );
                    }}
                />
                <Column
                    title={t('sales.purchase_date')}
                    width={130}
                    minWidth={100}
                    align="center"
                    fixed="left"
                    dataIndex="documentDate"
                    key="documentDate"
                    ellipsis
                    render={(_, record: ColumnType) => formatDateTime(record?.documentDate, 'DD-MM-YYYY')}
                />
                {/* <Column
                    title={t('finance_accounting.payables.purchaseNumber')}
                    width={100}
                    minWidth={100}
                    fixed="left"
                    align="center"
                    dataIndex="purchaseCode"
                    key="purchaseCode"
                    ellipsis
                    render={(_, record: ColumnType) => (
                        <span
                            className="text-blue-500 font-medium hover:underline cursor-pointer"
                            onClick={() => navigate(`${AppRouters.PURCHASE_ORDERS}/${record.purchaseId}`)}
                        >
                            {record?.purchaseCode || '-'}
                        </span>
                    )}
                /> */}
                <Column
                    title={t('finance_accounting.partner')}
                    width={200}
                    minWidth={200}
                    align="left"
                    dataIndex="supplierName"
                    key="supplierName"
                    ellipsis
                    render={(_, record: ColumnType) => (
                        <span
                            className="text-blue-500 font-medium hover:underline cursor-pointer"
                            // onClick={() => {
                            //     const targetRoute =
                            //         receivedType === 0
                            //             ? `${AppRouters.CUSTOMER_INFO}/${record.supplierId}`
                            //             : `${AppRouters.SUPPLIER_INFO}/${record.supplierId}`;

                            //     navigate(targetRoute);
                            // }}
                        >
                            {record?.supplierName || '-'}
                        </span>
                    )}
                />
                <Column
                    title={t('finance_accounting.payables.totalAmount')}
                    ellipsis
                    width={100}
                    minWidth={100}
                    dataIndex="totalAmount"
                    align="right"
                    key="totalAmount"
                    render={(_, record: ColumnType) => formatMoney(record?.totalAmount)}
                />
                <Column
                    title={t('finance_accounting.payables.paidAmount')}
                    ellipsis
                    width={120}
                    minWidth={120}
                    dataIndex="paidAmount"
                    align="right"
                    key="paidAmount"
                    render={(_, record: ColumnType) => formatMoney(record?.paidAmount)}
                />
                <Column
                    title={t('finance_accounting.payables.owedAmount')}
                    ellipsis
                    width={100}
                    minWidth={100}
                    dataIndex="remainingAmount"
                    align="right"
                    key="remainingAmount"
                    render={(_, record: ColumnType) => (
                        <span className="text-green-600 font-semibold" style={{ color: (record?.remainingAmount ?? 0) < 0 ? 'red' : undefined }}>
                            {formatMoney(record?.remainingAmount ?? 0)}
                        </span>
                    )}
                />
                <Column
                    title={t('finance_accounting.payables.status')}
                    dataIndex="status"
                    key="status"
                    align="center"
                    fixed="right"
                    width={50}
                    minWidth={50}
                    ellipsis
                    render={value => <PaymentTag value={value} className="!inline-block !text-xs w-full !text-center min-w-[50px]" />}
                />
            </ReceivablesTable>
            <BulkPaymentModal
                open={isPaymentModalOpen}
                selectedRecords={selectedRows}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                }}
                onSuccess={() => {
                    setSelectedRows([]);
                    refetch();
                }}
            />
            <ExportModal
                ref={exportRef}
                submitLabel={t('global.download')}
                title={t('export.title')}
                urlPath="debt-payable-supplier"
                additionalParams={{ supplierId }}
            />
        </div>
    );
};

export default DebtPayableSupplier;

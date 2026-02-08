import { apiSearchPurchaseInvoice } from '@/api/purchase-invoice.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import ExportModal, { ExportModalRef } from '@/core/components/FileManager/ExportModal';
import InvoiceTag from '@/core/components/Status/InvoiceTag';
import { COMMON_STATUS } from '@/core/components/Status/PaymentTag';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { faDownload, faHistory } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Select, Typography } from 'antd';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import DateRangeFilter from '@/components/custom-range-picker';
import Search from '@/components/search';
import InvoiceTable from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { FileHelper, formatMoney, formatNumber, isAdmin, saveDebtInfoLocalStorage } from '@/utils/helpers';

import { QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

const { Column } = InvoiceTable;
const { Text } = Typography;

interface ColumnType {
    id: string;
    code: string;
    purchaseId: string;
    purchaseCode: string;
    purchaseDate: string;
    totalQuantity: number;
    totalAmount: number;
    totalAmountPaid: number;
    totalAmountRefunded: number;
    remainingAmount?: number;
    status: QUOTATION_TARGET_STATUS;
    description?: string;
    debtDocumentId?: string;
    supplier: {
        supplierCode: string;
        supplierShortName: string;
        supplierName: string;
        supplierPhone: string;
        supplierAddress?: string;
        supplierTaxCode?: string;
        supplierContactPerson?: string;
        supplierContactPersonPhone?: string;
    };
    personInCharge: {
        userName: string;
    };
}

const PurchaseInvoice = () => {
    const { t } = useLocale();
    const navigate = useNavigate();
    const canExport = useCheckIsFullPermission(DefaultMappingPermission['ExportInvoice']);
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.PURCHASE_INVOICE]);
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};
    // const isadminLTBMA = isAdmin(currentUser);
    const exportRef = useRef<ExportModalRef>(null);

    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
        range: {
            from: undefined,
            to: undefined,
        },
        filters: [{ key: 'status', value: [COMMON_STATUS.PENDING, COMMON_STATUS.PROCESSING] }],
    });

    const { data } = useQuery({
        queryKey: ['getListPurchaseInvoice', filter],
        queryFn: async () => {
            const cleanFilter = { ...filter };
            if (!cleanFilter.range?.from || !cleanFilter.range?.to) {
                delete cleanFilter.range;
            }
            const res = await apiSearchPurchaseInvoice(cleanFilter);
            return res;
        },
    });

    const handleExportReport = async () => {
        try {
            const response = await exportRef.current?.open([
                { value: COMMON_STATUS.PENDING, label: t('sales.status.quote') },
                { value: COMMON_STATUS.PROCESSING, label: t('sales.status.inprogress') },
                { value: COMMON_STATUS.PROCESSED, label: t('sales.status.paid') },
            ]);
            FileHelper.downloadFileFromResponse(response as any);
            notify.success(t('global.message.export_success'));
        } catch {}
    };

    const handleStatusChange = (values: number[]) => {
        setFilter(prev => ({
            ...prev,
            pageNumber: 1,
            filters: values.length ? [{ key: 'status', value: values }] : undefined,
        }));
    };

    const statusOptions = [
        { label: t('sales.status.quote'), value: COMMON_STATUS.PENDING },
        { label: t('sales.status.inprogress'), value: COMMON_STATUS.PROCESSING },
        { label: t('sales.status.paid'), value: COMMON_STATUS.PROCESSED },
        { label: t('global.status.cancelled'), value: COMMON_STATUS.CANCELLED },
    ];

    return (
        <div className="h-full flex flex-col p-4 px-8">
            <div className="flex justify-between mb-2 gap-2">
                <BaseButton
                    onClick={handleExportReport}
                    label={t('export.title')}
                    icon={<FontAwesomeIcon icon={faDownload} />}
                    disabled={!canExport}
                />
                <div className="flex gap-2">
                    <DateRangeFilter
                        onChange={({ fromDate, toDate }) => {
                            setFilter({
                                ...filter,
                                pageNumber: 1,
                                range: fromDate ? { from: fromDate.toISOString(), to: toDate?.toISOString() } : undefined,
                            });
                        }}
                    />
                    <Select
                        mode="multiple"
                        className="w-64 min-w-64"
                        placeholder={t('sales.invoice_status')}
                        value={(filter.filters?.find(f => f.key === 'status')?.value as number[]) || []}
                        onChange={handleStatusChange}
                        options={statusOptions}
                        allowClear
                        showSearch={false}
                        maxTagCount="responsive"
                    />
                    <Search
                        placeholder={t('global.search_table')}
                        allowClear
                        className="btn-search-table"
                        onSearch={value => {
                            setFilter({ ...filter, pageNumber: 1, search: value });
                        }}
                    />
                </div>
            </div>
            <div className="flex justify-end text-lg p-1">
                <span>
                    {`${t('sales.total_price')}: `} <strong className="text-green-600">{formatMoney(data?.totalMoney || 0)}</strong>
                </span>
            </div>
            <InvoiceTable<ColumnType>
                dataSource={data?.data || []}
                rowKey={record => record.id}
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
                    width={60}
                    fixed="left"
                    align="center"
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('sales.invoice_number')}
                    dataIndex="code"
                    width={140}
                    fixed="left"
                    key="code"
                    render={(_, record: ColumnType) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span className="cursor-pointer" onClick={() => navigate(`${AppRouters.PURCHASE_INVOICE}/${record.id}`)}>
                                    {record?.code}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    title={t('purchase_invoice.purchase_date')}
                    dataIndex="purchaseDate"
                    align="left"
                    onCell={() => ({ style: { width: 150 } })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
                    key="purchaseDate"
                    render={(_, record: ColumnType) => formatDateTime(record?.purchaseDate, 'DD-MM-YYYY')}
                />
                <Column
                    title={t('purchase_invoice.purchase_order')}
                    dataIndex="purchaseCode"
                    align="left"
                    onCell={() => ({ style: { width: 150 } })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
                    key="purchaseCode"
                    render={(_, record: ColumnType) => {
                        if (!record?.purchaseCode) return '-';
                        const targetRoute = record.purchaseCode.startsWith('DHT')
                            ? `${AppRouters.REFUND}/${record.purchaseId}`
                            : `${AppRouters.PURCHASE_ORDERS}/${record.purchaseId}`;

                        return (
                            <div className="text-blue-500 font-medium cursor-pointer">
                                <span className="cursor-pointer" onClick={() => navigate(targetRoute)}>
                                    {record.purchaseCode}
                                </span>
                            </div>
                        );
                    }}
                />

                <Column
                    title={t('purchase_invoice.supplier')}
                    ellipsis
                    dataIndex="supplierName"
                    key="supplierName"
                    width={220}
                    onCell={() => ({ style: { width: 220, maxWidth: 280 } })}
                    onHeaderCell={() => ({ style: { width: 220, maxWidth: 280 } })}
                    render={(_, record: ColumnType) => (
                        <div className="flex flex-col gap-1">
                            <Text className="inline-block truncate" title={record?.supplier?.supplierName}>
                                {record?.supplier?.supplierName ?? '-'}
                            </Text>
                            <Text className="inline-block truncate" title={record?.supplier?.supplierPhone}>
                                {record?.supplier?.supplierPhone ?? '-'}
                            </Text>
                        </div>
                    )}
                />
                <Column
                    title={t('global.quantity')}
                    dataIndex="totalQuantity"
                    onCell={() => ({ style: { width: 100 } })}
                    onHeaderCell={() => ({ style: { width: 100, maxWidth: 100 } })}
                    key="totalQuantity"
                    align="left"
                    render={(_, record: ColumnType) => <Text className="whitespace-nowrap">{formatNumber(record.totalQuantity || 0)}</Text>}
                />
                <Column
                    title={t('order.list.total_amount')}
                    dataIndex="totalAmount"
                    onCell={() => ({ style: { width: 160 } })}
                    onHeaderCell={() => ({ style: { width: 160, maxWidth: 160 } })}
                    key="totalAmount"
                    align="left"
                    render={(_, record: ColumnType) => <span className="font-semibold text-green-600">{formatMoney(record.totalAmount || 0)}</span>}
                />

                <Column
                    title={t('purchase_invoice.paid')}
                    dataIndex="totalAmountPaid"
                    onCell={() => ({ style: { width: 160 } })}
                    onHeaderCell={() => ({ style: { width: 160, maxWidth: 160 } })}
                    key="totalAmountPaid"
                    align="left"
                    render={(_, record: ColumnType) => formatMoney(record.totalAmountPaid || 0)}
                />
                <Column
                    title={t('global.status')}
                    key="status"
                    dataIndex="status"
                    align="center"
                    fixed="right"
                    width={110}
                    onCell={() => ({ style: { width: 110 } })}
                    onHeaderCell={() => ({ style: { width: 110 } })}
                    render={value => <InvoiceTag value={value} className="!inline-block !text-xs w-full !text-center min-w-[140px]" />}
                />
                <Column
                    width={80}
                    fixed="right"
                    align="center"
                    render={(_, record: ColumnType) => (
                        <div className="flex items-center justify-center">
                            <BaseButton
                                type="text"
                                className="w-fit !px-2 !py-0"
                                onClick={() => {
                                    saveDebtInfoLocalStorage(
                                        {
                                            totalAmount: record.totalAmount,
                                            paidAmount: record.totalAmountPaid,
                                            remainingAmount: (record.totalAmount || 0) - (record.totalAmountPaid || 0),
                                        },
                                        record.debtDocumentId!,
                                    );
                                    navigate(`${AppRouters.PURCHASE_INVOICE_TRANSACTION_NAVIGATE}/${record.debtDocumentId}`);
                                }}
                                icon={<FontAwesomeIcon icon={faHistory} />}
                                title={t('finance_accounting.debt_transaction')}
                                disabled={record?.status == QUOTATION_TARGET_STATUS.CANCELLED || !isFullPermission}
                            />
                        </div>
                    )}
                />
            </InvoiceTable>
            <ExportModal
                ref={exportRef}
                submitLabel={t('global.download')}
                title={t('export.title')}
                urlPath="invoices"
                additionalParams={{ isPurchase: true }}
            />
        </div>
    );
};

export default PurchaseInvoice;

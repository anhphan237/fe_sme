import { apiSearchInvoice } from '@/api/contract.api';
import { apiExport } from '@/api/file.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import ExportModal, { ExportModalRef } from '@/core/components/FileManager/ExportModal';
import InvoiceTag from '@/core/components/Status/InvoiceTag';
import { COMMON_STATUS } from '@/core/components/Status/PaymentTag';
import { useLocale } from '@/i18n';
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
import { FileHelper, formatMoney, formatNumber, saveDebtInfoLocalStorage } from '@/utils/helpers';

import { QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

const { Column } = InvoiceTable;
const { Text } = Typography;

interface ColumnType {
    id: string;
    name: string;
    code: string;
    invoice: string;
    orderCode: string;
    orderId: string;
    totalAmount: number;
    totalAmountPaid: number;
    invoiceDate: string;
    warehouse: {
        warehouseName: string;
    };
    customer: {
        customerTaxCode: string;
        customerContactPerson: string;
        customerWarehouseName: string;
        customerName: string;
        customerContactPersonPhone: string;
        customerPhone: string;
    };
    personInCharge: {
        userName: string;
    };
    status: QUOTATION_TARGET_STATUS;
    quotationInvoice?: string;
    quotationId?: string;
    debtDocumentId?: string;
    totalQuantity?: number;
}

const Invoice = () => {
    const { t } = useLocale();
    const navigate = useNavigate();
    const canExport = useCheckIsFullPermission(DefaultMappingPermission['ExportInvoice']);
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.INVOICE_TRANSACTION]);

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
        queryKey: ['getListInvoice', filter],
        queryFn: async () => {
            const cleanFilter = { ...filter };
            if (!cleanFilter.range?.from || !cleanFilter.range?.to) {
                delete cleanFilter.range;
            }
            const res = await apiSearchInvoice(cleanFilter);
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

    const handleExportOrder = async (id: string) => {
        try {
            const response = await apiExport({ path: 'invoice', invoiceId: id });
            await FileHelper.downloadFileFromResponse(response as any);
            notify.success(t('global.message.export_success'));
        } catch (error) {
            notify.error('global.message.export_failed');
        }
    };

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
                                <span className="cursor-pointer" onClick={() => navigate(`${AppRouters.INVOICE}/${record.id}`)}>
                                    {record?.code}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    title={t('sales.order_date')}
                    dataIndex="invoiceDate"
                    align="left"
                    onCell={() => ({ style: { width: 150 } })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
                    key="invoiceDate"
                    render={(_, record: ColumnType) => formatDateTime(record?.invoiceDate, 'DD-MM-YYYY')}
                />
                <Column
                    title={t('sales.quotation_of_contract')}
                    dataIndex="orderCode"
                    align="left"
                    onCell={() => ({ style: { width: 150 } })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
                    key="orderCode"
                    render={(_, record: ColumnType) => {
                        if (!record?.orderCode) return '-';

                        const targetRoute = record.orderCode.startsWith('DHH')
                            ? `${AppRouters.PURCHASE_REFUND}/${record.orderId}`
                            : `${AppRouters.SALES_ORDER}/${record.orderId}`;

                        return (
                            <div className="text-blue-500 font-medium hover:underline cursor-pointer">
                                <span className="cursor-pointer" onClick={() => navigate(targetRoute)}>
                                    {record.orderCode}
                                </span>
                            </div>
                        );
                    }}
                />

                <Column
                    title={t('sales.customer')}
                    ellipsis
                    dataIndex="customerName"
                    key="customerName"
                    width={220}
                    onCell={() => ({ style: { width: 220, maxWidth: 280 } })}
                    onHeaderCell={() => ({ style: { width: 220, maxWidth: 280 } })}
                    render={(_, record: ColumnType) => (
                        <div className="flex flex-col gap-1">
                            <Text className="inline-block truncate" title={record?.customer?.customerName}>
                                {record?.customer?.customerName ?? '-'}
                            </Text>
                            <Text className="inline-block truncate" title={record?.customer?.customerPhone}>
                                {record?.customer?.customerPhone ?? '-'}
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
                    render={(_, record: ColumnType) => formatNumber(record.totalQuantity || 0)}
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
                    title={t('finance_accounting.collected')}
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
                                    navigate(`${AppRouters.INVOICE}/${record.debtDocumentId}/transaction`);
                                }}
                                icon={<FontAwesomeIcon icon={faHistory} />}
                                title={t('finance_accounting.debt_transaction')}
                                disabled={record?.status == QUOTATION_TARGET_STATUS.CANCELLED || !isFullPermission}
                            />
                            <BaseButton
                                type="text"
                                className="w-fit !px-2 !py-0"
                                title={t('sales.export_invoice')}
                                icon={<FontAwesomeIcon icon={faDownload} />}
                                onClick={() => handleExportOrder(record.id)}
                                disabled={record?.status == QUOTATION_TARGET_STATUS.CANCELLED}
                            />
                        </div>
                    )}
                />
            </InvoiceTable>
            <ExportModal ref={exportRef} submitLabel={t('global.download')} title={t('export.title')} urlPath="invoices" />
        </div>
    );
};

export default Invoice;

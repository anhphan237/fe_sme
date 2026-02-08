import { apiDeletePurchaseReturn, apiSearchPurchaseReturn } from '@/api/purchase-return.api';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import RefundTag, { COMMON_STATUS } from '@/core/components/Status/RefundTag';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { DeleteOutlined, FileAddOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Popconfirm, Select, Typography } from 'antd';
import Column from 'antd/es/table/Column';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import DateRangeFilter from '@/components/custom-range-picker';
import Search from '@/components/search';
import RefundTable, { MyTableProps } from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { formatMoney, formatNumber, handleCommonError, isAdmin } from '@/utils/helpers';

const { Text } = Typography;

const INITIAL_FILTER = {
    pageSize: 10,
    pageNumber: 1,
    search: undefined,
    filters: [{ key: 'status', value: [COMMON_STATUS.NOT_REFUND] }],
};
interface Filter {
    pageSize: number;
    pageNumber: number;
    search?: string;
    range?: { from?: string; to?: string };
    filters?: { key: string; value: string[] | number[] }[];
}

const PurchaseRefund = () => {
    const { t } = useLocale();
    const [filter, setFilter] = useState<Filter>(INITIAL_FILTER);
    const navigate = useNavigate();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.REFUND]);
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};

    const isadminLTBMA = isAdmin(currentUser);

    const { data, isFetching, refetch } = useQuery({
        queryKey: ['getListPurchaseReturn', filter],
        queryFn: async () => {
            const res = await apiSearchPurchaseReturn(filter);
            return res;
        },
    });
    const handleDelete = async (recordId: string) => {
        try {
            const res = await apiDeletePurchaseReturn(recordId);
            if (res.succeeded) {
                notify.success(t('message.delete_success'));
                refetch();
            } else throw res;
        } catch (error: any) {
            handleCommonError(error, t);
        }
    };
    const handleStatusChange = (values: number[]) => {
        setFilter(prev => ({
            ...prev,
            pageNumber: 1,
            filters: values.length ? [{ key: 'status', value: values }] : undefined,
        }));
    };

    const statusOptions = [
        { label: t('sales.status.not_refund'), value: COMMON_STATUS.NOT_REFUND },
        { label: t('sales.status.refunded'), value: COMMON_STATUS.REFUNDED },
    ];

    return (
        <div className="px-8 p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 ">
                <BaseButton
                    onClick={() => navigate(AppRouters.PURCHASE_REFUND_ADD)}
                    disabled={!isFullPermission}
                    icon={<FileAddOutlined />}
                    label={t('purchase_refund_button_add')}
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
                    {`${t('sales.total_price')}: `}{' '}
                    <strong className="text-green-600">{isadminLTBMA ? formatMoney(data?.totalMoney || 0) : '***'}</strong>
                </span>
            </div>
            <RefundTable<any>
                dataSource={data?.data || []}
                rowKey={record => record.id}
                wrapClassName="!h-full max-h-[calc(100%-40px)] w-full !px-0"
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
                    width={50}
                    fixed="left"
                    key="index"
                    align="center"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('sales.return_number')}
                    dataIndex="code"
                    width={140}
                    fixed="left"
                    key="code"
                    render={(_, record: any) => {
                        return (
                            <div className="text-blue-500 font-medium">
                                <span className="cursor-pointer" onClick={() => navigate(`${AppRouters.PURCHASE_REFUND}/${record.id}`)}>
                                    {record?.code}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    ellipsis
                    title={t('sales.return_date')}
                    dataIndex="purchaseReturnDate"
                    align="left"
                    onCell={() => ({ style: { width: 130 } })}
                    onHeaderCell={() => ({ style: { width: 130, minWidth: 130 } })}
                    key="purchaseReturnDate"
                    render={(_, record: any) => formatDateTime(record?.purchaseReturnDate, 'DD-MM-YYYY')}
                />
                <Column
                    title={t('purchase_invoice')}
                    dataIndex="purchaseInvoiceCode"
                    onCell={() => ({ style: { width: 150 } })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
                    key="purchaseInvoiceCode"
                    render={(_, record: any) => {
                        if (!record?.purchaseInvoiceCode) return '-';
                        return (
                            <div className="text-blue-500 font-medium hover:underline cursor-pointer">
                                <span
                                    className="cursor-pointer"
                                    onClick={() => navigate(`${AppRouters.PURCHASE_INVOICE}/${record.purchaseInvoiceId}`)}
                                >
                                    {record?.purchaseInvoiceCode}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    title={t('purchase_refund.supplier')}
                    ellipsis
                    dataIndex="supplierName"
                    key="supplierName"
                    width={220}
                    onCell={() => ({ style: { width: 220, maxWidth: 280 } })}
                    onHeaderCell={() => ({ style: { width: 220, maxWidth: 280 } })}
                    render={(_, record: any) => (
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
                    title={t('sales.return_quantity')}
                    dataIndex="totalReturnQuantity"
                    ellipsis
                    onCell={() => ({ style: { width: 150 } })}
                    onHeaderCell={() => ({ style: { width: 150, minWidth: 150 } })}
                    key="totalReturnQuantity"
                    align="left"
                    render={(_, record: any) => <Text className="whitespace-nowrap">{formatNumber(record.totalReturnQuantity || 0)}</Text>}
                />
                <Column
                    title={t('purchase_refund.total_amount')}
                    dataIndex="totalRefund"
                    onCell={() => ({ style: { width: 160 } })}
                    onHeaderCell={() => ({ style: { width: 160, maxWidth: 160 } })}
                    key="totalRefund"
                    align="left"
                    render={(_, record: any) => (
                        <span className="font-semibold text-green-600">{isadminLTBMA ? formatMoney(record.totalRefund || 0) : '***'}</span>
                    )}
                />

                <Column
                    title={t('purchase_refund.return_reason')}
                    dataIndex="reasonReturn"
                    key="reasonReturn"
                    ellipsis
                    onCell={() => ({ style: { width: 200 } })}
                    onHeaderCell={() => ({ style: { width: 200, maxWidth: 200 } })}
                    render={val => (
                        <Text className="whitespace-nowrap" title={val}>
                            {val || '-'}
                        </Text>
                    )}
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
                    render={value => <RefundTag value={value} className="!inline-block !text-xs w-full !text-center min-w-[140px]" />}
                />
                <Column
                    width={80}
                    fixed="right"
                    align="center"
                    onCell={() => ({ style: { width: 80 } })}
                    onHeaderCell={() => ({ style: { width: 80 } })}
                    render={(_, record: any) => (
                        <div className="flex items-center justify-center">
                            <Popconfirm
                                title={t('sales.refund.confirm.delete')}
                                onConfirm={() => handleDelete(record.id)}
                                okText={t('global.popup.ok')}
                                cancelText={t('global.popup.reject')}
                                placement="left"
                            >
                                <Button
                                    shape="circle"
                                    icon={<DeleteOutlined />}
                                    className="items-center justify-center text-red-600 flex gap-1"
                                    disabled={record?.status === COMMON_STATUS.REFUNDED}
                                />
                            </Popconfirm>
                        </div>
                    )}
                />
            </RefundTable>
        </div>
    );
};

export default PurchaseRefund;

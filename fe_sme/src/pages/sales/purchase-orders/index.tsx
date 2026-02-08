import { apiCancelPurchase, apiSearchPurchase } from '@/api/purchase.api';
import { AppRouters, DefaultMappingPermission } from '@/constants';
import ApproveTag from '@/core/components/Status/ApproveTag';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { FileAddOutlined } from '@ant-design/icons';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { Button, Popconfirm, Select, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import BaseButton from '@/components/button';
import DateRangeFilter from '@/components/custom-range-picker';
import Search from '@/components/search';
import SaleTable, { MyTableProps } from '@/components/table';
import { notify } from '@/components/toast-message';

import useCheckIsFullPermission from '@/hooks/useCheckIsFullPermission';

import { formatDateTime } from '@/utils/format-datetime';
import { formatMoney, formatNumber, handleCommonError, isAdmin } from '@/utils/helpers';

import { PURCHASE_STATUS } from '@/constants/sales/purchase';

const { Text } = Typography;

const INITIAL_FILTER = {
    pageSize: 10,
    pageNumber: 1,
    searchValue: undefined,
    filters: [{ key: 'status', value: [PURCHASE_STATUS.REQUEST, PURCHASE_STATUS.INPROGRESS, PURCHASE_STATUS.DRAFT] }],
};
interface Filter {
    pageSize: number;
    pageNumber: number;
    searchValue?: string;
    range?: { from?: string; to?: string };
    filters?: { key: string; value: string[] | number[] }[];
}

interface IProps<T extends Object = any> {
    tableProps?: Omit<MyTableProps<T>, 'rowKey' | 'dataSource' | 'pagination'>;
    editable?: boolean;
}

const PurchaseOrders = ({ editable = true, tableProps }: IProps) => {
    const { t } = useLocale();
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};

    // const isadminLTBMA = isAdmin(currentUser);

    const [filter, setFilter] = useState<Filter>({
        ...INITIAL_FILTER,
        filters: [{ key: 'status', value: [PURCHASE_STATUS.DRAFT] }],
    });

    const navigate = useNavigate();
    const isFullPermission = useCheckIsFullPermission(DefaultMappingPermission[AppRouters.PURCHASE_ORDERS]);

    const {
        data: purchases,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['getPurchaseList', filter],
        queryFn: async () => {
            const res = await apiSearchPurchase(filter);
            return res;
        },
    });

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        if (!editable) {
            e.preventDefault();
        }
    };

    const handleCancel = async (recordId: string) => {
        try {
            const res = await apiCancelPurchase(recordId);
            if (res.succeeded) {
                notify.success(t('message.cancel_success'));
                refetch();
            } else throw res;
        } catch (error: any) {
            handleCommonError(error, t);
        }
    };

    const columns: ColumnsType = [
        {
            title: t('category.list.index'),
            key: 'index',
            render: (_: any, __: any, index: number) => (
                <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + index + 1}</div>
            ),
            fixed: 'left',
            align: 'center',
            width: 60,
            onCell: () => ({ style: { width: 60 } }),
            onHeaderCell: () => ({ style: { width: 60, minWidth: 60 } }),
        },
        {
            title: t('purchase_order.code'),
            key: 'invoice',
            width: 160,
            fixed: 'left',
            className: 'truncate',
            dataIndex: 'invoice',
            onCell: () => ({ style: { width: 160, maxWidth: 160 } }),
            onHeaderCell: () => ({ style: { width: 160, maxWidth: 160 } }),
            render: (value, record) => {
                return (
                    <Link onClick={handleClick} className="!text-blue-500 font-medium " to={`${AppRouters.PURCHASE_ORDERS}/${record.id}`}>
                        {value}
                    </Link>
                );
            },
        },
        {
            title: t('sales.purchase_date'),
            key: 'invoiceDate',
            dataIndex: 'invoiceDate',
            width: 150,
            fixed: 'left',
            render: value => formatDateTime(value, 'DD-MM-YYYY'),
            onCell: () => ({ style: { width: 130, minWidth: 130 } }),
            onHeaderCell: () => ({ style: { width: 130, minWidth: 130 } }),
        },
        {
            title: t('sales.supplier'),
            width: 220,
            className: 'truncate',
            key: 'supplierName',
            onCell: () => ({ style: { width: 250, maxWidth: 280 } }),
            onHeaderCell: () => ({ style: { width: 250, minWidth: 250 } }),
            render: (_, record) => (
                <div className="flex flex-col gap-1">
                    <Text className="inline-block truncate" title={record?.supplier?.supplierName}>
                        {record?.supplier?.supplierName ?? '-'}
                    </Text>
                    <Text className="inline-block truncate" title={record?.supplier?.supplierPhone}>
                        {record?.supplier?.supplierPhone ?? '-'}
                    </Text>
                </div>
            ),
        },
        {
            title: t('global.quantity'),
            key: 'totalProduct',
            className: 'truncate',
            width: 100,
            align: 'center',
            onCell: () => ({ style: { width: 100, maxWidth: 100 } }),
            onHeaderCell: () => ({ style: { width: 100 } }),
            render: (_, record) => <Text>{formatNumber(record?.totalQuantity) || '-'}</Text>,
        },
        {
            title: t('sales.total_price'),
            key: 'totalAmount',
            className: 'truncate',
            width: 160,
            align: 'left',
            onCell: () => ({ style: { width: 160 } }),
            onHeaderCell: () => ({ style: { width: 160 } }),
            render: (_, record) => {
                return <span className="font-semibold text-green-600">{formatMoney(record.totalAmount)}</span>;
            },
        },

        {
            title: t('global.description'),
            key: 'description',
            className: 'truncate',
            width: 160,
            align: 'left',
            onCell: () => ({ style: { width: 160 } }),
            onHeaderCell: () => ({ style: { width: 160 } }),
            render: (_, record) => <Text>{record?.description || '-'}</Text>,
        },
        {
            title: t('global.status'),
            key: 'status',
            dataIndex: 'status',
            width: 100,
            fixed: 'right',
            align: 'center',
            onCell: () => ({ style: { width: 100 } }),
            onHeaderCell: () => ({ style: { width: 100 } }),
            render: value => {
                return <ApproveTag value={value} className="!inline-block !text-xs w-full !text-center min-w-[140px]" />;
            },
        },
        {
            key: 'action',
            fixed: 'right',
            align: 'center',
            width: 80,
            onCell: () => ({ width: 80 }),
            onHeaderCell: () => ({ style: { width: 80, minWidth: 80 } }),
            render: (_: any, record: any) => (
                <div className="flex items-center justify-center gap-2">
                    {(editable || isFullPermission) && (
                        <Popconfirm
                            title={t('purchase_order.cancel_confirmation')}
                            onConfirm={() => handleCancel(record.id)}
                            okText={t('global.popup.ok')}
                            cancelText={t('global.popup.reject')}
                            placement="left"
                        >
                            <Tooltip placement="topRight" title={t('global.popup.cancel.text')}>
                                <Button
                                    shape="circle"
                                    icon={<FontAwesomeIcon icon={faBan} />}
                                    className="items-center justify-center text-red-600 flex gap-1"
                                    disabled={record?.status !== PURCHASE_STATUS.REQUEST && record?.status !== PURCHASE_STATUS.DRAFT}
                                />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </div>
            ),
        },
    ];

    const handleStatusChange = (values: number[]) => {
        setFilter(prev => ({
            ...prev,
            pageNumber: 1,
            filters: values.length ? [{ key: 'status', value: values }] : undefined,
        }));
    };

    const statusOptions = [
        { label: t('global.status.draft'), value: PURCHASE_STATUS.DRAFT },
        { label: t('global.status.done'), value: PURCHASE_STATUS.DONE },
        { label: t('global.status.cancelled'), value: PURCHASE_STATUS.CANCELLED },
    ];

    return (
        <div className="px-8 p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 gap-2">
                <div className="flex gap-2">
                    <BaseButton
                        onClick={() => navigate(AppRouters.PURCHASE_ORDERS_ADD)}
                        disabled={!isFullPermission}
                        icon={<FileAddOutlined />}
                        label={t('purchase_order.button_add')}
                    />
                </div>
                <div className="flex gap-2 justify-end ">
                    <DateRangeFilter
                        onChange={({ fromDate, toDate }) =>
                            setFilter({
                                ...filter,
                                pageNumber: 1,
                                range: fromDate ? { from: fromDate.toISOString(), to: toDate?.toISOString() } : undefined,
                            })
                        }
                    />
                    <Select
                        mode="multiple"
                        className="w-64 min-w-64"
                        placeholder={t('sales.quotation_status')}
                        maxTagCount="responsive"
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
                        onSearch={v => setFilter({ ...filter, pageNumber: 1, searchValue: v })}
                    />
                </div>
            </div>
            <div className="flex justify-end text-lg p-1">
                <span>
                    {`${t('sales.total_price')}: `} <strong className="text-green-600">{formatMoney(purchases?.totalMoney || 0)}</strong>
                </span>
            </div>
            <SaleTable
                rowKey="id"
                wrapClassName="!h-full max-h-[calc(100%-40px)] w-full !px-0"
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: purchases?.totalItems ?? 0,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
                loading={isLoading || isFetching}
                columns={columns}
                dataSource={purchases?.data || []}
                {...tableProps}
            />
        </div>
    );
};

export default PurchaseOrders;

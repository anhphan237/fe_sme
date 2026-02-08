import { apiGetProductHistory } from '@/api/category.api';
import { AppRouters, DefaultRoles, DefaultTenantCode } from '@/constants';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import { useQuery } from '@tanstack/react-query';
import { Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DateRangeFilter from '@/components/custom-range-picker';
import SaleTable from '@/components/table';

import { formatDateTime } from '@/utils/format-datetime';
import { InputHelper, formatMoney, isAdmin } from '@/utils/helpers';

import { IProductHistory } from '@/interface/product';

const { Text } = Typography;

const INITIAL_FILTER = {
    pageSize: 10,
    pageNumber: 1,
    search: undefined,
    range: {
        from: dayjs().startOf('month').startOf('day').toISOString(),
        to: dayjs().endOf('month').startOf('day').toISOString(),
    },
};

interface Filter {
    pageSize: number;
    pageNumber: number;
    search?: string;
    range?: { from?: string; to?: string };
}

interface IProductHistoryTableProps {
    productId: string;
}

const ProductHistoryTable: React.FC<IProductHistoryTableProps> = ({ productId }) => {
    const { t } = useLocale();
    const navigate = useNavigate();
    const { userProfileInfo: currentUser } = useAppSelector(state => state.global) ?? {};

    // const isadminLTBMA = isAdmin(currentUser);

    const [filter, setFilter] = useState<Filter>(INITIAL_FILTER);

    const {
        data: productHistory,
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ['getProductHistory', productId, filter],
        queryFn: async () => {
            const res = await apiGetProductHistory(
                {
                    ...filter,
                    productId: productId,
                },
                { loading: false },
            );
            return res;
        },
        enabled: !!productId,
    });

    const totalSelling = productHistory?.statistic?.totalSelling || 0;
    const profit = productHistory?.statistic?.profit || 0;
    const columns: ColumnsType<IProductHistory> = [
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
            title: t('dashboard.chart.refund.popup.list.order.code'),
            key: 'orderCode',
            dataIndex: 'orderCode',
            width: 150,
            fixed: 'left',
            className: 'truncate',
            onCell: () => ({ style: { width: 150, maxWidth: 150 } }),
            onHeaderCell: () => ({ style: { width: 150, minWidth: 150 } }),
            render: (value: string, record: IProductHistory) => (
                <Text className="font-medium text-blue-500 cursor-pointer " onClick={() => navigate(`${AppRouters.SALES_ORDER}/${record.orderId}`)}>
                    {value || '-'}
                </Text>
            ),
        },
        {
            title: t('sales.order_date'),
            key: 'invoiceDate',
            dataIndex: 'invoiceDate',
            width: 130,
            render: (value: string) => formatDateTime(value, 'DD-MM-YYYY HH:mm'),
            onCell: () => ({ style: { width: 130, minWidth: 130 } }),
            onHeaderCell: () => ({ style: { width: 130, minWidth: 130 } }),
        },
        {
            title: t('global.quantity'),
            key: 'totalQuantity',
            dataIndex: 'totalQuantity',
            width: 100,
            align: 'right',
            onCell: () => ({ style: { width: 100 } }),
            onHeaderCell: () => ({ style: { width: 100 } }),
            render: (value: number) => <Text className="font-medium">{value ? InputHelper.formatNumber(value) : '0'}</Text>,
        },
        {
            title: t('product.add_edit.price'),
            key: 'sellingPrice',
            dataIndex: 'sellingPrice',
            width: 150,
            align: 'right',
            onCell: () => ({ style: { width: 150 } }),
            onHeaderCell: () => ({ style: { width: 150 } }),
            render: (value: number) => <Text className="font-medium">{formatMoney(value || 0)}</Text>,
        },
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="text-lg">
                    <div className="flex gap-4">
                        <span>
                            {`${t('order.list.cod_amount')}: `}
                            <strong className="text-black-600">{formatMoney(totalSelling)}</strong>
                        </span>
                        <span>
                            {`${t('dashboard.chart.label.profit')}: `}
                            <strong className="text-green-600">{formatMoney(profit)}</strong>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <DateRangeFilter
                        defaultValue="thisMonth"
                        onChange={({ fromDate, toDate }) => {
                            setFilter({
                                ...filter,
                                pageNumber: 1,
                                range: fromDate ? { from: fromDate.toISOString(), to: toDate?.toISOString() } : undefined,
                            });
                        }}
                    />
                </div>
            </div>

            <SaleTable<IProductHistory>
                rowKey="invoice"
                wrapClassName="h-full w-full !px-0"
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: productHistory?.totalRecords ?? 0,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
                loading={isLoading || isFetching}
                columns={columns}
                dataSource={productHistory?.data || []}
            />
        </div>
    );
};

export default ProductHistoryTable;

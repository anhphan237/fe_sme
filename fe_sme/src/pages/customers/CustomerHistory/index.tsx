import { apiSearchCustomerHistory } from '@/api/customer.api';
import { ParamsGetList } from '@/api/request';
import { AppRouters } from '@/constants';
import PaymentTag, { COMMON_STATUS } from '@/core/components/Status/PaymentTag';
import { useLocale } from '@/i18n';
import { LeftOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Select } from 'antd';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';
import DateRangeFilter from '@/components/custom-range-picker';
import Search from '@/components/search';
import CustomerHistoryTable from '@/components/table';

import { setBreadCrumbs } from '@/stores/global.store';

import { formatDateTime } from '@/utils/format-datetime';
import { formatMoney, renderLabelOption } from '@/utils/helpers';

import { IResCustomerHistory } from '@/interface/customer';

const { Column } = CustomerHistoryTable;

const CustomerHistory = () => {
    const { t } = useLocale();
    const { id: customerId } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
        filters: [{ key: 'status', value: [COMMON_STATUS.PENDING, COMMON_STATUS.PROCESSING] }],
    });

    const { data } = useQuery({
        queryKey: ['getListCustomerHistory', filter, customerId],
        queryFn: async () => {
            const res = await apiSearchCustomerHistory({ ...filter, ...(customerId && { customerId }) }, { loading: false });
            return res;
        },
    });

    useEffect(() => {
        if (!customerId) return;
        dispatch(
            setBreadCrumbs({
                [customerId]: t('workflow.detail.title'),
            }),
        );
    }, [customerId]);

    const handleFilterChange = (filterKey: 'status' | 'type', values: number[]) => {
        setFilter(prev => {
            const otherFilters = prev.filters?.filter(f => f.key !== filterKey) || [];

            return {
                ...prev,
                pageNumber: 1,
                filters:
                    [...otherFilters, ...(values.length ? [{ key: filterKey, value: values }] : [])].filter(f => f.value?.length > 0) || undefined,
            };
        });
    };

    const statusOptions = [
        { label: t('sales.status.pending'), value: COMMON_STATUS.PENDING },
        { label: t('sales.status.inprogress'), value: COMMON_STATUS.PROCESSING },
        { label: t('sales.status.paid'), value: COMMON_STATUS.PROCESSED },
        { label: t('global.status.cancelled'), value: COMMON_STATUS.CANCELLED },
    ];

    const typeOptions = [
        { label: t('sales.order_return.buy'), value: 0 },
        { label: t('sales.order_return.refund'), value: 1 },
    ];

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center gap-2 mb-3 mx-2">
                {customerId && <BaseButton type="primary" label={t('global.back')} icon={<LeftOutlined />} onClick={() => navigate(-1)} />}

                <div className="relative flex flex-col items-center p-2 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="px-2 py-1 bg-white shadow text-center font-medium rounded-lg mb-2 absolute top-[-15px] right-4">
                        <span className="text-xs whitespace-normal text-center">{t('sales.total_price')}</span>
                    </div>
                    <strong className="text-green-600 text-base my-1">{formatMoney(data?.totalMoney || 0)}</strong>
                </div>

                <div className="flex gap-2 items-center flex-shrink-0">
                    <DateRangeFilter
                        onChange={({ fromDate, toDate }) => {
                            setFilter({
                                ...filter,
                                pageNumber: 1,
                                ...(fromDate ? { range: { from: fromDate.toISOString(), to: toDate?.toISOString() } } : { range: undefined }),
                            });
                        }}
                    />
                    <Select
                        mode="multiple"
                        className="w-36 min-w-36"
                        placeholder={t('finance.sales_commission.order_type')}
                        value={(filter.filters?.find(f => f.key === 'type')?.value as number[]) || []}
                        onChange={values => handleFilterChange('type', values)}
                        options={typeOptions}
                        allowClear
                        showSearch={false}
                        maxTagCount="responsive"
                    />
                    <Select
                        mode="multiple"
                        className="w-48 min-w-48"
                        placeholder={t('sales.invoice_status')}
                        value={(filter.filters?.find(f => f.key === 'status')?.value as number[]) || []}
                        onChange={values => handleFilterChange('status', values)}
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
            <CustomerHistoryTable<IResCustomerHistory>
                dataSource={data?.data || []}
                rowKey={record => record.customerId}
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
                    onCell={() => ({ width: 50 })}
                    onHeaderCell={() => ({ style: { width: 50 } })}
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('finance.sales_commission.order_type')}
                    dataIndex="paymentMethod"
                    width={150}
                    fixed="left"
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    key="type"
                    render={(_, record: IResCustomerHistory) =>
                        renderLabelOption(record.type, [
                            { value: 0, label: t('sales.order_return.buy') },
                            { value: 1, label: t('sales.order_return.refund') },
                        ])
                    }
                />
                <Column
                    ellipsis
                    width={200}
                    fixed="left"
                    onCell={() => ({ width: 200 })}
                    onHeaderCell={() => ({ style: { width: 200, minWidth: 200 } })}
                    title={t('customer.name')}
                    dataIndex="customerName"
                    className="max-w-72"
                    key="customerName"
                />
                <Column
                    title={t('history.order_code')}
                    ellipsis
                    width={150}
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    align="center"
                    dataIndex="code"
                    key="code"
                    render={(_, record: IResCustomerHistory) => {
                        const path = record.type === 0 ? `${AppRouters.INVOICE}/${record.id}` : `${AppRouters.REFUND}/${record.id}`;

                        return (
                            <div className="text-blue-500 font-medium">
                                <span className="cursor-pointer" onClick={() => navigate(path)}>
                                    {record.code || '-'}
                                </span>
                            </div>
                        );
                    }}
                />
                <Column
                    title={t('history.payment_value')}
                    ellipsis
                    width={150}
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    align="right"
                    dataIndex="totalAmount"
                    key="totalAmount"
                    render={(_, record: IResCustomerHistory) => formatMoney(record?.totalAmount)}
                />
                <Column
                    ellipsis
                    width={150}
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    title={t('Updated at')}
                    dataIndex="invoiceDate"
                    align="right"
                    key="invoiceDate"
                    render={(_, record: IResCustomerHistory) => formatDateTime(record.lastModified)}
                />
                <Column
                    title={t('global.status')}
                    ellipsis
                    width={110}
                    fixed="right"
                    onCell={() => ({ width: 110 })}
                    onHeaderCell={() => ({ style: { width: 110 } })}
                    align="center"
                    dataIndex="status"
                    key="status"
                    render={(_, record: IResCustomerHistory) => (
                        <PaymentTag value={record?.status} className="!inline-block !text-xs w-full !text-center min-w-[140px]" />
                    )}
                />
            </CustomerHistoryTable>
        </div>
    );
};

export default CustomerHistory;

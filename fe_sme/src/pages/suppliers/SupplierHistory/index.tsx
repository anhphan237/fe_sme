import { ParamsGetList } from '@/api/request';
import { apiSearchSupplierHistory } from '@/api/supplier.api';
import { AppRouters } from '@/constants';
import PaymentTag, { COMMON_STATUS } from '@/core/components/Status/PaymentTag';
import { useLocale } from '@/i18n';
import { LeftOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import Select from 'antd/lib/select';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';
import DateRangeFilter from '@/components/custom-range-picker';
import Search from '@/components/search';
import SupplierHistoryTable from '@/components/table';

import { setBreadCrumbs } from '@/stores/global.store';

import { formatDateTime } from '@/utils/format-datetime';
import { formatMoney, renderLabelOption } from '@/utils/helpers';

import { IResSupplierHistory } from '@/interface/supplier';

const { Column } = SupplierHistoryTable;

const SupplierHistory = () => {
    const { t } = useLocale();
    const { id: supplierId } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [filter, setFilter] = useState<ParamsGetList>({
        pageSize: 10,
        pageNumber: 1,
        search: undefined,
        filters: [{ key: 'status', value: [COMMON_STATUS.PENDING, COMMON_STATUS.PROCESSING] }],
    });

    const { data } = useQuery({
        queryKey: ['getListSupplierHistory', filter, supplierId],
        queryFn: async () => {
            const res = await apiSearchSupplierHistory({ ...filter, ...(supplierId && { supplierId }) }, { loading: false });
            return res;
        },
    });

    useEffect(() => {
        if (!supplierId) return;
        dispatch(
            setBreadCrumbs({
                [supplierId]: t('workflow.detail.title'),
            }),
        );
    }, [supplierId]);

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
        { label: t('purchase_order'), value: 2 },
        { label: t('purchase_refund'), value: 1 },
    ];

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex justify-between items-center gap-2 mb-3 mx-2">
                {supplierId && <BaseButton type="primary" label={t('global.back')} icon={<LeftOutlined />} onClick={() => navigate(-1)} />}

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
                        className="w-32 min-w-32"
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

            <SupplierHistoryTable<IResSupplierHistory>
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
                    width={50}
                    onCell={() => ({ width: 50 })}
                    onHeaderCell={() => ({ style: { width: 50 } })}
                    fixed="left"
                    key="index"
                    render={(_, __, index: number) => (
                        <div className="flex items-center justify-center mb-0">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
                    )}
                />
                <Column
                    title={t('finance.sales_commission.order_type')}
                    dataIndex="type"
                    width={150}
                    fixed="left"
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    key="type"
                    render={(_, record: IResSupplierHistory) =>
                        renderLabelOption(record.type, [
                            { value: 1, label: t('purchase_refund') },
                            { value: 2, label: t('purchase_order') },
                        ])
                    }
                />
                <Column
                    ellipsis
                    align="left"
                    fixed="left"
                    width={200}
                    onCell={() => ({ width: 200 })}
                    onHeaderCell={() => ({ style: { width: 200, minWidth: 200 } })}
                    title={t('supplier.add_edit.name')}
                    dataIndex="supplierName"
                    className="max-w-72"
                    key="supplierName"
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
                    render={(_, record: IResSupplierHistory) => {
                        const path = record.type === 1 ? `${AppRouters.PURCHASE_REFUND}/${record.id}` : `${AppRouters.PURCHASE_INVOICE}/${record.id}`;

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
                    render={(_, record: IResSupplierHistory) => formatMoney(record?.totalAmount)}
                />
                <Column
                    ellipsis
                    width={150}
                    onCell={() => ({ width: 150 })}
                    onHeaderCell={() => ({ style: { width: 150 } })}
                    title={t('Updated at')}
                    dataIndex="lastModified"
                    align="right"
                    key="lastModified"
                    render={(_, record: IResSupplierHistory) => formatDateTime(record.lastModified)}
                />
                <Column
                    title={t('global.status')}
                    ellipsis
                    fixed="right"
                    width={110}
                    onCell={() => ({ width: 110 })}
                    onHeaderCell={() => ({ style: { width: 110 } })}
                    align="center"
                    dataIndex="status"
                    key="status"
                    render={(_, record: IResSupplierHistory) => (
                        <PaymentTag value={record?.status} className="!inline-block !text-xs w-full !text-center min-w-[140px]" />
                    )}
                />
            </SupplierHistoryTable>
        </div>
    );
};

export default SupplierHistory;

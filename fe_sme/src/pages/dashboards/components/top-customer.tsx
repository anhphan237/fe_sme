import { apiGetDashboardTopCustomer } from '@/api/dashboard.api';
import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import MyTable from '@/components/table';

import { formatMoney } from '@/utils/helpers';

import { ITopCustomerData } from '@/interface/dashboard';

type Props = {
    from: string;
    to: string;
};

const TopCustomer = (props: Props) => {
    const { from, to } = props;
    const { t } = useLocale();
    const navigate = useNavigate();
    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10, moneyRange: -1, range: 'custom' });
    const [topCustomerData, setTopCustomerData] = useState<{ data: ITopCustomerData[]; totalItems: number }>({ totalItems: 0, data: [] });

    const moneyOptions = [
        { label: t('customer.filter.amount.all'), value: -1 },
        { label: t('customer.filter.amount.under_10m'), value: 0 },
        { label: t('customer.filter.amount.10_50m'), value: 1 },
        { label: t('customer.filter.amount.50_100m'), value: 2 },
        { label: t('customer.filter.amount.100_500m'), value: 3 },
        { label: t('customer.filter.amount.500m_1b'), value: 4 },
        { label: t('customer.filter.amount.over_1b'), value: 5 },
    ];

    const columns: any = [
        {
            title: t('category.list.index'),
            dataIndex: 'index',
            key: 'index',
            width: 60,
            align: 'center',
            minWidth: 60,
            fixed: 'left',
            render: (_: any, __: any, index: number) => (
                <div className="flex items-center justify-center">{(filter.pageNumber - 1) * filter.pageSize + (index + 1)}</div>
            ),
        },
        {
            title: t('finance_accounting.customer_supplier_name'),
            dataIndex: 'customerName',
            key: 'customerName',
            fixed: 'left',
            render: (_: any, record: ITopCustomerData) => (
                <div
                    className="text-blue-500 font-medium cursor-pointer max-w-60 truncate hover:underline"
                >
                    {record?.customerName}
                </div>
            ),
        },
        {
            title: t('customer.phone'),
            dataIndex: 'customerPhoneNumber',
            key: 'customerPhoneNumber',
            align: 'center',
            minWidth: 120,
        },

        {
            title: t('sales.invoice_quantity'),
            dataIndex: 'totalCount',
            key: 'totalCount',
            minWidth: 80,
            align: 'right',
        },
        {
            title: t('sales.total_price'),
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            minWidth: 140,
            align: 'right',
            fixed: 'right',
            render: (value: number) => formatMoney(value),
        },
    ];

    useEffect(() => {
        if (!from || !to) return;
        const params = { ...filter, from, to };
        setTimeout(() => {
            initData(params);
        }, 500);
    }, [from, to, filter]);

    const initData = async (params: any) => {
        const resp = await apiGetDashboardTopCustomer(params);
        if (resp.succeeded) {
            setTopCustomerData({ totalItems: resp.totalItems, data: resp.data || [] });
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 h-full">
            <div className="flex justify-between">
                <div className="font-medium text-lg">{t('dashboard.staff.top_customer')}</div>
                <Select
                    options={moneyOptions}
                    className="w-52"
                    value={filter.moneyRange}
                    onChange={val => setFilter({ ...filter, pageNumber: 1, moneyRange: val })}
                    placeholder={t('order.list.total_amount')}
                />
            </div>
            <MyTable
                wrapClassName="!h-full max-h-[460px] w-full !px-0"
                columns={columns}
                bordered
                dataSource={topCustomerData.data}
                pagination={{
                    current: filter.pageNumber,
                    pageSize: filter.pageSize,
                    total: topCustomerData.totalItems,
                    onChange: (page, pageSize) => {
                        setFilter({ ...filter, pageNumber: page, pageSize });
                    },
                }}
            />
        </div>
    );
};

export default React.memo(TopCustomer);

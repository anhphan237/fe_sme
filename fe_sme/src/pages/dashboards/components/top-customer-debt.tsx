import { apiGetDashboardTopCustomerDebt } from '@/api/dashboard.api';
import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';

import Chart from '@/components/chart';

import { InputHelper, formatCurrency, formatNumber, saveDebtInfoLocalStorage } from '@/utils/helpers';

import { ITopCustomerDebtData } from '@/interface/dashboard';

interface HorizontalBarChartData {
    name: string;
    value: number;
    origin?: ITopCustomerDebtData;
}

interface HorizontalBarChartProps {
    title: string;
    data: HorizontalBarChartData[];
    color: string;
    onBarClick?: (data: HorizontalBarChartData) => void;
    isLoading?: boolean;
}

const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({ title, data, color, onBarClick, isLoading = false }) => {
    const onEvents = {
        click: (params: any) => {
            if (onBarClick && params?.dataIndex !== undefined) {
                onBarClick(data[params.dataIndex]);
            }
        },
    };

    const option = {
        title: {
            text: title,
            left: 'center',
            textStyle: {
                fontSize: 20,
                fontWeight: 'bold',
                color: '#000',
            },
        },
        legend: {
            show: false,
        },
        grid: {
            left: '15%',
            right: '15%',
            top: '15%',
            bottom: '15%',
        },
        xAxis: {
            type: 'value',
            axisLabel: {
                formatter: (value: number) => {
                    if (value >= 1000000000) return `${formatNumber(value / 1000000000)} tỷ`;
                    if (value >= 1000000) return `${formatNumber(value / 1000000)}tr`;
                    return formatNumber(value);
                },
            },
            splitLine: {
                show: true,
                lineStyle: { color: '#e0e0e0' },
            },
        },
        yAxis: {
            type: 'category',
            data: data.map(item => item.name),
            axisLabel: {
                fontSize: 12,
                color: '#666',
                formatter: (value: string) => {
                    return value.length > 8 ? value.substring(0, 6) + '…' : value;
                },
            },
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: any) => {
                const item = Array.isArray(params) ? params[0] : params;
                const originalData = item.data?.origin;
                return `
                <b>${item.name}</b><br/>
                Khách hàng: ${originalData?.customerName || 'N/A'}<br/>
                Tổng nợ: ${InputHelper.formatNumber(item.value, 'VNĐ')}<br/>
                Số chứng từ: ${originalData?.totalDebtDocument || 0}<br/>
            `;
            },
        },
        series: [
            {
                type: 'bar',
                data: data,
                itemStyle: {
                    color: color,
                    borderRadius: [0, 4, 4, 0],
                },
                label: {
                    show: true,
                    position: 'right',
                    fontSize: 12,
                    color: '#666',
                    formatter: (params: any) => {
                        return formatCurrency(params.value);
                    },
                },
            },
        ],
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <Skeleton.Image rootClassName="!w-full !h-[350px]" className="!w-full !h-full" active />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <Chart option={option} className="h-80" onEvents={onEvents} />
        </div>
    );
};

type Props = {
    from: string;
    to: string;
};

const TopCustomerDebt: React.FC<Props> = ({ from, to }) => {
    const { t } = useLocale();
    const navigate = useNavigate();

    const {
        data: customerDebtData = [],
        isLoading,
        isFetching,
    } = useQuery({
        queryKey: ['top-customer-debt', from, to],
        queryFn: async () => {
            const response = await apiGetDashboardTopCustomerDebt({
                from,
                to,
                range: 'custom',
                pageNumber: 1,
                pageSize: 5,
                moneyRange: -1,
            });

            return (
                response?.data?.reverse()?.map((item: ITopCustomerDebtData) => ({
                    origin: item,
                    name: item.customerName || item.customerCode || 'N/A',
                    value: item.totalRemainingAmount || 0,
                })) || []
            );
        },
        enabled: !!from && !!to,
    });

    return (
        <HorizontalBarChart
            title={t('dashboard.top_customer_debt')}
            data={customerDebtData}
            color="#FF6B6B"
            isLoading={isLoading || isFetching}
            onBarClick={data => {
                console.log(data)
            }}
        />
    );
};

export default TopCustomerDebt;

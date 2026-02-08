import { apiGetDashboardMoneyTrend } from '@/api/dashboard.api';
import { useLocale } from '@/i18n';
import { get, orderBy } from 'lodash';
import React, { useEffect, useState } from 'react';

import Chart from '@/components/chart';

import useResizeObserver from '@/hooks/useResizeObserver';

import { IMoneyTrend } from '@/interface/dashboard';

// const labelOption = {
//     show: true,
//     position: 'top',
//     distance: 15,
//     align: 'center',
//     verticalAlign: 'middle',
//     rotate: 0,
//     formatter: (params: any) => {
//         const money = get(params, 'data.value', 0);
//         return formatMoney(money);
//     },
//     fontSize: 10,
//     rich: {
//         name: {},
//     },
// };

type Props = {
    from: string;
    to: string;
};

type ChartData = {
    value: number;
    // extraInfo: any;
};

const MoneyTrend: React.FC<Props> = (props: Props) => {
    const { from, to } = props;
    const { t } = useLocale();

    const [revenueData, setRevenueData] = useState<ChartData[]>([]);
    const [returnData, setReturnData] = useState<ChartData[]>([]);
    const [profitData, setProfitData] = useState<ChartData[]>([]);
    const [xAxisLabel, setXAxislabel] = useState<string[]>([]);

    useEffect(() => {
        if (!from || !to) return;
        setTimeout(() => {
            initData();
        }, 500);
    }, [from, to]);

    const initData = async () => {
        const resp = await apiGetDashboardMoneyTrend(from, to);
        if (!resp?.succeeded) return;
        let data: IMoneyTrend[] = get(resp, 'data.details', []);
        data = orderBy(data, ['time'], ['asc']);
        const revenue: ChartData[] = [];
        const returns: ChartData[] = [];
        const profits: ChartData[] = [];
        const xLabel: string[] = [];
        data.forEach(d => {
            revenue.push({
                value: d.invoice,
                // extraInfo: {
                //     sales: d.sales,
                //     percent: d.percentInvoice,
                // },
            });
            returns.push({
                value: d.returns,
                // extraInfo: {
                //     sales: d.sales,
                //     percent: d.percentReturns,
                // },
            });
            profits.push({
                value: d.profits,
            });
            xLabel.push(d.label);
        });
        setRevenueData(revenue);
        setReturnData(returns);
        setProfitData(profits);
        setXAxislabel(xLabel);
    };

    const chartRef = React.useRef<any>(null);
    const handleResize = () => {
        if (!chartRef.current) return;
        chartRef.current.resize();
    };

    const [wrapperRef] = useResizeObserver<HTMLDivElement>(handleResize);
    return (
        <div className="xs:h-80 h-full" ref={wrapperRef}>
            <Chart
                ref={chartRef}
                option={{
                    title: {
                        text: t('order.list.cod_amount'),
                        left: 'center',
                        top: 10,
                        textStyle: {
                            fontSize: 18,
                            fontWeight: 500,
                            fontFamily:
                                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
                        },
                        subtextStyle: {
                            fontSize: 14,
                            color: '#000',
                        },
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'shadow',
                        },
                    },
                    legend: {
                        data: [t('sales.invoice'), t('dashboard.chart.label.refund'), t('dashboard.chart.label.profit')],
                        bottom: 0,
                    },
                    toolbox: {
                        show: true,
                        orient: 'vertical',
                        left: 'right',
                        top: 'center',
                    },
                    xAxis: [
                        {
                            type: 'category',
                            axisTick: { show: false },
                            data: xAxisLabel,
                        },
                    ],
                    yAxis: [
                        {
                            type: 'value',
                            axisLabel: {
                                formatter: function (value: number) {
                                    if (value >= 1000000000) {
                                        return value / 1000000000 + 'B';
                                    } else if (value >= 1000000) {
                                        return value / 1000000 + 'M';
                                    } else if (value >= 1000) {
                                        return value / 1000 + 'K';
                                    }
                                    return value;
                                },
                            },
                        },
                    ],
                    series: [
                        {
                            name: t('sales.invoice'),
                            type: 'bar',
                            barGap: 0,
                            emphasis: {
                                focus: 'series',
                            },
                            data: revenueData,
                        },
                        {
                            name: t('dashboard.chart.label.refund'),
                            type: 'bar',
                            emphasis: {
                                focus: 'series',
                            },
                            data: returnData,
                        },
                        {
                            name: t('dashboard.chart.label.profit'),
                            type: 'bar',
                            emphasis: {
                                focus: 'series',
                            },
                            data: profitData,
                        },
                    ],
                }}
                className="!h-full"
            />
        </div>
    );
};

export default React.memo(MoneyTrend);

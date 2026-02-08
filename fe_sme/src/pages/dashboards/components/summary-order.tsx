import { apiGetDashboardSummaryOrder } from '@/api/dashboard.api';
import { useLocale } from '@/i18n';
import React, { useEffect, useMemo, useState } from 'react';

import Chart from '@/components/chart';
import CustomLegend from '@/components/chart/CustomLegend';

import useResizeObserver from '@/hooks/useResizeObserver';

import { ISummaryOrderData, SummaryOrderData } from '@/interface/dashboard';

type Props = {
    from: string;
    to: string;
};

const SummaryOrder: React.FC<Props> = (props: Props) => {
    const { from, to } = props;
    const { t } = useLocale();

    const [returnOrderData, setSummaryOrderData] = useState<ISummaryOrderData>(new SummaryOrderData());
    // const [visible, setVisible, modalKey] = useVisibleModal();
    // const [selectedStatus, setSelectedStatus] = useState<number[]>([]);
    const chartRef = React.useRef<any>(null);

    useEffect(() => {
        if (!from || !to) return;
        setTimeout(() => {
            initData();
        }, 500);
    }, [from, to]);

    const initData = async () => {
        const resp = await apiGetDashboardSummaryOrder(from, to);
        if (!resp?.succeeded) return;
        const data: ISummaryOrderData = resp?.data;
        setSummaryOrderData(data);
    };

    // const showDetailSummaryOrder = (status: number[]) => {
    //     if (!status?.length) return;
    //     setVisible(true);
    //     setSelectedStatus(status);
    // };

    // const handleLegendClick = ({ type, data }: { type: string; data: any }) => {
    //     if (type !== 'name') return;
    //     const mapStatus: { [key in string]: number[] } = {
    //         'dashboard.overview.draft': returnOrderData.draft.status,
    //         'global.status.approved': returnOrderData?.approved.status,
    //         'dashboard.chart.refund.returned': returnOrderData.returned.status,
    //         'global.status.rejected': returnOrderData?.rejected.status,
    //         'global.status.pending': returnOrderData.pending.status,
    //     };
    //     showDetailSummaryOrder(mapStatus[data.name]);
    // };

    const seriesData = useMemo(() => {
        return [
            { value: returnOrderData?.pending?.totalOrders || 0, name: 'global.status.pending' },
            { value: returnOrderData?.inProgress?.totalOrders || 0, name: 'global.status.in_progress' },
            { value: returnOrderData?.done?.totalOrders || 0, name: 'global.status.done' },
            { value: returnOrderData?.cancelled?.totalOrders || 0, name: 'global.status.cancelled' },
            { value: returnOrderData?.returned?.totalOrders || 0, name: 'dashboard.chart.refund.returned' },
        ];
    }, [returnOrderData]);

    const generateOption = () => {
        return {
            tooltip: {
                trigger: 'item',
                formatter: ({ marker, name, value }: { marker: React.ReactNode; name: string; value: string }) => {
                    return `${marker} ${t(name)}: ${value}`;
                },
            },
            legend: { show: false },
            series: [
                {
                    type: 'pie',
                    radius: ['40%', '70%'],
                    itemStyle: {
                        borderRadius: 10,
                    },

                    label: {
                        show: true,
                        position: 'inside',
                        formatter: (params: any) => (params.value === 0 ? '' : params.value),
                        color: '#000',
                        fontSize: 15,
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 14,
                            fontWeight: 'bold',
                        },
                    },
                    labelLine: {
                        show: true,
                        formatter: '{b}: {c}',
                    },
                    data: seriesData,
                },
            ],
        };
    };

    const handleResize = () => {
        if (!chartRef.current) return;
        chartRef.current.resize();
    };

    const [wrapperRef] = useResizeObserver<HTMLDivElement>(handleResize);
    return (
        <>
            <div className="relative flex flex-col flex-wrap justify-end gap-4 p-4 h-full min-h-96">
                <div className="absolute top-5 left-4">
                    <div className="font-medium text-lg">{t('dashboard.chart.refund.popup.list.order')}</div>
                </div>
                <div className="relative w-full grow" ref={wrapperRef}>
                    <Chart ref={chartRef} option={generateOption()} className="!py-0 !h-full" />
                    <div className="absolute -translate-x-2/4 -translate-y-2/4 left-2/4 top-2/4 font-medium">
                        {t('dashboard.chart.refund.total_order')}: {returnOrderData?.totalOrders}
                    </div>
                </div>

                <CustomLegend
                    chartRef={chartRef}
                    wrapperClassName="relative"
                    data={seriesData}
                    //  onItemClick={handleLegendClick}
                />
            </div>

            {/* <BaseModal
                open={visible}
                onCancel={() => setVisible(false)}
                centered={true}
                closable={false}
                footer={<></>}
                className="!w-[calc(100vw_-_20%)]"
            >
                <div key={modalKey}>
                    <ChartOrderStatus onCancel={() => setVisible(false)} orderStatus={selectedStatus} from={from} to={to} />
                </div>
            </BaseModal> */}
        </>
    );
};

export default React.memo(SummaryOrder);

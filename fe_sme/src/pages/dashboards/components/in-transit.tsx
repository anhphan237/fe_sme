import { apiGetDashboardInTransit } from '@/api/dashboard.api';
import BaseModal from '@/core/components/Modal/BaseModal';
import { useLocale } from '@/i18n';
import React, { useEffect, useMemo, useState } from 'react';

import Chart from '@/components/chart';
import CustomLegend from '@/components/chart/CustomLegend';

import useResizeObserver from '@/hooks/useResizeObserver';
import useVisibleModal from '@/hooks/useVisibleModal';

import { IInTransitData, InTransitData } from '@/interface/dashboard';


type Props = {
    from: string;
    to: string;
};

const mockInTransitDataLarge: IInTransitData = {
    totalOrders: 3250,
    percent: 28.5,
    shipping: {
        totalOrders: 850,
        percent: 26.2,
        status: [5, 12, 16, 29],
    },
    delay: {
        totalOrders: 620,
        percent: 19.1,
        status: [13, 17, 21, 30],
    },
    shipperDeliverDelay: {
        totalOrders: 480,
        percent: 14.8,
        status: [18, 22, 25, 31],
    },
    shipperDeliverFailed: {
        totalOrders: 380,
        percent: 11.7,
        status: [19, 23, 26, 32],
    },
    unDelivery: {
        totalOrders: 520,
        percent: 16.0,
        status: [14, 20, 24, 33],
    },
    shipped: {
        totalOrders: 400,
        percent: 12.3,
        status: [15, 27, 28, 34],
    },
};

const InTransit: React.FC<Props> = (props: Props) => {
    const { from, to } = props;
    const { t } = useLocale();

    const [inTransitData, setInTransitData] = useState<IInTransitData>(new InTransitData());
    const [visible, setVisible, modalKey] = useVisibleModal();
    const [selectedStatus, setSelectedStatus] = useState<number[]>([]);
    const chartRef = React.useRef<any>(null);

    useEffect(() => {
        if (!from || !to) return;
        setTimeout(() => {
            initData();
        }, 500);
    }, [from, to]);

    const initData = async () => {
        const resp = await apiGetDashboardInTransit(from, to);
        if (!resp?.succeeded) return;
        const data: IInTransitData = resp?.data;
        // setInTransitData(data);
        setInTransitData(mockInTransitDataLarge); // Mock data for testing
    };

    const showDetailInTransitOrder = (status: number[]) => {
        if (!status?.length) return;
        setVisible(true);
        setSelectedStatus(status);
    };

    const seriesData = useMemo(() => {
        return [
            { value: inTransitData?.shipping?.totalOrders || 0, name: 'dashboard.chart.in-transit.shipping' },
            { value: inTransitData?.delay?.totalOrders || 0, name: 'dashboard.chart.in-transit.delay' },
            {
                value: inTransitData?.shipperDeliverDelay?.totalOrders || 0,
                name: 'dashboard.chart.in-transit.shipper-deliver-delay',
            },
            {
                value: inTransitData?.shipperDeliverFailed?.totalOrders || 0,
                name: 'dashboard.chart.in-transit.shipper-deliver-failed',
            },
            { value: inTransitData?.unDelivery?.totalOrders || 0, name: 'dashboard.chart.in-transit.un-delivery' },
            { value: inTransitData?.shipped?.totalOrders || 0, name: 'dashboard.chart.in-transit.shipped' },
        ];
    }, [inTransitData]);

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
    const handleLegendClick = ({ type, data }: { type: string; data: any }) => {
        if (type !== 'name') return;
        const mapStatus: { [key in string]: number[] } = {
            'dashboard.chart.in-transit.shipping': inTransitData.shipping.status,
            'dashboard.chart.in-transit.delay': inTransitData.delay.status,
            'dashboard.chart.in-transit.shipper-deliver-delay': inTransitData.shipperDeliverDelay.status,
            'dashboard.chart.in-transit.shipper-deliver-failed': inTransitData.shipperDeliverFailed.status,
            'dashboard.chart.in-transit.un-delivery': inTransitData.unDelivery.status,
            'dashboard.chart.in-transit.shipped': inTransitData.shipped.status,
        };
        showDetailInTransitOrder(mapStatus[data.name]);
    };

    const handleResize = () => {
        if (!chartRef.current) return;
        chartRef.current.resize();
    };
    const [wrapperRef] = useResizeObserver<HTMLDivElement>(handleResize);

    return (
        <>
            <div className="relative flex flex-col flex-wrap justify-end gap-4 p-4 h-full">
                <div className="absolute top-5 left-4">
                    <div className="font-medium text-lg">{t('dashboard.chart.in-transit')}</div>
                </div>
                <div className="relative w-full grow" ref={wrapperRef}>
                    <Chart ref={chartRef} option={generateOption()} className="!py-0 !h-full" />
                    <div className="absolute -translate-x-2/4 -translate-y-2/4 left-2/4 top-2/4">
                        <div className="font-medium">
                            {t('dashboard.chart.in-transit.total_order')}: {inTransitData?.totalOrders}
                        </div>
                        <div className="font-medium">
                            {t('dashboard.chart.in-transit.percent_return')}: {inTransitData?.percent}%
                        </div>
                    </div>
                </div>
                <CustomLegend chartRef={chartRef} wrapperClassName="relative" data={seriesData} onItemClick={handleLegendClick} />
            </div>
        </>
    );
};

export default React.memo(InTransit);

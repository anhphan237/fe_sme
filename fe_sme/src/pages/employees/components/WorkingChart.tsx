import { Card, Select } from 'antd';
import React, { useMemo, useRef, useState } from 'react';

import Chart from '@/components/chart';
import CustomLegend from '@/components/chart/CustomLegend';

import useResizeObserver from '@/hooks/useResizeObserver';

import { ChartData } from '../types';

interface WorkingChartProps {
    genderData: ChartData[];
    positionData: ChartData[];
    departmentData: ChartData[];
    loading?: boolean;
}

type FilterMode = 'gender' | 'position' | 'department';

const WorkingChart: React.FC<WorkingChartProps> = ({ genderData, positionData, departmentData, loading = false }) => {
    const [filterType, setFilterType] = useState<FilterMode>('gender');
    const chartRef = useRef<any>(null);

    const dataMap = {
        gender: genderData,
        position: positionData,
        department: departmentData,
    };

    const titleMap = {
        gender: 'Phân bổ theo giới tính',
        position: 'Phân bổ theo vị trí',
        department: 'Phân bổ theo phòng ban',
    };

    const currentData = dataMap[filterType];

    const seriesData = useMemo(() => {
        return currentData.map(item => ({
            value: item.value,
            name: item.type,
        }));
    }, [currentData]);

    const totalCount = useMemo(() => {
        return seriesData.reduce((sum, item) => sum + item.value, 0);
    }, [seriesData]);

    const generateOption = () => {
        return {
            tooltip: {
                trigger: 'item',
                formatter: ({ marker, name, value }: { marker: React.ReactNode; name: string; value: string }) => {
                    return `${marker} ${name}: ${value} nhân viên`;
                },
            },
            legend: { show: false },
            series: [
                {
                    type: 'pie',
                    radius: ['50%', '85%'],
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
        <Card
            title={
                <div className="flex items-center gap-2 flex-nowrap">
                    <span className="font-medium text-sm whitespace-nowrap">{titleMap[filterType]}</span>
                    <Select
                        value={filterType}
                        onChange={value => setFilterType(value)}
                        size="small"
                        style={{ minWidth: 150 }}
                        options={[
                            { label: 'Giới tính', value: 'gender' },
                            { label: 'Vị trí', value: 'position' },
                            { label: 'Phòng ban', value: 'department' },
                        ]}
                    />
                </div>
            }
            loading={loading}
            className="shadow-sm h-full"
            bodyStyle={{
                height: 'calc(100% - 30px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
            }}
        >
            <div className="relative flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1" ref={wrapperRef}>
                    <Chart ref={chartRef} option={generateOption()} className="!py-0 !h-full" />

                    <div className="absolute -translate-x-2/4 -translate-y-2/4 left-2/4 top-2/4 font-medium text-center">
                        <div className="text-sm text-gray-500">Tổng số</div>
                        <div className="text-2xl font-bold">{totalCount}</div>
                        <div className="text-xs text-gray-400">nhân viên</div>
                    </div>
                </div>

                <div className="flex justify-start md:justify-start">
                    <CustomLegend chartRef={chartRef} wrapperClassName="relative w-48" data={seriesData} />
                </div>
            </div>
        </Card>
    );
};

export default React.memo(WorkingChart);

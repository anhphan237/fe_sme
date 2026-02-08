import { useLocale } from '@/i18n';
import { CheckCircleOutlined, ClockCircleOutlined, HeartOutlined, TeamOutlined } from '@ant-design/icons';
import { Skeleton } from 'antd';
import clsx from 'clsx';
import React from 'react';

import { EmployeeStats } from '../types';

type BoxType = 'probation' | 'official' | 'maternity' | 'other';

interface BoxProps {
    title: string | React.ReactNode;
    count: number;
    percentage?: number;
    type: BoxType;
    isLoading: boolean;
    display: { icon: React.ReactNode; iconBgColor: string };
}

const Box: React.FC<BoxProps> = ({ title, count, percentage, type, display, isLoading }) => {
    const { t } = useLocale();

    if (isLoading) {
        return (
            <div className={`bg-white rounded-2xl p-4 shadow-sm`}>
                <div className="flex items-start space-x-4">
                    <Skeleton.Avatar size={56} shape="circle" active />
                    <div className="flex flex-col flex-1 min-w-0">
                        <Skeleton.Input size="small" active className="!w-32 !h-5 mb-2" />
                        <Skeleton.Input size="large" active className="!w-full !h-10" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300 w-full relative flex justify-between items-center min-h-[120px]`}
        >
            {/* Title badge ở góc trên bên phải */}
            <div className="px-3 py-1 bg-white shadow text-center font-medium rounded-lg absolute top-[-12px] right-4 text-sm">
                <span>{title}</span>
            </div>

            {/* Icon circle */}
            <div className={`${display.iconBgColor} w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0`}>
                <div className="text-white text-2xl">{display.icon}</div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center items-end">
                <p className="text-5xl font-semibold">
                    {count}
                    <span className="text-sm font-normal ml-2">{t('employees.count')}</span>
                </p>
                {percentage !== undefined && (
                    <p className="flex gap-2 mt-1">
                        <span className={clsx('text-xs font-semibold italic', percentage > 0 ? 'text-green-600' : 'text-gray-500')}>
                            {percentage.toFixed(1)}% tổng số
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
};

interface StatsCardsProps {
    stats: EmployeeStats;
    loading?: boolean;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading = false }) => {
    const { t } = useLocale();

    const total = stats.probation + stats.official + stats.maternity + stats.other;

    const calculatePercentage = (value: number) => {
        return total > 0 ? (value / total) * 100 : 0;
    };

    return (
        <div className="h-full flex flex-row gap-4 items-stretch">
            <Box
                title={t('employees.status.probation')}
                count={stats.probation}
                percentage={calculatePercentage(stats.probation)}
                type="probation"
                isLoading={loading}
                display={{
                    icon: <ClockCircleOutlined />,
                    iconBgColor: 'bg-orange-600', // đậm hơn 1 bậc
                }}
            />
            <Box
                title={t('employees.status.official')}
                count={stats.official}
                percentage={calculatePercentage(stats.official)}
                type="official"
                isLoading={loading}
                display={{
                    icon: <CheckCircleOutlined />,
                    iconBgColor: 'bg-emerald-600',
                }}
            />
            <Box
                title={t('employees.status.maternity')}
                count={stats.maternity}
                percentage={calculatePercentage(stats.maternity)}
                type="maternity"
                isLoading={loading}
                display={{
                    icon: <HeartOutlined />,
                    iconBgColor: 'bg-purple-600',
                }}
            />
            <Box
                title={t('employees.status.other')}
                count={stats.other}
                percentage={calculatePercentage(stats.other)}
                type="other"
                isLoading={loading}
                display={{
                    icon: <TeamOutlined />,
                    iconBgColor: 'bg-blue-600',
                }}
            />
        </div>
    );
};

export default React.memo(StatsCards);

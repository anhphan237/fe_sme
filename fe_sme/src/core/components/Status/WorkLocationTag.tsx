import { useLocale } from '@/i18n';
import { Tag } from 'antd';

export const WORK_LOCATION_TYPE = {
    OFFICE: 1,
    HOME: 2,
    OTHER: 3,
    BUSINESS_TRIP: 4,
} as const;
export type WORK_LOCATION_TYPE = (typeof WORK_LOCATION_TYPE)[keyof typeof WORK_LOCATION_TYPE];

const WorkLocationTag = ({ value, className }: { value: WORK_LOCATION_TYPE; className?: string }) => {
    const { t } = useLocale();
    const statusMap: Record<WORK_LOCATION_TYPE, { label: string; color: string }> = {
        [WORK_LOCATION_TYPE.OFFICE]: { label: t('work_location.type.office'), color: 'bg-blue-500' },
        [WORK_LOCATION_TYPE.HOME]: { label: t('work_location.type.home'), color: 'bg-green-500' },
        [WORK_LOCATION_TYPE.OTHER]: { label: t('work_location.type.other'), color: 'bg-gray-500' },
        [WORK_LOCATION_TYPE.BUSINESS_TRIP]: { label: t('work_location.type.business_trip'), color: 'bg-purple-500' },
    };

    const status = statusMap[value];
    if (!status) {
        return null;
    }

    return (
        <Tag className={`inline-flex items-center px-2 py-1 text-xs font-medium text-white rounded ${status.color} ${className ?? ''}`}>
            {status.label}
        </Tag>
    );
};

export default WorkLocationTag;

import { useLocale } from '@/i18n';
import { Tag } from 'antd';

export const ATTENDANCE_STATUS = {
    PRESENT: 1,
    ABSENT: 2,
    LATE: 3,
    EARLY_LEAVE: 4,
    ON_LEAVE: 5,
    REMOTE: 6,
    BUSINESS_TRIP: 7,
    HOLIDAY: 8,
} as const;
export type ATTENDANCE_STATUS = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

const AttendanceStatusTag = ({ value, className }: { value: ATTENDANCE_STATUS; className?: string }) => {
    const { t } = useLocale();
    const statusMap: Record<ATTENDANCE_STATUS, { label: string; color: string }> = {
        [ATTENDANCE_STATUS.PRESENT]: { label: t('attendance.status.present'), color: 'bg-green-500' },
        [ATTENDANCE_STATUS.ABSENT]: { label: t('attendance.status.absent'), color: 'bg-red-500' },
        [ATTENDANCE_STATUS.LATE]: { label: t('attendance.status.late'), color: 'bg-yellow-500' },
        [ATTENDANCE_STATUS.EARLY_LEAVE]: { label: t('attendance.status.early_leave'), color: 'bg-orange-500' },
        [ATTENDANCE_STATUS.ON_LEAVE]: { label: t('attendance.status.on_leave'), color: 'bg-blue-500' },
        [ATTENDANCE_STATUS.REMOTE]: { label: t('attendance.status.remote'), color: 'bg-purple-500' },
        [ATTENDANCE_STATUS.BUSINESS_TRIP]: { label: t('attendance.status.business_trip'), color: 'bg-indigo-500' },
        [ATTENDANCE_STATUS.HOLIDAY]: { label: t('attendance.status.holiday'), color: 'bg-pink-500' },
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

export default AttendanceStatusTag;

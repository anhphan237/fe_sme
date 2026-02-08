import { useLocale } from '@/i18n';
import { Tag } from 'antd';

export const LEAVE_TYPE = {
    ANNUAL: 1,
    SICK: 2,
    PERSONAL: 3,
    UNPAID: 4,
    MATERNITY: 5,
    PATERNITY: 6,
    BEREAVEMENT: 7,
    COMPENSATORY: 8,
} as const;
export type LEAVE_TYPE = (typeof LEAVE_TYPE)[keyof typeof LEAVE_TYPE];

const LeaveTypeTag = ({ value, className }: { value: LEAVE_TYPE; className?: string }) => {
    const { t } = useLocale();
    const statusMap: Record<LEAVE_TYPE, { label: string; color: string }> = {
        [LEAVE_TYPE.ANNUAL]: { label: t('leave.type.annual'), color: 'bg-blue-500' },
        [LEAVE_TYPE.SICK]: { label: t('leave.type.sick'), color: 'bg-red-500' },
        [LEAVE_TYPE.PERSONAL]: { label: t('leave.type.personal'), color: 'bg-purple-500' },
        [LEAVE_TYPE.UNPAID]: { label: t('leave.type.unpaid'), color: 'bg-gray-500' },
        [LEAVE_TYPE.MATERNITY]: { label: t('leave.type.maternity'), color: 'bg-pink-500' },
        [LEAVE_TYPE.PATERNITY]: { label: t('leave.type.paternity'), color: 'bg-indigo-500' },
        [LEAVE_TYPE.BEREAVEMENT]: { label: t('leave.type.bereavement'), color: 'bg-slate-600' },
        [LEAVE_TYPE.COMPENSATORY]: { label: t('leave.type.compensatory'), color: 'bg-teal-500' },
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

export default LeaveTypeTag;

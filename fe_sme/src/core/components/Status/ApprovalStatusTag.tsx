import { useLocale } from '@/i18n';
import { Tag } from 'antd';

export const APPROVAL_STATUS = {
    PENDING: 1,
    APPROVED: 2,
    REJECTED: 3,
    CANCELLED: 4,
} as const;
export type APPROVAL_STATUS = (typeof APPROVAL_STATUS)[keyof typeof APPROVAL_STATUS];

const ApprovalStatusTag = ({ value, className }: { value: APPROVAL_STATUS; className?: string }) => {
    const { t } = useLocale();
    const statusMap: Record<APPROVAL_STATUS, { label: string; color: string }> = {
        [APPROVAL_STATUS.PENDING]: { label: t('approval.status.pending'), color: 'bg-yellow-500' },
        [APPROVAL_STATUS.APPROVED]: { label: t('approval.status.approved'), color: 'bg-green-500' },
        [APPROVAL_STATUS.REJECTED]: { label: t('approval.status.rejected'), color: 'bg-red-500' },
        [APPROVAL_STATUS.CANCELLED]: { label: t('approval.status.cancelled'), color: 'bg-gray-500' },
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

export default ApprovalStatusTag;

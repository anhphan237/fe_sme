import { useLocale } from '@/i18n';
import { Tag } from 'antd';

import { QUOTATION_TARGET_STATUS } from '@/constants/sales/quotation';

const ApproveTag = ({ value, className }: { value: QUOTATION_TARGET_STATUS; className?: string }) => {
    const { t } = useLocale();
    const statusMap: Record<QUOTATION_TARGET_STATUS, { label: string; color: string }> = {
        [QUOTATION_TARGET_STATUS.DRAFT]: { label: t('global.status.draft'), color: 'bg-gray-500' },
        [QUOTATION_TARGET_STATUS.REQUEST]: { label: t('global.status.pending'), color: 'bg-gray-500' },
        [QUOTATION_TARGET_STATUS.APPROVED]: { label: t('global.status.approved'), color: 'bg-green-500' },
        [QUOTATION_TARGET_STATUS.REJECTED]: { label: t('global.status.rejected'), color: 'bg-red-500' },
        [QUOTATION_TARGET_STATUS.CANCELLED]: { label: t('global.status.cancelled'), color: 'bg-red-500' },
        [QUOTATION_TARGET_STATUS.DONE]: { label: t('global.status.done'), color: 'bg-green-500' },
        [QUOTATION_TARGET_STATUS.INPROGRESS]: { label: t('global.status.in_progress'), color: 'bg-yellow-500' },
    };

    const status = statusMap[value];
    if (!status) {
        return null;
    }

    return (
        <Tag className={`inline-flex items-center px-2 py-1 text-xs font-medium text-white rounded ${status.color} ${className ?? ''} min-w-fit`}>
            {status.label}
        </Tag>
    );
};

export default ApproveTag;

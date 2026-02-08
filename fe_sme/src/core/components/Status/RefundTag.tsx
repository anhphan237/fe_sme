import { useLocale } from '@/i18n';
import { Tag } from 'antd';

export const COMMON_STATUS = {
    NOT_REFUND: 0,
    REFUNDED: 1,
} as const;
export type COMMON_STATUS = (typeof COMMON_STATUS)[keyof typeof COMMON_STATUS];
const RefundTag = ({ value, className }: { value: COMMON_STATUS; className?: string }) => {
    const { t } = useLocale();
    const statusMap: Record<COMMON_STATUS, { label: string; color: string }> = {
        [COMMON_STATUS.NOT_REFUND]: { label: t('sales.status.not_refund'), color: 'bg-gray-500' },
        [COMMON_STATUS.REFUNDED]: { label: t('sales.status.refunded'), color: 'bg-green-500' },
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

export default RefundTag;

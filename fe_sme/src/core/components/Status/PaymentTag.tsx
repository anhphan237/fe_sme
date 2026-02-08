import { useLocale } from '@/i18n';
import { Tag } from 'antd';

export const COMMON_STATUS = {
    PENDING: 0,
    PROCESSING: 1,
    PROCESSED: 2,
    REFUNDED: 3,
    CANCELLED: 4,
} as const;
export type COMMON_STATUS = (typeof COMMON_STATUS)[keyof typeof COMMON_STATUS];
const PaymentTag = ({ value, className }: { value: COMMON_STATUS; className?: string }) => {
    const { t } = useLocale();
    const statusMap: Record<COMMON_STATUS, { label: string; color: string }> = {
        [COMMON_STATUS.PENDING]: { label: t('sales.status.pending'), color: 'bg-gray-500' },
        [COMMON_STATUS.PROCESSING]: { label: t('sales.status.inprogress'), color: 'bg-yellow-500' },
        [COMMON_STATUS.PROCESSED]: { label: t('sales.status.paid'), color: 'bg-green-500' },
        [COMMON_STATUS.REFUNDED]: { label: t('sales.status.refunded'), color: 'bg-green-500' },
        [COMMON_STATUS.CANCELLED]: { label: t('global.status.cancelled'), color: 'bg-red-500' },
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

export default PaymentTag;

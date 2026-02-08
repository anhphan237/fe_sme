import { useLocale } from '@/i18n';
import { Tag } from 'antd';

export const COMMON_STATUS = {
    UnPaid: 0,
    Paid: 1,
} as const;
export type COMMON_STATUS = (typeof COMMON_STATUS)[keyof typeof COMMON_STATUS];
const PaymentSlipTag = ({ value, className }: { value: COMMON_STATUS; className?: string }) => {
    const { t } = useLocale();
    const statusMap: Record<COMMON_STATUS, { label: string; color: string }> = {
        [COMMON_STATUS.UnPaid]: { label: t('finance_accounting.payment_slip.status.unpaid'), color: 'bg-gray-500' },
        [COMMON_STATUS.Paid]: { label: t('finance_accounting.payment_slip.status.paid'), color: 'bg-green-500' },
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

export default PaymentSlipTag;

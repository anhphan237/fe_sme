import { useLocale } from '@/i18n';
import { Tag } from 'antd';

export const SHIFT_TYPE = {
    MORNING: 1,
    AFTERNOON: 2,
    NIGHT: 3,
    FULL_DAY: 4,
    FLEXIBLE: 5,
} as const;
export type SHIFT_TYPE = (typeof SHIFT_TYPE)[keyof typeof SHIFT_TYPE];

const ShiftTypeTag = ({ value, className }: { value: SHIFT_TYPE; className?: string }) => {
    const { t } = useLocale();
    const statusMap: Record<SHIFT_TYPE, { label: string; color: string }> = {
        [SHIFT_TYPE.MORNING]: { label: t('shift.type.morning'), color: 'bg-orange-500' },
        [SHIFT_TYPE.AFTERNOON]: { label: t('shift.type.afternoon'), color: 'bg-yellow-500' },
        [SHIFT_TYPE.NIGHT]: { label: t('shift.type.night'), color: 'bg-indigo-600' },
        [SHIFT_TYPE.FULL_DAY]: { label: t('shift.type.full_day'), color: 'bg-green-500' },
        [SHIFT_TYPE.FLEXIBLE]: { label: t('shift.type.flexible'), color: 'bg-purple-500' },
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

export default ShiftTypeTag;

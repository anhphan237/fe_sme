import { WarehouseStatus } from '@/enums/Warehouse';
import { useLocale } from '@/i18n';
import { Tag } from 'antd';

import { getWarehouseExportStatusLabel, getWarehouseStatusLabel } from '@/utils/helpers';

interface Props {
    value: WarehouseStatus;
    className?: string;
    type?: number;
}

const WarehouseTag = ({ value, className, type = 0 }: Props) => {
    const { t } = useLocale();

    const statusMap: Record<WarehouseStatus, { label: string; color: string }> = {
        [WarehouseStatus.NOT_PROCESSED]: {
            label: (type === 0 ? getWarehouseStatusLabel : getWarehouseExportStatusLabel)(WarehouseStatus.NOT_PROCESSED, t),
            color: 'bg-gray-400',
        },
        [WarehouseStatus.PARTIALLY_PROCESSED]: {
            label: (type === 0 ? getWarehouseStatusLabel : getWarehouseExportStatusLabel)(WarehouseStatus.PARTIALLY_PROCESSED, t),
            color: 'bg-yellow-500',
        },
        [WarehouseStatus.COMPLETED]: {
            label: (type === 0 ? getWarehouseStatusLabel : getWarehouseExportStatusLabel)(WarehouseStatus.COMPLETED, t),
            color: 'bg-green-500',
        },
        [WarehouseStatus.CANCELED]: {
            label: (type === 0 ? getWarehouseStatusLabel : getWarehouseExportStatusLabel)(WarehouseStatus.CANCELED, t),
            color: 'bg-red-500',
        },
    };

    const status = statusMap[value];
    if (!status) return null;

    return (
        <Tag className={`inline-flex items-center px-2 py-1 text-xs font-medium text-white rounded ${status.color} ${className ?? ''} min-w-fit`}>
            {status.label}
        </Tag>
    );
};

export default WarehouseTag;

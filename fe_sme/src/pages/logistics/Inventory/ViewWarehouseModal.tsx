import { useLocale } from '@/i18n';
import { Button, Drawer, Empty, Timeline } from 'antd';

import { formatNumber } from '@/utils/helpers';

interface IProps {
    dataTable: ColumnType[];
    onClose: () => void;
}

interface ColumnType {
    warehouseId: string;
    warehouseName: string;
    warehouseCode: string;
    baremTotal: number;
    quantityTotal: number;
}

const ViewWarehouseModal = ({ dataTable, onClose }: IProps) => {
    const { t } = useLocale();
    return (
        <Drawer
            title={t('logistics.statistical_details')}
            placement="right"
            onClose={onClose}
            open
            width={480}
            footer={
                <div className="text-end">
                    <Button type="primary" onClick={onClose}>
                        {t('global.popup.close')}
                    </Button>
                </div>
            }
        >
            {dataTable.length === 0 ? (
                <Empty description={t('global.no_data')} />
            ) : (
                <Timeline mode="left" className="mt-4 mr-2">
                    {dataTable.map((item, index) => (
                        <Timeline.Item
                            key={index}
                            label={
                                <div className="space-y-2">
                                    <div className="text-colorPrimary font-bold text-base truncate text-wrap">{item.warehouseName}</div>
                                    <div className="text-blue-600 font-semibold">{item.warehouseCode}</div>
                                </div>
                            }
                        >
                            <div className="space-y-2 text-gray-700 text-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <strong className="text-base invisible">{formatNumber(item.baremTotal)}</strong>
                                    <span className="lowercase invisible">{t('sales.product_barem')}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <strong className="text-base">{formatNumber(item.quantityTotal)}</strong>
                                    <span className="lowercase">{t('Quantity')}</span>
                                </div>
                            </div>
                        </Timeline.Item>
                    ))}
                </Timeline>
            )}
        </Drawer>
    );
};

export default ViewWarehouseModal;

import BaseModal from '@/core/components/Modal/BaseModal';
import { useLocale } from '@/i18n';

import BaseButton from '@/components/button';

import ExportWarehouse from './ExportWarehouse';

interface IProps {
    productId: string;
    onClose: () => void;
}

const ViewExportWarehouseModal = ({ productId, onClose }: IProps) => {
    const { t } = useLocale();
    return (
        <BaseModal
            styles={{
                wrapper: { width: '100%', maxHeight: 'calc(100vh_-_228px)' },
                content: { padding: 16, width: '100%', maxHeight: '100%' },
            }}
            width="calc(100vw - 128px)"
            open={!!productId}
            title={t('GoodsIssue')}
            onCancel={onClose}
            footer={false}
        >
            <ExportWarehouse productId={productId} tableProps={{ scroll: { y: '45vh' } }} />
            <div className="flex justify-end items-cExport pt-2 gap-2">
                <BaseButton type="primary" label={t('global.popup.close')} onClick={onClose} />
            </div>
        </BaseModal>
    );
};

export default ViewExportWarehouseModal;

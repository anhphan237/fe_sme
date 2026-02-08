import { LogisticStatusEnum } from '@/enums/LogisticStatus';
import { useLocale } from '@/i18n';
import { Radio } from 'antd';

type _T_Props = {
    status?: number;
    setStatus?: (val: number) => void;
};

export default function ConfirmStatus({ status, setStatus = () => {} }: _T_Props) {
    const { t } = useLocale();

    return (
        <div className="pt-4">
            <Radio.Group
                className="flex flex-col gap-1 text-lg"
                value={status}
                onChange={e => setStatus(e.target.value)}
                options={[
                    { value: LogisticStatusEnum.COMPLETED, label: t('global.status.done') },
                    { value: LogisticStatusEnum.CANCELED, label: t('logistics.order.cancel') },
                ]}
            />
        </div>
    );
}

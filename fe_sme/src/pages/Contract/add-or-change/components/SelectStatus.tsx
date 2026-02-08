import BaseSelect from '@/core/components/Select/BaseSelect';
import { useLocale } from '@/i18n';

export default function SelectStatus() {
    const { t } = useLocale();

    return (
        <BaseSelect
            name="contractStatus"
            label={t('contract.add.contract_status')}
            placeholder={t('contract.add.placeholder.contract_status')}
            options={[
                { label: t('contract.add.status.active'), value: 'active' },
                { label: t('contract.add.status.inactive'), value: 'inactive' },
                { label: t('contract.add.status.pending'), value: 'pending' },
            ]}
        />
    );
}

import BaseSelect from '@/core/components/Select/BaseSelect';
import { useLocale } from '@/i18n';

export default function SelectType() {
    const { t } = useLocale();

    return (
        <BaseSelect
            name="contractType"
            label={t('contract.add.contract_type')}
            placeholder={t('contract.add.placeholder.contract_type')}
            options={[
                { label: t('contract.add.type.fixed'), value: 'fixed' },
                { label: t('contract.add.type.permanent'), value: 'permanent' },
                { label: t('contract.add.type.internship'), value: 'internship' },
            ]}
        />
    );
}

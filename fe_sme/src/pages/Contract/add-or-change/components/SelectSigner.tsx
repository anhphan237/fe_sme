import BaseSelect from '@/core/components/Select/BaseSelect';
import { useLocale } from '@/i18n';

export default function SelectSigner() {
    const { t } = useLocale();

    return (
        <BaseSelect
            name="contractSigner"
            label={t('contract.add.contract_signer')}
            placeholder={t('contract.add.placeholder.contract_signer')}
            options={[
                { label: t('contract.add.signer.ceo'), value: 'ceo' },
                { label: t('contract.add.signer.hr'), value: 'hr' },
            ]}
        />
    );
}

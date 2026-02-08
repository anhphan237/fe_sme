import BaseSelect from '@/core/components/Select/BaseSelect';
import { useLocale } from '@/i18n';

export default function SelectJobPosition() {
    const { t } = useLocale();

    return (
        <BaseSelect
            name="jobPosition"
            label={t('contract.add.job_position')}
            placeholder={t('contract.add.placeholder.job_position')}
            options={[
                { label: t('contract.add.position.developer'), value: 'developer' },
                { label: t('contract.add.position.designer'), value: 'designer' },
                { label: t('contract.add.position.manager'), value: 'manager' },
            ]}
        />
    );
}

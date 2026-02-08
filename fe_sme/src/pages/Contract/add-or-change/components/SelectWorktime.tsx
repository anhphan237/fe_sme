import BaseSelect from '@/core/components/Select/BaseSelect';
import { useLocale } from '@/i18n';

export default function SelectWorktime() {
    const { t } = useLocale();

    return (
        <BaseSelect
            name="workForm"
            label={t('contract.add.work_form')}
            placeholder={t('contract.add.placeholder.work_form')}
            options={[
                { label: t('contract.add.work_form.full_time'), value: 'full_time' },
                { label: t('contract.add.work_form.part_time'), value: 'part_time' },
                { label: t('contract.add.work_form.remote'), value: 'remote' },
            ]}
        />
    );
}

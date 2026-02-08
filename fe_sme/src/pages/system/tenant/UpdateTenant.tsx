import { apiUpdateTenant } from '@/api/tenant.api';
import { RegexValidate } from '@/constants';
import BaseInput from '@/core/components/Input/InputWithLabel';
import BaseModal from '@/core/components/Modal/BaseModal';
import { useLocale } from '@/i18n';
import { Form } from 'antd';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import { ITenantList } from '@/interface/system';

interface IProps {
    onClose: () => void;
    initValue: ITenantList | null;
}

const UpdateTenant = ({ onClose, initValue }: IProps) => {
    const { t } = useLocale();
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        const values = await form.validateFields();
        const res = await apiUpdateTenant({ ...values, id: initValue?.id, code: initValue?.code });
        if (res.succeeded) {
            notify.success(t('message.update_success'));
            onClose();
        } else notify.error(t('message.failed'));
    };
    return (
        <BaseModal
            title={t('tenant.update')}
            open={!!initValue}
            onClose={onClose}
            onCancel={onClose}
            maskClosable={false}
            destroyOnClose
            width={800}
            footer={
                <div className="flex justify-end items-center pt-4 w-full gap-2">
                    <BaseButton label={t('global.popup.reject')} onClick={onClose} />
                    <BaseButton label={t('global.popup.save')} type="primary" onClick={handleSubmit} />
                </div>
            }
        >
            <Form
                name="form-update-tenant"
                layout="vertical"
                rootClassName="relative"
                className="w-full  grid grid-cols-2 gap-4 bg-white rounded-lg"
                autoComplete="off"
                form={form}
                initialValues={initValue ?? {}}
                preserve
                clearOnDestroy
            >
                <BaseInput
                    name="name"
                    label={t('tenant.name')}
                    placeholder={t('tenant.name')}
                    maxLength={200}
                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }], required: true }}
                />
                <BaseInput
                    name="shortName"
                    label={t('tenant.short_name')}
                    placeholder={t('tenant.short_name')}
                    maxLength={200}
                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }], required: true }}
                />
                <BaseInput
                    name="taxCode"
                    label={t('tenant.tax_code')}
                    placeholder={t('tenant.tax_code')}
                    maxLength={200}
                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }], required: true }}
                />

                <BaseInput
                    name="phoneNumber"
                    label={t('tenant.phone')}
                    placeholder={t('tenant.phone')}
                    maxLength={200}
                    formItemProps={{
                        rules: [
                            { required: true, message: t('global.message.required_field') },
                            { pattern: RegexValidate.PHONE, message: t('global.phone_number.format') },
                        ],
                        className: 'w-full',
                    }}
                />

                <BaseInput
                    name="contactPersonName"
                    label={t('tenant.contact_person')}
                    placeholder={t('tenant.contact_person')}
                    maxLength={200}
                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }], required: true }}
                />
                <BaseInput
                    name="contactPersonPhone"
                    label={t('tenant.contact_person_phone')}
                    placeholder={t('tenant.contact_person_phone')}
                    maxLength={200}
                    formItemProps={{
                        rules: [{ pattern: RegexValidate.PHONE, message: t('global.phone_number.format') }],
                        className: 'w-full',
                    }}
                />
                <BaseInput
                    name="bankAccountName"
                    label={t('tenant.bank_account_name')}
                    placeholder={t('tenant.bank_account_name')}
                    maxLength={200}
                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }], required: true }}
                />
                <BaseInput
                    name="bankAccountNumber"
                    label={t('tenant.bank_account_number')}
                    placeholder={t('tenant.bank_account_number')}
                    maxLength={200}
                    formItemProps={{
                        required: true,
                        rules: [
                            { required: true, message: t('global.message.required_field') },
                            { pattern: RegexValidate.INTEGER, message: t('global.account_number.format') },
                        ],
                        className: 'w-full',
                    }}
                />
                <BaseInput
                    name="bankName"
                    label={t('tenant.bank_name')}
                    placeholder={t('tenant.bank_name')}
                    maxLength={200}
                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }], required: true }}
                />

                <BaseInput
                    name="bankBranch"
                    label={t('tenant.bank_branch')}
                    placeholder={t('tenant.bank_branch')}
                    maxLength={200}
                    formItemProps={{ rules: [{ required: true, message: t('global.message.required_field') }], required: true }}
                />
                <BaseInput
                    name="email"
                    label={t('global.tips.email')}
                    placeholder={t('global.tips.email')}
                    maxLength={200}
                    formItemProps={{
                        rules: [
                            { required: true, message: t('global.message.required_field') },
                            { pattern: RegexValidate.EMAIL, message: t('global.email.format') },
                        ],
                        required: true,
                    }}
                />
                <BaseInput name="address" label={t('tenant.address')} placeholder={t('tenant.address')} maxLength={200} />
            </Form>
        </BaseModal>
    );
};

export default UpdateTenant;

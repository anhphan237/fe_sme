import { AppRouters } from '@/constants';
import BaseDatePicker from '@/core/components/DatePicker';
import BaseFormItem from '@/core/components/Form/BaseFormItem';
import BaseInputNumber from '@/core/components/Input/BaseNumberInput';
import BaseInput from '@/core/components/Input/InputWithLabel';
import { useLocale } from '@/i18n';
import { Form, Input, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import BaseButton from '@/components/button';

import { IContract } from '@/interface/contract';

import SelectJobPosition from './components/SelectJobPosition';
import SelectSigner from './components/SelectSigner';
import SelectStatus from './components/SelectStatus';
import SelectType from './components/SelectType';
import SelectWorktime from './components/SelectWorktime';
import UploadAttack from './components/UploadAttack';

export default function AddOrChangeContract() {
    const [form] = Form.useForm<IContract>();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const { t } = useLocale();
    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        if (!params?.id) return;
        setLoading(true);
        // getContractDetailApi(params.id)
        //   .then(res => {
        //     const data = res.data;
        //     form.setFieldsValue({
        //       ...data,
        //       signingDate: data.signingDate ? dayjs(data.signingDate) : undefined,
        //       effectiveDate: data.effectiveDate ? dayjs(data.effectiveDate) : undefined,
        //       expirationDate: data.expirationDate ? dayjs(data.expirationDate) : undefined,
        //     });
        //   })
        //   .finally(() => setLoading(false));
    }, [params, form]);

    const handleSubmit = async (values: IContract) => {
        setSaving(true);
        try {
            // const payload = {
            //   ...values,
            //   signingDate: values.signingDate?.format('YYYY-MM-DD'),
            //   effectiveDate: values.effectiveDate?.format('YYYY-MM-DD'),
            //   expirationDate: values.expirationDate?.format('YYYY-MM-DD'),
            // };
            // await saveContractApi(params.id, payload);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spin className="flex justify-center mt-10" />;

    return (
        <div className="mx-4 h-full p-6 bg-white rounded-lg shadow">
            <Form<IContract>
                form={form}
                className="h-full flex flex-col"
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{ salaryRate: 100 }}
            >
                <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        <BaseInput
                            name="employeeCode"
                            label={t('contract.add.employee_code')}
                            placeholder={t('contract.add.placeholder.employee_code')}
                            formItemProps={{ rules: [{ required: true, message: t('contract.add.required.employee_code') }] }}
                        />
                        <BaseInput
                            name="contractNumber"
                            label={t('contract.add.contract_number')}
                            placeholder={t('contract.add.placeholder.contract_number')}
                            formItemProps={{ rules: [{ required: true, message: t('contract.add.required.contract_number') }] }}
                        />
                        <SelectWorktime />

                        <BaseInput
                            name="employeeName"
                            label={t('contract.add.employee_name')}
                            placeholder={t('contract.add.placeholder.employee_name')}
                            formItemProps={{ rules: [{ required: true, message: t('contract.add.required.employee_name') }] }}
                        />
                        <SelectType />
                        <BaseDatePicker name="signingDate" label={t('contract.add.signing_date')} className="w-full" />

                        <SelectJobPosition />
                        <SelectSigner />
                        <BaseDatePicker name="effectiveDate" label={t('contract.add.effective_date')} className="w-full" />

                        <BaseInputNumber
                            name="baseSalary"
                            label={t('contract.add.base_salary')}
                            placeholder={t('contract.add.placeholder.base_salary')}
                        />
                        <SelectStatus />
                        <BaseDatePicker name="expirationDate" label={t('contract.add.expiration_date')} className="w-full" />

                        <BaseInputNumber
                            name="insuranceSalary"
                            label={t('contract.add.insurance_salary')}
                            placeholder={t('contract.add.placeholder.insurance_salary')}
                        />

                        <BaseInputNumber
                            name="salaryRate"
                            label={t('contract.add.salary_rate')}
                            placeholder={t('contract.add.placeholder.salary_rate')}
                        />

                        <BaseFormItem name="note" label={t('contract.add.note')}>
                            <Input.TextArea rows={3} placeholder={t('contract.add.placeholder.note')} />
                        </BaseFormItem>

                        <UploadAttack />
                    </div>
                </div>

                <div className="flex justify-end mt-8 gap-2">
                    <BaseButton onClick={() => navigate(AppRouters.CONTRACT)} type="default" label={t('contract.add.cancel')} />
                    <BaseButton
                        htmlType="submit"
                        type="primary"
                        loading={saving}
                        label={params?.id ? t('contract.add.update') : t('contract.add.create')}
                    />
                </div>
            </Form>
        </div>
    );
}

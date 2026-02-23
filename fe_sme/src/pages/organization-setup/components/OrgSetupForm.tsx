import BaseSelect from '@/core/components/Select/BaseSelect';
import { useLocale } from '@/i18n';
import { Form, Input } from 'antd';
import { useRef, useState } from 'react';

import BaseButton from '@/components/button';

import useOrgSetup from '@/hooks/useOrgSetup';

import type { CompanySize, Industry, OrgSetupParams, Timezone } from '@/interface/organization';

export default function OrgSetupForm() {
    const { t } = useLocale();
    const [antForm] = Form.useForm<OrgSetupParams>();
    const { loading, handleOrgSetup } = useOrgSetup();

    const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
        { value: '1-10', label: t('org.setup.size.1-10') },
        { value: '11-50', label: t('org.setup.size.11-50') },
        { value: '51-200', label: t('org.setup.size.51-200') },
        { value: '201-500', label: t('org.setup.size.201-500') },
        { value: '500+', label: t('org.setup.size.500+') },
    ];

    const INDUSTRIES: { value: Industry; label: string }[] = [
        { value: 'technology', label: t('org.setup.industry.technology') },
        { value: 'finance', label: t('org.setup.industry.finance') },
        { value: 'healthcare', label: t('org.setup.industry.healthcare') },
        { value: 'retail', label: t('org.setup.industry.retail') },
        { value: 'manufacturing', label: t('org.setup.industry.manufacturing') },
        { value: 'education', label: t('org.setup.industry.education') },
        { value: 'logistics', label: t('org.setup.industry.logistics') },
        { value: 'other', label: t('org.setup.industry.other') },
    ];

    const TIMEZONES: { value: Timezone; label: string }[] = [
        { value: 'Asia/Ho_Chi_Minh', label: t('org.setup.timezone.hcm') },
        { value: 'Asia/Bangkok', label: t('org.setup.timezone.bangkok') },
        { value: 'Asia/Singapore', label: t('org.setup.timezone.singapore') },
        { value: 'Asia/Tokyo', label: t('org.setup.timezone.tokyo') },
        { value: 'Asia/Seoul', label: t('org.setup.timezone.seoul') },
        { value: 'UTC', label: t('org.setup.timezone.utc') },
    ];
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setLogoPreview(base64);
            antForm.setFieldValue('logoBase64', base64);
        };
        reader.readAsDataURL(file);
    };

    return (
        <Form
            form={antForm}
            layout="vertical"
            onFinish={handleOrgSetup}
            initialValues={{
                companySize: '1-10' as CompanySize,
                industry: 'technology' as Industry,
                timezone: 'Asia/Ho_Chi_Minh' as Timezone,
            }}
        >
            {/* Logo Upload */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('org.setup.logo_label')}</label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                >
                    {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="h-16 w-auto object-contain rounded" />
                    ) : (
                        <>
                            <span className="text-xs text-gray-400">{t('org.setup.logo_upload_hint')}</span>
                        </>
                    )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
                <Form.Item name="logoBase64" hidden>
                    <Input />
                </Form.Item>
            </div>

            <Form.Item
                name="companyName"
                label={t('org.setup.company_name')}
                rules={[{ required: true, message: t('org.setup.company_name.required') }]}
            >
                <Input placeholder={t('org.setup.company_name.placeholder')} />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
                <BaseSelect name="companySize" label={t('org.setup.company_size')} options={COMPANY_SIZES} />
                <BaseSelect name="industry" label={t('org.setup.industry')} options={INDUSTRIES} />
            </div>

            <BaseSelect name="timezone" label={t('org.setup.timezone')} options={TIMEZONES} />

            <BaseButton htmlType="submit" type="primary" loading={loading} label="org.setup.submit" className="w-full mt-2" />
        </Form>
    );
}

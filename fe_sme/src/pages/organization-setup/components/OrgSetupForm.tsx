import BaseSelect from '@/core/components/Select/BaseSelect';
import { Form, Input } from 'antd';
import { useRef, useState } from 'react';

import BaseButton from '@/components/button';

import useOrgSetup from '@/hooks/useOrgSetup';

import type { CompanySize, Industry, OrgSetupParams, Timezone } from '@/interface/organization';

const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
    { value: '1-10', label: '1 â€“ 10 nhÃ¢n viÃªn' },
    { value: '11-50', label: '11 â€“ 50 nhÃ¢n viÃªn' },
    { value: '51-200', label: '51 â€“ 200 nhÃ¢n viÃªn' },
    { value: '201-500', label: '201 â€“ 500 nhÃ¢n viÃªn' },
    { value: '500+', label: 'TrÃªn 500 nhÃ¢n viÃªn' },
];

const INDUSTRIES: { value: Industry; label: string }[] = [
    { value: 'technology', label: 'CÃ´ng nghá»‡ thÃ´ng tin' },
    { value: 'finance', label: 'TÃ i chÃ­nh â€“ NgÃ¢n hÃ ng' },
    { value: 'healthcare', label: 'Y táº¿ â€“ Sá»©c khá»e' },
    { value: 'retail', label: 'BÃ¡n láº» â€“ ThÆ°Æ¡ng máº¡i' },
    { value: 'manufacturing', label: 'Sáº£n xuáº¥t â€“ CÃ´ng nghiá»‡p' },
    { value: 'education', label: 'GiÃ¡o dá»¥c â€“ ÄÃ o táº¡o' },
    { value: 'logistics', label: 'Logistics â€“ Váº­n chuyá»ƒn' },
    { value: 'other', label: 'KhÃ¡c' },
];

const TIMEZONES: { value: Timezone; label: string }[] = [
    { value: 'Asia/Ho_Chi_Minh', label: '(GMT+7) HÃ  Ná»™i / TP. HCM' },
    { value: 'Asia/Bangkok', label: '(GMT+7) Bangkok' },
    { value: 'Asia/Singapore', label: '(GMT+8) Singapore' },
    { value: 'Asia/Tokyo', label: '(GMT+9) Tokyo' },
    { value: 'Asia/Seoul', label: '(GMT+9) Seoul' },
    { value: 'UTC', label: '(GMT+0) UTC' },
];

export default function OrgSetupForm() {
    const [antForm] = Form.useForm<OrgSetupParams>();
    const { loading, handleOrgSetup } = useOrgSetup();
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo cÃ´ng ty</label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                >
                    {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="h-16 w-auto object-contain rounded" />
                    ) : (
                        <>
                            <span className="text-2xl mb-1">ðŸ–¼ï¸</span>
                            <span className="text-xs text-gray-400">Click Ä‘á»ƒ táº£i logo lÃªn (PNG, JPG)</span>
                        </>
                    )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
                <Form.Item name="logoBase64" hidden>
                    <Input />
                </Form.Item>
            </div>

            <Form.Item name="companyName" label="TÃªn cÃ´ng ty" rules={[{ required: true, message: 'Vui lÃ²ng nháº­p tÃªn cÃ´ng ty' }]}>
                <Input placeholder="VD: CÃ´ng ty TNHH ABC" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
                <BaseSelect name="companySize" label="Quy mÃ´" options={COMPANY_SIZES.map(s => ({ value: s.value, label: s.label }))} />
                <BaseSelect name="industry" label="NgÃ nh nghá»" options={INDUSTRIES.map(i => ({ value: i.value, label: i.label }))} />
            </div>

            <BaseSelect name="timezone" label="MÃºi giá»" options={TIMEZONES.map(tz => ({ value: tz.value, label: tz.label }))} />

            <BaseButton htmlType="submit" type="primary" loading={loading} label="Tiáº¿p theo â†’" className="w-full mt-2" />
        </Form>
    );
}

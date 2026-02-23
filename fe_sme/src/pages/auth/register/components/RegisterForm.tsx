import BaseInput from '@/core/components/Input/InputWithLabel';
import { useLocale } from '@/i18n';
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Form, Input } from 'antd';

import BaseButton from '@/components/button';

import useRegister from '@/hooks/useRegister';

import type { RegisterParams } from '@/interface/auth';

const INITIAL_VALUES: Partial<RegisterParams> = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
};

const RegisterForm: React.FC = () => {
    const { t } = useLocale();
    const { handleRegister, loading } = useRegister();
    const [form] = Form.useForm<RegisterParams>();

    const requiredMsg = t('global.message.required_field');
    const inputClass = '!mb-2 !h-10 sm:!h-11 md:!h-12 rounded-lg';

    return (
        <Form form={form} layout="vertical" initialValues={INITIAL_VALUES} onFinish={handleRegister} className="space-y-1">
            {/* Họ tên */}
            <BaseInput
                name="fullName"
                label={<span className="font-medium">{t('global.register.fullName')}</span>}
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder={t('global.register.fullName.placeholder')}
                size="large"
                className={inputClass}
                formItemProps={{
                    className: '!mb-3',
                    rules: [{ required: true, message: requiredMsg }],
                }}
            />

            {/* Email */}
            <BaseInput
                name="email"
                label={<span className="font-medium">{t('global.register.email')}</span>}
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="hr@company.com"
                size="large"
                className={inputClass}
                formItemProps={{
                    className: '!mb-3',
                    rules: [
                        { required: true, message: requiredMsg },
                        { type: 'email', message: t('global.register.email.invalid') },
                    ],
                }}
            />

            {/* Số điện thoại (không bắt buộc) */}
            <BaseInput
                name="phone"
                label={<span className="font-medium">{t('global.register.phone')}</span>}
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="0901234567"
                size="large"
                className={inputClass}
                formItemProps={{ className: '!mb-3' }}
            />

            {/* Mật khẩu */}
            <Form.Item
                name="password"
                label={<span className="font-medium">{t('global.register.password')}</span>}
                className="!mb-3"
                rules={[
                    { required: true, message: requiredMsg },
                    { min: 8, message: t('global.register.password.minLength') },
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder={t('global.register.password.placeholder')}
                    size="large"
                    className={inputClass}
                />
            </Form.Item>

            {/* Xác nhận mật khẩu */}
            <Form.Item
                name="confirmPassword"
                label={<span className="font-medium">{t('global.register.confirmPassword')}</span>}
                className="!mb-4"
                dependencies={['password']}
                rules={[
                    { required: true, message: requiredMsg },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error(t('global.register.confirmPassword.mismatch')));
                        },
                    }),
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder={t('global.register.confirmPassword.placeholder')}
                    size="large"
                    className={inputClass}
                />
            </Form.Item>

            <BaseButton type="primary" htmlType="submit" loading={loading} block size="large" className="!h-11 !rounded-lg !font-semibold">
                {t('global.register.submit')}
            </BaseButton>
        </Form>
    );
};

export default RegisterForm;

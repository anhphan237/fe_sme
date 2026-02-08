import { apiGetTenants } from '@/api/tenant.api';
import { forgotPassword } from '@/api/user.api';
import { RegexValidate } from '@/constants';
import BaseCheckbox from '@/core/components/Checkbox';
import BaseFormItem from '@/core/components/Form/BaseFormItem';
import BaseInput from '@/core/components/Input/InputWithLabel';
import ConfirmModal, { CONFIRM_CODE, ConfirmModalHandles } from '@/core/components/Modal/ConfirmModal';
import BaseSelect from '@/core/components/Select/BaseSelect';
import { useLocale } from '@/i18n';
import { GoogleCircleFilled, LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Form, Input } from 'antd';
import { useRef, useState } from 'react';

import BaseButton from '@/components/button';
import { notify } from '@/components/toast-message';

import useLogin from '@/hooks/useLogin';

import googleIcon from '@/assets/icons/google.svg';

import { ITenant } from '@/interface/tenant';
import { LoginParams } from '@/interface/user';

const INITIAL_VALUES: Partial<LoginParams> = {
    account: '',
    password: '',
    rememberMe: true,
    tenantId: undefined,
};

const LoginFormSection: React.FC = () => {
    const { t } = useLocale();
    const { handleLogin, loading, ipAddress } = useLogin();
    const [mode, setMode] = useState<'login' | 'forgotPassword'>('login');
    const confirmRef = useRef<ConfirmModalHandles>(null);
    const isLogin = mode === 'login';
    const inputClass = '!mb-2 !h-10 sm:!h-11 md:!h-12 rounded-lg transition-all duration-300 hover:shadow-lg focus:shadow-lg';
    const requiredFieldMsg = t('global.message.required_field');
    type Option = { value: string; label: string };

    const { data: companyOptions = [], isLoading } = useQuery<Option[]>({
        queryKey: ['tenants'],
        queryFn: async () => {
            const res = await apiGetTenants({ loading: false });
            const list: ITenant[] = Array.isArray(res?.data) ? res.data : [];
            return list.map(item => ({ value: item.id, label: item.name }));
        },
        enabled: isLogin,
        retry: 1,
    });

    const handleLoginSubmit = async (values: LoginParams) => {
        localStorage.clear();
        await handleLogin(values);
    };
    const handleForgotPasswordSubmit = async (values: LoginParams) => {
        const { code } = (await confirmRef.current?.open()) ?? {};
        if (code !== CONFIRM_CODE.CONFIRMED) return;
        try {
            await forgotPassword(values.account);
            notify.success(`${t('global.forgotpassword.success')} ${values.account}`);
        } catch {
            notify.error(t('global.forgotpassword.failed'));
        }
    };
    const handleSubmit = async (values: LoginParams) => {
        if (isLogin) await handleLoginSubmit(values);
        else await handleForgotPasswordSubmit(values);
    };
    const submitLabelKey = !isLogin ? 'global.send' : 'global.tips.login';
    const submitIcon = !isLogin ? <MailOutlined /> : <UserOutlined />;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    const loginSection = (
        <>
            <BaseSelect
                name="tenantId"
                label={<span className="text-black/90 font-medium">{t('login.company')}</span>}
                formItemProps={{
                    className: '!mb-2',
                    rules: isLogin ? [{ required: true, message: requiredFieldMsg }] : [],
                }}
                size="large"
                placeholder={isLoading ? t('global.tips.loading') : t('login.select_company')}
                className={inputClass}
                allowClear
                options={companyOptions}
                loading={isLoading}
                disabled={isLoading}
                notFoundContent={isLoading ? t('global.tips.loading') : t('global.no_data')}
            />
            <BaseInput
                name="account"
                label={<span className="text-black/90 font-medium"> {t('global.tips.account')}</span>}
                formItemProps={{
                    className: '!mb-3',
                    rules: [
                        { required: true, message: requiredFieldMsg },
                        // { pattern: RegexValidate.USERNAME_OR_PHONE, message: t('global.tips.message.invalid_account') },
                    ],
                }}
                size="large"
                allowClear
                autoComplete="username"
                placeholder={t('global.tips.account_placeholder')}
                className={inputClass}
                prefix={<UserOutlined className="text-gray-400" />}
            />
            <BaseFormItem
                label={<span className="text-black/90 font-medium">{t('global.tips.password')}</span>}
                name="password"
                rules={isLogin ? [{ required: true, message: t('global.tips.enterPasswordMessage') }] : []}
            >
                <Input.Password
                    size="large"
                    autoComplete="current-password"
                    placeholder={t('login.password_placeholder')}
                    className={inputClass}
                    prefix={<LockOutlined className="text-gray-400" />}
                />
            </BaseFormItem>
            <div className="flex justify-between items-center">
                <BaseCheckbox name="rememberMe" labelCheckbox={t('global.tips.rememberUser')} className="text-black/90" />
                <p onClick={() => setMode('forgotPassword')} className="hover:underline hover:cursor-pointer">
                    {t('global.tips.forgotPassword')}?
                </p>
            </div>
            <BaseFormItem className="mt-6 mb-4">
                <BaseButton
                    htmlType="submit"
                    type="primary"
                    size="large"
                    className="w-full h-10 sm:h-11 md:h-12 bg-colorPrimary text-white !border-none font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    loading={loading}
                    icon={submitIcon}
                    label={submitLabelKey}
                />

                {/* <div className="h-[1px] bg-gray-300 m-5"></div>

                <BaseButton
                    htmlType="button"
                    type="default"
                    size="large"
                    className="w-full h-10 sm:h-11 md:h-12 text-black font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
                    loading={loading}
                    icon={<img className='h-5' src={googleIcon} />}
                    label={t('global.tips.login.google')}
                /> */}
            </BaseFormItem>
        </>
    );

    const forgotPasswordSection = (
        <>
            <BaseInput
                name="account"
                label={<span className="text-black/90 font-medium">{t('global.tips.account')}</span>}
                formItemProps={{
                    rules: [
                        { required: true, message: requiredFieldMsg },
                        { pattern: RegexValidate.USERNAME_OR_PHONE, message: t('global.tips.message.invalid_account') },
                    ],
                }}
                size="large"
                allowClear
                autoComplete="username"
                placeholder={t('global.tips.account_placeholder')}
                className={inputClass}
                prefix={<UserOutlined className="text-gray-400" />}
            />
            <p className="my-6 bg-blue-50/20 border border-white/30 rounded-lg p-4 text-black/90 text-sm text-center flex items-center justify-center gap-2">
                <MailOutlined className="text-black/80" />
                {t('login.forgot_password.hint')}
            </p>
            <BaseFormItem className="mt-8 mb-4">
                <BaseButton
                    htmlType="submit"
                    type="primary"
                    size="large"
                    className="w-full h-10 sm:h-11 md:h-12 bg-colorPrimary text-white !border-none font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    loading={loading}
                    icon={submitIcon}
                    label={submitLabelKey}
                />
                <BaseButton
                    htmlType="button"
                    type="default"
                    size="large"
                    onClick={() => setMode('login')}
                    className="mt-3 w-full h-10 text-sm text-gray-500"
                    label={t('global.tips.login')}
                />
            </BaseFormItem>
        </>
    );

    return (
        <div className="flex items-center justify-center">
            <div className=" p-8 max-w-xl w-full sm:p-6 sm:rounded-2xl">
                <div className="relative text-black rounded-2xl">
                    <div className="mt-2 text-center animate-fadeIn">
                        <h3 className="font-bold text-3xl text-gray-900">{t('login.welcome_title')}</h3>
                        <p className="mt-3 text-gray-600 text-base">{t('login.welcome_subtitle')}</p>
                    </div>
                    <div
                        className="pointer-events-none absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'radial-gradient(white 1px, transparent 1px), radial-gradient(white 1px, transparent 1px)',
                            backgroundSize: '50px 50px',
                        }}
                    />
                    <div className="relative p-4 md:p-2 lg:p-3 h-full flex flex-col justify-between">
                        <div className="overflow-hidden flex-1">
                            {/* Form */}
                            <div className="md:mt-3 flex-1 flex flex-col justify-center">
                                <Form<LoginParams>
                                    onFinish={handleSubmit}
                                    initialValues={INITIAL_VALUES}
                                    onKeyDown={handleKeyDown}
                                    layout="vertical"
                                    className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-md mx-auto bg-white/15 rounded-2xl ring-1 ring-white/20"
                                >
                                    {isLogin ? loginSection : forgotPasswordSection}
                                </Form>
                            </div>
                        </div>

                        <div className="mt-2 md:mt-0 inline-flex items-center gap-2 font-mono text-xs md:text-sm text-black/80 px-2 md:px-3 py-1 md:py-1.5 rounded-full mx-auto">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            IP: {ipAddress}
                        </div>

                        <div className="inline-flex items-center justify-center gap-2 rounded-full mt-2 text-xs text-black/70 text-center">
                            <LockOutlined className="text-xs text-green-300" />
                            {t('login.security_notice')}
                        </div>
                    </div>
                    <ConfirmModal ref={confirmRef} title={t('global.confirm')} message={t('global.forgotpassword.confirmMessage')} />
                </div>
            </div>
        </div>
    );
};
export default LoginFormSection;

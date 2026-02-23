import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { ArrowLeftOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';

import AppLogo from '@/assets/logo/exps-removebg.png';

import RegisterForm from './components/RegisterForm';

export default function RegisterPage() {
    const { t } = useLocale();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400 rounded-full opacity-10 blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            {/* Back button */}
            <button
                onClick={() => navigate(AppRouters.HOME)}
                className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
                <ArrowLeftOutlined className="text-xs" />
                {t('register.page.back_home')}
            </button>

            <div className="w-full max-w-md relative">
                {/* Brand */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2.5 mb-5 cursor-pointer" onClick={() => navigate(AppRouters.HOME)}>
                        <img src={AppLogo} alt="Logo" className="h-9 w-auto" />
                        <span className="text-xl font-bold text-white">SME-Onboard</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{t('register.page.title')}</h1>
                    <p className="text-sm text-blue-200/80">{t('register.page.subtitle')}</p>
                </div>

                {/* Stepper */}
                <OnboardingStepper currentStep={0} />

                {/* Form card */}
                <div className="mt-5 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-blue-900/40 border border-white/20 p-6 sm:p-7">
                    <RegisterForm />

                    <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
                        {t('register.page.have_account')}{' '}
                        <Link to={AppRouters.LOGIN} className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                            {t('register.page.login')}
                        </Link>
                    </div>
                </div>

                {/* Terms */}
                <p className="mt-4 text-center text-xs text-blue-300/60 leading-relaxed">
                    {t('register.page.terms')}{' '}
                    <a href="#" className="text-blue-300 hover:text-white underline underline-offset-2 transition-colors">
                        {t('register.page.terms_link')}
                    </a>{' '}
                    &{' '}
                    <a href="#" className="text-blue-300 hover:text-white underline underline-offset-2 transition-colors">
                        {t('register.page.privacy_link')}
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}

export const ONBOARDING_STEPS_KEYS = ['register.stepper.account', 'register.stepper.org', 'register.stepper.plan'];

type StepperVariant = 'dark' | 'light';

export function OnboardingStepper({ currentStep, variant = 'dark' }: { currentStep: number; variant?: StepperVariant }) {
    const { t } = useLocale();
    const steps = ONBOARDING_STEPS_KEYS.map((key, i) => ({ label: t(key), icon: String(i + 1) }));

    const isDark = variant === 'dark';

    return (
        <div className="flex items-start justify-center gap-0 px-2">
            {steps.map((step, idx) => (
                <div key={idx} className="flex items-start">
                    {/* Circle + label */}
                    <div className="flex flex-col items-center w-24">
                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                idx < currentStep
                                    ? isDark
                                        ? 'bg-blue-400 text-white'
                                        : 'bg-blue-500 text-white'
                                    : idx === currentStep
                                      ? isDark
                                          ? 'bg-white text-blue-700 ring-4 ring-blue-400/40 shadow-lg'
                                          : 'bg-blue-600 text-white ring-4 ring-blue-200 shadow-md'
                                      : isDark
                                        ? 'bg-white/15 text-blue-300 border border-white/20'
                                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                            }`}
                        >
                            {idx < currentStep ? <CheckCircleFilled className="text-base" /> : step.icon}
                        </div>
                        <span
                            className={`mt-1.5 text-[11px] text-center leading-tight transition-colors ${
                                idx === currentStep
                                    ? isDark
                                        ? 'text-white font-semibold'
                                        : 'text-blue-700 font-semibold'
                                    : idx < currentStep
                                      ? isDark
                                          ? 'text-blue-300'
                                          : 'text-blue-500'
                                      : isDark
                                        ? 'text-blue-400/60'
                                        : 'text-gray-400'
                            }`}
                        >
                            {step.label}
                        </span>
                    </div>

                    {/* Connector */}
                    {idx < steps.length - 1 && (
                        <div
                            className={`h-0.5 w-10 mt-4 mx-0.5 flex-shrink-0 rounded-full transition-colors duration-300 ${
                                idx < currentStep ? (isDark ? 'bg-blue-400' : 'bg-blue-500') : isDark ? 'bg-white/15' : 'bg-gray-200'
                            }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

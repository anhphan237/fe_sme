// ─── Organization Setup Page ──────────────────────────────────────────────────
// Bước 2: Thiết lập thông tin tổ chức sau khi đăng ký thành công.
// Route: /setup/organization — được bảo vệ bởi OnboardingGuard
import { useLocale } from '@/i18n';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { OnboardingStepper } from '@/pages/auth/register';

import { AppRouters } from '@/constants/router';

import OrgSetupForm from './components/OrgSetupForm';

export default function OrgSetupPage() {
    const { t } = useLocale();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400 rounded-full opacity-10 blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            {/* Back button */}
            <button
                onClick={() => navigate(AppRouters.REGISTER)}
                className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
                <ArrowLeftOutlined className="text-xs" />
                {t('plan.selection.page.back')}
            </button>

            <div className="w-full max-w-lg relative">
                {/* Brand */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <span className="text-xl font-bold text-white">SME-Onboard</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{t('org.setup.page.title')}</h1>
                    <p className="text-sm text-blue-200/80">{t('org.setup.page.subtitle')}</p>
                </div>

                {/* Stepper – bước 2 (index 1) */}
                <OnboardingStepper currentStep={1} />

                <div className="mt-5 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-blue-900/40 border border-white/20 p-6 sm:p-7">
                    <OrgSetupForm />
                </div>
            </div>
        </div>
    );
}

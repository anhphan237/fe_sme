import { useLocale } from '@/i18n';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import { OnboardingStepper } from '@/pages/auth/register';

import BaseButton from '@/components/button';

import usePlanSelection from '@/hooks/usePlanSelection';

import { AppRouters } from '@/constants/router';

import PlanCard from './components/PlanCard';

export default function PlanSelectionPage() {
    const navigate = useNavigate();
    const { t } = useLocale();
    const { plans, selectedPlanId, setSelectedPlanId, loadingPlans, submitting, handleSelectPlan } = usePlanSelection();

    const submitLabel = submitting
        ? 'plan.selection.submit.loading'
        : selectedPlanId === 'enterprise'
          ? 'plan.selection.submit.enterprise'
          : 'plan.selection.submit.default';

    if (loadingPlans) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-blue-200/80">{t('plan.selection.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400 rounded-full opacity-10 blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

            {/* Back button */}
            <button
                onClick={() => navigate(AppRouters.ORG_SETUP)}
                className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 z-10"
            >
                <ArrowLeftOutlined className="text-xs" />
                <span>{t('plan.selection.page.back')}</span>
            </button>

            <div className="flex flex-col items-center justify-center py-14 px-4 min-h-screen">
                <div className="w-full max-w-5xl relative">
                    {/* Brand */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <span className="text-xl font-bold text-white">SME-Onboard</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{t('plan.selection.page.title')}</h1>
                        <p className="text-sm text-blue-200/80">{t('plan.selection.page.subtitle')}</p>
                    </div>

                    {/* Stepper – bước 3 (index 2) */}
                    <OnboardingStepper currentStep={2} />

                    {/* Grid các gói dịch vụ */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {plans.map(plan => (
                            <PlanCard key={plan.id} plan={plan} isSelected={selectedPlanId === plan.id} onSelect={id => setSelectedPlanId(id)} />
                        ))}
                    </div>

                    {/* Enterprise CTA đặc biệt */}
                    {selectedPlanId === 'enterprise' && (
                        <div className="mt-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white p-6 text-center">
                            <p className="font-semibold text-base">{t('plan.selection.enterprise.cta_title')}</p>
                            <p className="text-sm text-blue-200/70 mt-1">{t('plan.selection.enterprise.cta_subtitle')}</p>
                        </div>
                    )}

                    {/* Nút confirm */}
                    <div className="mt-6 flex justify-center">
                        <BaseButton
                            label={submitLabel}
                            type="primary"
                            disabled={!selectedPlanId || submitting}
                            onClick={handleSelectPlan}
                            className="!px-10 !py-2.5 !rounded-xl !text-sm !font-semibold"
                        />
                    </div>

                    <p className="mt-4 text-center text-xs text-blue-300/50">{t('plan.selection.footer_note')}</p>
                </div>
            </div>
        </div>
    );
}

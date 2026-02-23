// ─── Plan Selection Page ──────────────────────────────────────────────────────
// Bước 3: Chọn gói dịch vụ sau khi thiết lập tổ chức.
// Route: /setup/plan — được bảo vệ bởi OnboardingGuard
import { OnboardingStepper } from '@/pages/auth/register';

import usePlanSelection from '@/hooks/usePlanSelection';

import PlanCard from './components/PlanCard';

export default function PlanSelectionPage() {
    const { plans, selectedPlanId, setSelectedPlanId, loadingPlans, submitting, handleSelectPlan } = usePlanSelection();

    if (loadingPlans) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Đang tải các gói dịch vụ…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center py-10 px-4">
            <div className="w-full max-w-4xl">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">SME-Onboard</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Chọn gói dịch vụ phù hợp</h1>
                    <p className="mt-1 text-sm text-gray-500">Bạn có thể nâng cấp hoặc thay đổi gói bất kỳ lúc nào</p>
                </div>

                {/* Stepper – bước 3 (index 2) */}
                <OnboardingStepper currentStep={2} variant="light" />

                {/* Grid các gói dịch vụ */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map(plan => (
                        <PlanCard key={plan.id} plan={plan} isSelected={selectedPlanId === plan.id} onSelect={id => setSelectedPlanId(id)} />
                    ))}
                </div>

                {/* Enterprise CTA đặc biệt */}
                {selectedPlanId === 'enterprise' && (
                    <div className="mt-4 rounded-xl bg-gray-900 text-white p-5 text-center">
                        <p className="font-semibold">Gói Enterprise cần liên hệ để báo giá tùy chỉnh.</p>
                        <p className="text-sm text-gray-400 mt-1">Sau khi xác nhận, đội ngũ của chúng tôi sẽ liên hệ bạn trong 24h.</p>
                    </div>
                )}

                {/* Nút confirm */}
                <div className="mt-6 flex justify-center">
                    <button
                        disabled={!selectedPlanId || submitting}
                        onClick={handleSelectPlan}
                        className="px-10 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm
                                   hover:bg-blue-700 active:scale-95 transition
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Đang xác nhận…' : selectedPlanId === 'enterprise' ? 'Liên hệ tư vấn' : 'Bắt đầu sử dụng →'}
                    </button>
                </div>

                <p className="mt-4 text-center text-xs text-gray-400">Gói Basic miễn phí mãi mãi. Không cần thẻ tín dụng.</p>
            </div>
        </div>
    );
}

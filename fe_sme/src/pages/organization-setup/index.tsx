// ─── Organization Setup Page ──────────────────────────────────────────────────
// Bước 2: Thiết lập thông tin tổ chức sau khi đăng ký thành công.
// Route: /setup/organization — được bảo vệ bởi OnboardingGuard
import { OnboardingStepper } from '@/pages/auth/register';

import OrgSetupForm from './components/OrgSetupForm';

export default function OrgSetupPage() {
    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900">SME-Onboard</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Thiết lập tổ chức của bạn</h1>
                    <p className="mt-1 text-sm text-gray-500">Thông tin này giúp chúng tôi tuỳ chỉnh nền tảng phù hợp với doanh nghiệp của bạn</p>
                </div>

                {/* Stepper – bước 2 (index 1) */}
                <OnboardingStepper currentStep={1} variant="light" />

                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <OrgSetupForm />
                </div>
            </div>
        </div>
    );
}

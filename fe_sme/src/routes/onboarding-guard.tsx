// ─── OnboardingGuard ──────────────────────────────────────────────────────────
// Bảo vệ các route trong luồng onboarding (Org Setup & Plan Selection).
//
// Logic:
// 1. Nếu chưa đăng nhập → redirect về /register
// 2. Nếu onboardingStep = 'done' → redirect về /dashboards (đã hoàn tất rồi)
// 3. Nếu truy cập sai thứ tự (VD: vào /setup/plan khi chưa setup org) → redirect đúng bước
// 4. Ngược lại → render component con
import { AppRouters } from '@/constants';
import { useAppSelector } from '@/stores';
import type { FC } from 'react';
import { Navigate } from 'react-router-dom';

import type { OnboardingStep } from '@/interface/auth';

/** Map mỗi onboardingStep → route tương ứng */
const STEP_ROUTE_MAP: Record<OnboardingStep, string> = {
    org_setup: AppRouters.ORG_SETUP,
    plan_selection: AppRouters.PLAN_SELECTION,
    done: AppRouters.DASHBOARDS,
};

interface OnboardingGuardProps {
    /** Bước mà route này đại diện */
    requiredStep: OnboardingStep;
    element: React.ReactElement;
}

const OnboardingGuard: FC<OnboardingGuardProps> = ({ requiredStep, element }) => {
    const { logged, onboardingStep } = useAppSelector(s => s.user);

    // Chưa đăng nhập
    if (!logged) {
        return <Navigate to={AppRouters.REGISTER} replace />;
    }

    // Đã hoàn tất onboarding → vào dashboard luôn
    if (onboardingStep === 'done') {
        return <Navigate to={AppRouters.DASHBOARDS} replace />;
    }

    // Truy cập sai bước → điều hướng về đúng bước hiện tại
    if (onboardingStep && onboardingStep !== requiredStep) {
        return <Navigate to={STEP_ROUTE_MAP[onboardingStep]} replace />;
    }

    return element;
};

export default OnboardingGuard;

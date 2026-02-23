// ─── usePlanSelection ─────────────────────────────────────────────────────────
// Hook chọn gói dịch vụ (bước 3 onboarding).
import { gatewayListPlans, gatewaySelectPlan } from '@/api/gateway/organization.gateway';
import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { notify } from '@/components/toast-message';

import { setUser } from '@/stores/user.store';

import type { BillingPlan } from '@/interface/gateway';

const ONBOARDING_STEP_KEY = 'ONBOARDING_STEP';

const usePlanSelection = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useLocale();

    const [plans, setPlans] = useState<BillingPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Tải danh sách gói khi hook mount
    useEffect(() => {
        setLoadingPlans(true);
        gatewayListPlans({ loading: false })
            .then(res => {
                if (res.status) {
                    const data = res?.result || res?.data;
                    setPlans(data?.plans ?? []);
                    // Mặc định chọn plan thứ 2 (Pro) nếu có
                    if (data?.plans?.length > 1) {
                        setSelectedPlanId(data.plans[1].id);
                    }
                }
            })
            .finally(() => setLoadingPlans(false));
    }, []);

    const handleSelectPlan = async () => {
        if (!selectedPlanId) return;

        setSubmitting(true);
        try {
            const res = await gatewaySelectPlan(selectedPlanId, { loading: false });

            if (res.status) {
                // Onboarding hoàn tất
                localStorage.setItem(ONBOARDING_STEP_KEY, 'done');
                dispatch(setUser({ onboardingStep: 'done' }));
                navigate(AppRouters.DASHBOARDS);
            } else {
                notify.error(t('global.planSelection.failed'));
            }
        } catch {
            notify.error(t('global.planSelection.failed'));
        } finally {
            setSubmitting(false);
        }
    };

    return {
        plans,
        selectedPlanId,
        setSelectedPlanId,
        loadingPlans,
        submitting,
        handleSelectPlan,
    };
};

export default usePlanSelection;

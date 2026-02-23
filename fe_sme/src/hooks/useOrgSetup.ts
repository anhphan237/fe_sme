import { gatewayOrgSetup } from '@/api/gateway/organization.gateway';
import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { notify } from '@/components/toast-message';

import { setUser } from '@/stores/user.store';

import type { OrgSetupParams } from '@/interface/organization';

const ONBOARDING_STEP_KEY = 'ONBOARDING_STEP';

const useOrgSetup = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useLocale();
    const [loading, setLoading] = useState(false);

    const handleOrgSetup = async (params: OrgSetupParams) => {
        setLoading(true);
        try {
            const res = await gatewayOrgSetup(params, { loading: false });

            if (res.status) {
                localStorage.setItem(ONBOARDING_STEP_KEY, 'plan_selection');
                dispatch(setUser({ onboardingStep: 'plan_selection' }));

                navigate(AppRouters.PLAN_SELECTION);
            } else {
                notify.error(t('global.orgSetup.failed'));
            }
        } catch {
            notify.error(t('global.orgSetup.failed'));
        } finally {
            setLoading(false);
        }
    };

    return { handleOrgSetup, loading };
};

export default useOrgSetup;

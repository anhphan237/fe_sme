// ─── useRegister ──────────────────────────────────────────────────────────────
// Hook đăng ký tài khoản HR Owner.
// Pattern giống hệt useLogin.ts hiện có.
import { gatewayRegister } from '@/api/gateway/auth.gateway';
import { APP_CONFIG, AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { notify } from '@/components/toast-message';

import { setUser } from '@/stores/user.store';

import type { RegisterParams } from '@/interface/auth';

const ONBOARDING_STEP_KEY = 'ONBOARDING_STEP';

const useRegister = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useLocale();
    const [loading, setLoading] = useState(false);

    const handleRegister = async (form: RegisterParams) => {
        setLoading(true);
        try {
            const res = await gatewayRegister(
                {
                    fullName: form.fullName,
                    email: form.email,
                    password: form.password,
                    phone: form.phone,
                },
                { loading: false },
            );

            if (res.status) {
                const data = res?.result || res?.data;

                // Lưu access token
                localStorage.setItem(APP_CONFIG.ACCESS_TOKEN, data.accessToken);

                // Lưu tenantId để các gateway request sau tự động gắn vào
                if (data.tenantId) {
                    localStorage.setItem('TENANT_ID', data.tenantId);
                }

                // Lưu bước onboarding để persist sau khi refresh
                localStorage.setItem(ONBOARDING_STEP_KEY, data.onboardingStep);

                // Cập nhật Redux store
                dispatch(
                    setUser({
                        logged: true,
                        onboardingStep: data.onboardingStep,
                    }),
                );

                // → Bước tiếp theo: thiết lập tổ chức
                navigate(AppRouters.ORG_SETUP);
            } else {
                notify.error(t('global.register.invalid'));
            }
        } catch {
            notify.error(t('global.register.failed'));
        } finally {
            setLoading(false);
        }
    };

    return { handleRegister, loading };
};

export default useRegister;

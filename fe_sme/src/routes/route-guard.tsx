import { AppRouters, DefaultRoles } from '@/constants';
import { useLocale } from '@/i18n';
import { useAppSelector } from '@/stores';
import type { FC } from 'react';
import { lazy, useEffect, useState } from 'react';
import type { RouteProps } from 'react-router';

import { hasPermission } from '@/hooks/usePermission';

const NoPermission = lazy(() => import('@/pages/errors/403'));

/** Map bước onboarding → route cần điều hướng */
const ONBOARDING_REDIRECT: Record<string, string> = {
    org_setup: AppRouters.ORG_SETUP,
    plan_selection: AppRouters.PLAN_SELECTION,
};

const PrivateRoute: FC<RouteProps & { roles: string | string[] }> = props => {
    const { logged } = useAppSelector(state => state.user);
    const { roles, permissions } = useAppSelector(state => state.global);
    const { onboardingStep } = useAppSelector(state => state.user);
    const [isValidToken, setIsValidToken] = useState<boolean>(false);
    const [isCheckToken, setIsCheckToken] = useState<boolean>(false);

    useEffect(() => {
        if (logged) {
            if (onboardingStep && onboardingStep !== 'done') {
                const redirectTo = ONBOARDING_REDIRECT[onboardingStep];
                if (redirectTo) {
                    window.location.href = redirectTo;
                    return;
                }
            }
            checkToken();
        } else {
            window.location.href = AppRouters.LOGIN;
            setIsCheckToken(true);
        }
    }, [logged, props.roles, roles, permissions, onboardingStep]);

    const checkToken = () => {
        const valid = hasPermission(props.roles, permissions) || roles?.includes(DefaultRoles.SUPER_ADMIN.toLowerCase());
        setIsValidToken(valid);
        setIsCheckToken(true);
    };
    if (!isCheckToken) return;
    return isValidToken ? (props.element as React.ReactElement) : <NoPermission />;
};

type RouteGuardProps = RouteProps & {
    titleId: string;
    /** authorization？ */
    auth?: boolean;
    roles: string | string[];
    element: React.ReactElement;
};

const RouteGuard: React.FC<RouteGuardProps> = ({ titleId, auth, ...props }) => {
    const { t } = useLocale();

    useEffect(() => {
        document.title = t(titleId);
    }, [titleId]);

    return auth ? <PrivateRoute {...props} /> : props.element;
};

export default RouteGuard;

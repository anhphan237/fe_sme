import { AppRouters, DefaultMappingPermission, DefaultRoles } from '@/constants';
import type { FC } from 'react';
import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { useRoutes } from 'react-router-dom';

import HomePage from '@/pages/Home';
import Profile from '@/pages/Profile';
// ─── Auth & Onboarding pages ───────────────────────────────────────────────
import RegisterPage from '@/pages/auth/register';
import Index from '@/pages/dashboards';
import LayoutPage from '@/pages/layout';
import LoginPage from '@/pages/login';
import OrgSetupPage from '@/pages/organization-setup';
import PlanSelectionPage from '@/pages/plan-selection';

import OnboardingGuard from './onboarding-guard';
import RouteGuard from './route-guard';

// Lazy loaded components
const NotFound = lazy(() => import('@/pages/errors/404'));
const NoPermission = lazy(() => import('@/pages/errors/403'));

const DashboardsPage = lazy(() => import('@/pages/dashboards'));

export type CustomRouteObject = RouteObject & {
    title?: string;
    children?: CustomRouteObject[];
};
export const routeList: CustomRouteObject[] = [
    // ── Public auth routes ─────────────────────────────────────────────────
    {
        path: AppRouters.LOGIN,
        element: <LoginPage />,
    },
    {
        path: AppRouters.REGISTER,
        element: <RegisterPage />,
    },
    {
        path: AppRouters.HOME,
        element: <HomePage />,
    },

    // ── Onboarding Setup routes (yêu cầu đã đăng nhập + đúng bước) ────────
    {
        path: AppRouters.ORG_SETUP,
        element: <OnboardingGuard requiredStep="org_setup" element={<OrgSetupPage />} />,
    },
    {
        path: AppRouters.PLAN_SELECTION,
        element: <OnboardingGuard requiredStep="plan_selection" element={<PlanSelectionPage />} />,
    },
    {
        id: 'mainRouter',
        element: <LayoutPage />,
        children: [
            // Dashboard
            {
                path: AppRouters.DASHBOARDS,
                title: 'menu.dashboard',
                element: <RouteGuard element={<Index />} auth={true} titleId="menu.dashboard" roles={DefaultRoles.ALL} />,
            },
            // Profile
            {
                path: AppRouters.PROFILE,
                title: 'menu.profile',
                element: <RouteGuard element={<Profile />} auth={true} titleId="menu.profile" roles={DefaultRoles.ALL} />,
            },
            // Error pages
            {
                path: AppRouters.NO_PERMISSION,
                title: 'title.noPermission',
                element: <RouteGuard element={<NoPermission />} auth={true} titleId="title.noPermission" roles={DefaultRoles.ALL} />,
            },
            {
                path: AppRouters.NOT_FOUND,
                title: 'title.notFound',
                element: <RouteGuard element={<NotFound />} auth={true} titleId="title.notFound" roles={DefaultRoles.ALL} />,
            },
            // Catch all
            {
                path: '*',
                element: <RouteGuard element={<NotFound />} auth={true} titleId="title.notFound" roles={DefaultRoles.ALL} />,
            },
        ],
    },
];

const RenderRouter: FC = () => {
    const element = useRoutes(routeList);
    return element;
};

export default RenderRouter;

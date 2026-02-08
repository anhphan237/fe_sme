import { AppRouters } from '@/constants';
import { useLocale } from '@/i18n';
import { CustomRouteObject, routeList } from '@/routes';
import { useAppSelector } from '@/stores';
import { NavLink, matchPath, useLocation } from 'react-router';

import './MainBreadCrumb.less';
import BreadCrumbs from './BreadCrumbs';

const mainRouter = (routeList.find(route => route.id === 'mainRouter') ?? []) as CustomRouteObject[];
const MainBreadCrumb = () => {
    const location = useLocation();
    const { t } = useLocale();
    const { breadCrumbs } = useAppSelector(state => state.global);

    const items = location.pathname
        .split('/')
        .filter(Boolean)
        .map((path, index, arr) => {
            const to = `/${arr.slice(0, index + 1).join('/')}`;
            const matchedRoute = ((mainRouter as CustomRouteObject).children as CustomRouteObject[]).find(route => route.path === to);
            const isActive = matchPath(location.pathname, to);
            const pathInfo = path === 'create' ? t('Add new') : (breadCrumbs?.[path] ?? path);
            return {
                key: to,
                originalTitle: matchedRoute?.title ? t(matchedRoute.title) : pathInfo,
                title: (
                    <NavLink to={to} className={`breadcrumbs__link ${isActive ? 'font-semibold !text-secondary' : 'font-semibold !text-secondary hover:!underline'}`}>
                        {matchedRoute?.title ? t(matchedRoute.title) : pathInfo}
                    </NavLink>
                ),
            };
        });

    if (location.pathname === '' || location.pathname === AppRouters.DASHBOARDS) {
        return null;
    }

    return <BreadCrumbs items={items} />;
};

export default MainBreadCrumb;

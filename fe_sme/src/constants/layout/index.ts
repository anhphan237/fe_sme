import { DefaultMappingPermission } from '../permission';
import { AppRouters } from '../router';
import { HRM_MENU_ITEMS } from './menu-hrm';
import { SYSTEM_MENU_ITEMS } from './menu-system';

const DASHBOARD_ITEM = {
    code: 'dashboard',
    label: 'menu.dashboard',
    icon: 'dashboard',
    path: AppRouters.DASHBOARDS,
    roles: DefaultMappingPermission[AppRouters.DASHBOARDS],
};

export const MENU_ITEMS = [DASHBOARD_ITEM, ...HRM_MENU_ITEMS, ...SYSTEM_MENU_ITEMS];

export const MENU_ITEMS_BY_CATEGORY = {
    HRM: HRM_MENU_ITEMS,
    SYSTEM: SYSTEM_MENU_ITEMS,
};

export { MENU_CATEGORIES } from './menu-categories';
export type { MenuCategoryConfig } from './menu-categories';

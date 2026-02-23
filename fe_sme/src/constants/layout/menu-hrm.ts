import { MenuItem } from '@/interface/layout';

import { DefaultMappingPermission } from '../permission';
import { AppRouters } from '../router';

export const HRM_MENU_ITEMS: MenuItem[] = [
    {
        code: 'menu.employees',
        label: 'menu.employees',
        icon: 'employees',
        path: AppRouters.EMPLOYEES,
        roles: DefaultMappingPermission[AppRouters.EMPLOYEES],
        category: 'HRM',
    },
    {
        code: 'menu.contract',
        label: 'menu.contract',
        icon: 'contract',
        path: AppRouters.CONTRACT,
        roles: DefaultMappingPermission[AppRouters.CONTRACT],
        category: 'HRM',
    },
    {
        code: 'menu.profile',
        label: 'menu.profile',
        icon: 'user',
        path: AppRouters.PROFILE,
        roles: DefaultMappingPermission[AppRouters.PROFILE],
        category: 'HRM',
    },
];

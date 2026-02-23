import { MenuItem } from '@/interface/layout';

import { DefaultMappingPermission } from '../permission';
import { AppRouters } from '../router';

export const SYSTEM_MENU_ITEMS: MenuItem[] = [
    // System
    {
        code: 'system.system',
        label: 'menu.system',
        icon: 'user',
        path: AppRouters.SYSTEM,
        roles: DefaultMappingPermission[AppRouters.SYSTEM],
        category: 'SYSTEM',
        children: [
            {
                code: 'menu.tenant',
                label: 'menu.tenant',
                path: AppRouters.TENANT,
                roles: DefaultMappingPermission[AppRouters.TENANT],
            },
            {
                code: 'menu.user',
                label: 'menu.user',
                path: AppRouters.USERS,
                roles: DefaultMappingPermission[AppRouters.USERS],
            },
            {
                code: 'menu.role_group',
                label: 'menu.role_group',
                path: AppRouters.ROLE_GROUP,
                roles: DefaultMappingPermission[AppRouters.ROLE_GROUP],
            },
        ],
    },
    // Categories
    {
        code: 'categories',
        label: 'menu.category',
        icon: 'category',
        path: AppRouters.DEPARTMENT,
        roles: DefaultMappingPermission[AppRouters.CATEGORIES],
        category: 'SYSTEM',
        children: [
            {
                code: 'department',
                label: 'menu.department',
                path: AppRouters.DEPARTMENT,
                roles: DefaultMappingPermission[AppRouters.DEPARTMENT],
            },
            {
                code: 'position',
                label: 'menu.position',
                path: AppRouters.POSITION,
                roles: DefaultMappingPermission[AppRouters.POSITION],
            },
        ],
    },
];

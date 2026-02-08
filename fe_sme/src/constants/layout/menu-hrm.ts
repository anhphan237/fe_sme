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
        code: 'menu.portal.contract',
        label: 'menu.portal.contract',
        icon: 'finance-accounting',
        path: AppRouters.PORTAL_CONTRACT,
        roles: DefaultMappingPermission[AppRouters.CONTRACT],
        category: 'HRM',
    },
    {
        code: 'menu.portal.contract.rate',
        label: 'menu.portal.contract.rate',
        icon: 'finance-accounting',
        path: AppRouters.PORTAL_CONTRACT_RATE,
        roles: DefaultMappingPermission[AppRouters.CONTRACT],
        category: 'HRM',
    },
    {
        code: 'menu.profile',
        label: 'menu.profile',
        icon: 'finance-accounting',
        path: AppRouters.PROFILE,
        roles: DefaultMappingPermission[AppRouters.PROFILE],
        category: 'HRM',
    },
    {
        code: 'menu.attendance',
        label: 'menu.attendance',
        icon: 'attendance',
        path: AppRouters.ATTENDANCE,
        roles: DefaultMappingPermission[AppRouters.ATTENDANCE],
        category: 'HRM',
    },
    {
        code: 'menu.attendance.admin',
        label: 'menu.attendance.admin',
        icon: 'attendance',
        path: AppRouters.ATTENDANCE_ADMIN,
        roles: DefaultMappingPermission[AppRouters.ATTENDANCE_ADMIN],
        category: 'HRM',
    },
    {
        code: 'menu.attendance.employee',
        label: 'menu.attendance.employee',
        icon: 'attendance',
        path: AppRouters.ATTENDANCE_EMPLOYEE,
        roles: DefaultMappingPermission[AppRouters.ATTENDANCE_EMPLOYEE],
        category: 'HRM',
    },
    {
        code: 'menu.shift',
        label: 'menu.shift',
        icon: 'shift',
        path: AppRouters.SHIFT,
        roles: DefaultMappingPermission[AppRouters.SHIFT],
        category: 'HRM',
    },
    {
        code: 'menu.payroll',
        label: 'menu.payroll',
        icon: 'payroll',
        path: AppRouters.PAYROLL,
        roles: DefaultMappingPermission[AppRouters.PAYROLL],
        category: 'HRM',
    },
];

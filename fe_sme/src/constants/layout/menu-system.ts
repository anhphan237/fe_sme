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
        path: AppRouters.PRODUCT_GROUP,
        roles: DefaultMappingPermission[AppRouters.CATEGORIES],
        category: 'SYSTEM',
        children: [
            {
                code: 'productGroup',
                label: 'menu.productGroup',
                path: AppRouters.PRODUCT_GROUP,
                roles: DefaultMappingPermission[AppRouters.PRODUCT_GROUP],
            },
            {
                code: 'productType',
                label: 'menu.productType',
                path: AppRouters.PRODUCT_TYPE,
                roles: DefaultMappingPermission[AppRouters.PRODUCT_TYPE],
            },
            {
                code: 'salesMethod',
                label: 'menu.salesMethod',
                path: AppRouters.SALES_METHOD,
                roles: DefaultMappingPermission[AppRouters.SALES_METHOD],
            },
            {
                code: 'customerType',
                label: 'menu.customerType',
                path: AppRouters.CUSTOMER_TYPE,
                roles: DefaultMappingPermission[AppRouters.CUSTOMER_TYPE],
            },
            {
                code: 'partnerType',
                label: 'menu.partnerType',
                path: AppRouters.PARTNER_TYPE,
                roles: DefaultMappingPermission[AppRouters.PARTNER_TYPE],
            },
            {
                code: 'paymentMethod',
                label: 'menu.paymentMethod',
                path: AppRouters.PAYMENT_METHOD,
                roles: DefaultMappingPermission[AppRouters.PAYMENT_METHOD],
            },
            {
                code: 'paymentFund',
                label: 'menu.paymentFund',
                path: AppRouters.PAYMENT_FUND,
                roles: DefaultMappingPermission[AppRouters.PAYMENT_FUND],
            },
            {
                code: 'expensesType',
                label: 'menu.expensesType',
                path: AppRouters.EXPENSES_TYPE,
                roles: DefaultMappingPermission[AppRouters.EXPENSES_TYPE],
            },
            {
                code: 'warehouseArea',
                label: 'menu.warehouseArea',
                path: AppRouters.WAREHOUSE_AREA,
                roles: DefaultMappingPermission[AppRouters.WAREHOUSE_AREA],
            },
            {
                code: 'warehouse',
                label: 'menu.warehouse',
                path: AppRouters.WAREHOUSE,
                roles: DefaultMappingPermission[AppRouters.WAREHOUSE],
            },
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

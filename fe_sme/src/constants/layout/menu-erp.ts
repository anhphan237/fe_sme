import { MenuItem } from '@/interface/layout';

import { DefaultMappingPermission } from '../permission';
import { AppRouters } from '../router';

export const ERP_MENU_ITEMS: MenuItem[] = [
    // SALES MANAGEMENT
    {
        code: 'sale-management',
        label: 'menu.sales',
        icon: 'sale-management',
        path: AppRouters.SALE_MANAGEMENT,
        roles: DefaultMappingPermission[AppRouters.SALE_MANAGEMENT],
        category: 'ERP',
        children: [
            {
                code: 'menu.order',
                label: 'menu.order',
                path: AppRouters.SALES_ORDER,
                roles: DefaultMappingPermission[AppRouters.SALES_ORDER],
            },
            {
                code: 'sales.invoice',
                label: 'sales.invoice',
                path: AppRouters.INVOICE,
                roles: DefaultMappingPermission[AppRouters.INVOICE],
            },
            {
                code: 'sales.return',
                label: 'sales.return',
                path: AppRouters.REFUND,
                roles: DefaultMappingPermission[AppRouters.REFUND],
            },
        ],
    },
    // PURCHASE MANAGEMENT
    {
        code: 'purchase-management',
        label: 'menu.purchase-management',
        icon: 'purchase-management',
        path: AppRouters.PURCHASE_MANAGEMENT,
        roles: DefaultMappingPermission[AppRouters.PURCHASE_MANAGEMENT],
        category: 'ERP',
        children: [
            {
                code: 'sales.purchase_orders',
                label: 'sales.purchase_orders',
                path: AppRouters.PURCHASE_ORDERS,
                roles: DefaultMappingPermission[AppRouters.PURCHASE_ORDERS],
            },
            {
                code: 'menu.purchase_invoice',
                label: 'menu.purchase_invoice',
                path: AppRouters.PURCHASE_INVOICE,
                roles: DefaultMappingPermission[AppRouters.PURCHASE_INVOICE],
            },
            {
                code: 'menu.purchase_refund',
                label: 'menu.purchase_refund',
                path: AppRouters.PURCHASE_REFUND,
                roles: DefaultMappingPermission[AppRouters.PURCHASE_REFUND],
            },
        ],
    },
    // FINANCE - ACCOUNTING
    {
        code: 'finance-accounting',
        label: 'menu.finance_accounting',
        icon: 'finance-accounting',
        path: AppRouters.FINANCE_ACCOUNTING,
        roles: DefaultMappingPermission[AppRouters.FINANCE_ACCOUNTING],
        category: 'ERP',
        children: [
            {
                code: 'finance_accounting.debt_tracking',
                label: 'finance_accounting.debt_tracking',
                path: AppRouters.DEBT_TRACKING,
                roles: DefaultMappingPermission[AppRouters.DEBT_TRACKING],
            },
            {
                code: 'finance_accounting.debt_tracking_payable',
                label: 'finance_accounting.debt_tracking_payable',
                path: AppRouters.DEBT_TRACKING_PAYABLE,
                roles: DefaultMappingPermission[AppRouters.DEBT_TRACKING_PAYABLE],
            },
            {
                code: 'finance_accounting.payment_slip',
                label: 'finance_accounting.payment_slip',
                path: AppRouters.PAYMENT_SLIP,
                roles: DefaultMappingPermission[AppRouters.PAYMENT_SLIP],
            },
            {
                code: 'finance_accounting.debt_receivables_other',
                label: 'finance_accounting.debt_receivables_other',
                path: AppRouters.DEBT_RECEIVABELES_OTHER,
                roles: DefaultMappingPermission[AppRouters.DEBT_RECEIVABELES_OTHER],
            },
        ],
    },
    // LOGISTICS
    {
        code: 'logistics',
        label: 'menu.logistics',
        icon: 'logistics',
        path: AppRouters.LOGISTICS,
        roles: DefaultMappingPermission[AppRouters.LOGISTICS],
        category: 'ERP',
        children: [
            {
                code: 'logistics.enter_warehouse',
                label: 'logistics.enter_warehouse',
                path: AppRouters.ENTER_WAREHOUSE,
                roles: DefaultMappingPermission[AppRouters.ENTER_WAREHOUSE],
            },
            {
                code: 'logistics.export_warehouse',
                label: 'logistics.export_warehouse',
                path: AppRouters.EXPORT_WAREHOUSE,
                roles: DefaultMappingPermission[AppRouters.EXPORT_WAREHOUSE],
            },
            {
                code: 'logistics.inventory',
                label: 'logistics.inventory',
                path: AppRouters.INVENTORY,
                roles: DefaultMappingPermission[AppRouters.INVENTORY],
            },
            {
                code: 'logistics.warehouse_config',
                label: 'logistics.warehouse_config',
                path: AppRouters.WAREHOUSE_CONFIG,
                roles: DefaultMappingPermission[AppRouters.WAREHOUSE_CONFIG],
            },
        ],
    },
    {
        code: 'productCategory',
        label: 'menu.productManagement',
        icon: 'finance-accounting',
        path: AppRouters.PRODUCT_MANAGEMENT,
        category: 'ERP',
        roles: DefaultMappingPermission[AppRouters.PRODUCT_MANAGEMENT],
    },
    {
        code: 'customers',
        label: 'menu.customers',
        icon: 'customer',
        category: 'ERP',
        path: AppRouters.CUSTOMER,
        roles: DefaultMappingPermission[AppRouters.CUSTOMER],
        children: [
            {
                code: 'customer.info',
                label: 'customer.info',
                path: AppRouters.CUSTOMER_INFO,
                roles: DefaultMappingPermission[AppRouters.CUSTOMER_INFO],
            },
            {
                code: 'CustomerHistory',
                label: 'CustomerHistory',
                path: AppRouters.CUSTOMER_HISTORY,
                roles: DefaultMappingPermission[AppRouters.CUSTOMER_HISTORY],
            },
        ],
    },
    {
        code: 'suppliers',
        label: 'menu.suppliers',
        icon: 'supplier',
        category: 'ERP',
        path: AppRouters.SUPPLIER,
        roles: DefaultMappingPermission[AppRouters.SUPPLIER],
        children: [
            {
                code: 'supplier.info',
                label: 'supplier.info',
                path: AppRouters.SUPPLIER_INFO,
                roles: DefaultMappingPermission[AppRouters.SUPPLIER_INFO],
            },
            {
                code: 'SupplierHistory',
                label: 'SupplierHistory',
                path: AppRouters.SUPPLIER_VIEW_HISTORY,
                roles: DefaultMappingPermission[AppRouters.SUPPLIER_VIEW_HISTORY],
            },
        ],
    },
];

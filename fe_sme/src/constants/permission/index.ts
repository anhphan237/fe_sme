import { AppRouters } from '../router';

/**
 * phòng ban a
 * chức vụ 1
 * chức năng 2
 * full quyền f
 * ==> a.1.2.f
 * z.0... => is supper admin
 */
export const PERMISSIONS = {
    VIEW: 'v',
    CREATE: 'c',
    UPDATE: 'u',
    DELETE: 'd',
    FULL: 'f',
} as const;
export type PERMISSIONS = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export enum DefaultRoles {
    SUPER_ADMIN = 'R001',
    ADMIN = 'R002',
    ACCOUNTANT = 'R003',
    USER = 'R004',
    ALL = 'all',
}

export enum DefaultTenantCode {
    LTBMA = 'CT001',
    QCLD = 'CT002',
    TDP = 'CT003',
    SUPER_ADMIN = 'MT000',
}

export const DefaultMappingPermission = {
    [AppRouters.SYSTEM]: 'all',
    [AppRouters.USERS]: 'all',
    [AppRouters.TENANT]: 'all',
    [AppRouters.ROLE_GROUP]: 'all',

    // DASHBOARD
    [AppRouters.DASHBOARDS]: 'all',

    // EMPLOYEE
    [AppRouters.EMPLOYEES]: 'all',
    [AppRouters.EMPLOYEE_ADD]: 'all',
    [AppRouters.EMPLOYEE_DETAIL]: 'all',

    // CONTRACT
    [AppRouters.CONTRACT]: 'all',

    // PROFILE
    [AppRouters.PROFILE]: 'all',

    // ATTENDANCE
    [AppRouters.ATTENDANCE]: 'all',
    [AppRouters.ATTENDANCE_ADMIN]: 'all',
    [AppRouters.ATTENDANCE_EMPLOYEE]: 'all',

    // SHIFT
    [AppRouters.SHIFT]: 'all',

    // PAYROLL
    [AppRouters.PAYROLL]: 'all',
    [AppRouters.PAYROLL_DETAIL]: 'all',

    //Finance
    [AppRouters.DEBT_RECEIVABELES_OTHER]: 'all',
    [AppRouters.DEBT_RECEIVABELES_OTHER_ADD]: 'all',
    [AppRouters.DEBT_RECEIVABELES_OTHER_EDIT]: 'all',
    [AppRouters.DEBT_TRACKING_PAYABLE]: 'all',
    [AppRouters.DEBT_TRACKING_PAYABLE_DETAIL]: 'all',
    [AppRouters.DEBT_TRACKING_PAYABLE_TRANSACTION]: 'all',

    [AppRouters.FINANCE_ACCOUNTING]: 'all',
    [AppRouters.DEBT_TRACKING]: 'all',
    [AppRouters.DEBT_DETAIL]: 'all',
    [AppRouters.RECEIVABLES]: 'all',
    [AppRouters.DEBT_DETAIL_TRANSACTION]: 'all',
    [AppRouters.RECEIVABLES_TRANSACTION]: 'all',
    [AppRouters.PAYMENT_SLIP]: 'all',
    [AppRouters.PAYMENT_SLIP_ADD]: 'all',
    [AppRouters.PAYMENT_SLIP_EDIT]: 'all',
    FinanceReport: 'all',

    // PRODUCTION MANAGEMENT
    [AppRouters.PRODUCT_MANAGEMENT]: 'all',
    [AppRouters.PRODUCT_MANAGEMENT_ADD]: 'all',
    [AppRouters.PRODUCT_MANAGEMENT_EDIT]: 'all',

    // SALES MANAGEMENT
    [AppRouters.SALE_MANAGEMENT]: 'all',
    [AppRouters.SALES_ORDER]: 'all',
    [AppRouters.INVOICE]: 'all',
    [AppRouters.ADD_INVOICE]: 'all',
    [AppRouters.EDIT_INVOICE]: 'all',
    [AppRouters.REFUND]: 'all',
    [AppRouters.ADD_REFUND]: 'all',
    [AppRouters.EDIT_REFUND]: 'all',
    [AppRouters.INVOICE_TRANSACTION]: 'all',
    [AppRouters.REFUND_TRANSACTION]: 'all',
    ExportInvoice: 'all',

    // PURCHASE MANAGEMENT
    [AppRouters.PURCHASE_MANAGEMENT]: 'all',
    [AppRouters.PURCHASE_ORDERS]: 'all',
    [AppRouters.PURCHASE_ORDERS_ADD]: 'all',
    [AppRouters.PURCHASE_ORDERS_EDIT]: 'all',
    [AppRouters.PURCHASE_INVOICE]: 'all',
    [AppRouters.PURCHASE_INVOICE_ADD]: 'all',
    [AppRouters.PURCHASE_INVOICE_EDIT]: 'all',
    [AppRouters.PURCHASE_REFUND]: 'all',
    [AppRouters.PURCHASE_REFUND_ADD]: 'all',
    [AppRouters.PURCHASE_REFUND_EDIT]: 'all',
    [AppRouters.PURCHASE_INVOICE_TRANSACTION]: 'all',

    // LOGISTICS MANAGEMENT
    [AppRouters.LOGISTICS]: 'all',
    [AppRouters.ENTER_WAREHOUSE]: 'all',
    [AppRouters.ADD_ENTER_WAREHOUSE]: 'all',
    [AppRouters.HISTORY_ENTER_WAREHOUSE]: 'all',
    [AppRouters.HISTORY_EXPORT_WAREHOUSE]: 'all',
    [AppRouters.EDIT_ENTER_WAREHOUSE]: 'all',
    [AppRouters.EXPORT_WAREHOUSE]: 'all',
    [AppRouters.ADD_EXPORT_WAREHOUSE]: 'all',
    [AppRouters.EDIT_EXPORT_WAREHOUSE]: 'all',
    [AppRouters.INVENTORY]: 'all',
    [AppRouters.WAREHOUSE_CONFIG]: 'all',

    // CUSTOMER
    [AppRouters.CUSTOMER]: 'all',
    [AppRouters.CUSTOMER_INFO]: 'all',
    [AppRouters.CUSTOMER_HISTORY]: 'all',
    [AppRouters.VIEW_HISTORY_DETAIL]: 'all',

    // SUPPLIER
    [AppRouters.SUPPLIER]: 'all',
    [AppRouters.SUPPLIER_INFO]: 'all',
    [AppRouters.SUPPLIER_VIEW_HISTORY]: 'all',
    [AppRouters.SUPPLIER_VIEW_HISTORY_DETAIL]: 'all',

    // CATEGORIES
    [AppRouters.CATEGORIES]: 'all',
    [AppRouters.PRODUCT_TYPE]: 'all',
    [AppRouters.PRODUCT_GROUP]: 'all',
    [AppRouters.SALES_METHOD]: 'all',
    [AppRouters.CUSTOMER_TYPE]: 'all',
    [AppRouters.PARTNER_TYPE]: 'all',
    [AppRouters.PAYMENT_METHOD]: 'all',
    [AppRouters.SHIPPING_METHOD]: 'all',
    [AppRouters.WAREHOUSE_AREA]: 'all',
    [AppRouters.WAREHOUSE]: 'all',
    [AppRouters.DEPARTMENT]: 'all',
    [AppRouters.POSITION]: 'all',
    [AppRouters.EXPENSES_TYPE]: 'all',
    [AppRouters.PAYMENT_FUND]: 'all',
};

export enum AppRouters {
    // HOME
    HOME = '/',

    // AUTH
    LOGIN = '/login',

    // *
    NO_PERMISSION = '/403',
    NOT_FOUND = '/404',

    // SYSTEM
    SYSTEM = '/system',
    USERS = '/system/users',
    TENANT = '/system/tenant',
    PERMISSIONS = '/system/permissions',
    ROLE_GROUP = '/system/role-group',
    EDIT_ROLE_GROUP = '/system/role-group/:id',
    NOTIFICATION_SYSTEM = '/system/notification',

    // DASHBOARDS
    DASHBOARDS = '/dashboards',

    // CONTRACT
    CONTRACT = '/contract',
    ADD_CONTRACT = '/contract/add',
    EDIT_CONTRACT = '/contract/edit/:id',
    DETAIL_CONTRACT = '/contract/:id',

    PORTAL_CONTRACT = '/portal/contract',
    PORTAL_CONTRACT_RATE = '/portal/contract/rate',

    // PROFILE
    PROFILE = '/profile',

    // ATTENDANCE
    ATTENDANCE = '/attendance',
    ATTENDANCE_ADMIN = '/attendance/admin',
    ATTENDANCE_EMPLOYEE = '/attendance/employee',

    //SHIFT
    SHIFT = '/shift',

    // PAYROLL
    PAYROLL = '/payroll',
    PAYROLL_DETAIL = '/payroll/:id',

    // EMPLOYEE
    EMPLOYEES = '/employees',
    EMPLOYEE_DETAIL = '/employees/:id',
    EMPLOYEE_ADD = '/employees/add',

    // FINANCE - ACCOUNTING
    FINANCE_ACCOUNTING = '/finance-accounting',
    DEBT_TRACKING = '/finance-accounting/debt-tracking',
    DEBT_DETAIL = '/finance-accounting/debt-tracking/:id',
    DEBT_DETAIL_TRANSACTION = '/finance-accounting/debt-tracking/transaction/:id',
    DEBT_TRANSACTION = '/finance-accounting/debt-tracking/transaction',
    RECEIVABLES = '/finance-accounting/receivables',
    RECEIVABLES_TRANSACTION = '/finance-accounting/receivables/:id',
    PAYABLES = '/finance-accounting/payables',
    PAYABLES_TRANSACTION = '/finance-accounting/payables/:id',
    // Debt Tracking Payable route
    DEBT_TRACKING_PAYABLE = '/finance-accounting/debt-tracking-payable',
    DEBT_TRACKING_PAYABLE_DETAIL = '/finance-accounting/debt-tracking-payable/:id',
    DEBT_PAYABLE_TRANSACTION = '/finance-accounting/debt-tracking-payable/transaction',
    DEBT_TRACKING_PAYABLE_TRANSACTION = '/finance-accounting/debt-tracking-payable/transaction/:id',

    // Payment Slip routes
    PAYMENT_SLIP = '/finance-accounting/payment-slip',
    PAYMENT_SLIP_ADD = '/finance-accounting/payment-slip/add',
    PAYMENT_SLIP_EDIT = '/finance-accounting/payment-slip/:id',
    // Debt Receivables Other routes
    DEBT_RECEIVABELES_OTHER = '/finance-accounting/debt-receivables-payment-slip',
    DEBT_RECEIVABELES_OTHER_ADD = '/finance-accounting/debt-receivables-payment-slip/add',
    DEBT_RECEIVABELES_OTHER_EDIT = '/finance-accounting/debt-receivables-payment-slip/:id',

    // PRODUCTION MANAGEMENT
    PRODUCT_MANAGEMENT = '/product-management',
    PRODUCT_MANAGEMENT_ADD = '/product-management/add',
    PRODUCT_MANAGEMENT_EDIT = '/product-management/:id',

    // SALES MANAGEMENT
    SALE_MANAGEMENT = '/sale-management',
    SALES_ORDER = '/sale-management/order',
    SALES_ORDER_ADD = '/sale-management/order/add',
    SALES_ORDER_EDIT = '/sale-management/order/:id',
    INVOICE = '/sale-management/invoice',
    INVOICE_TRANSACTION = '/sale-management/invoice/:id/transaction',
    ADD_INVOICE = '/sale-management/invoice/add',
    EDIT_INVOICE = '/sale-management/invoice/:id',
    SALES_COMMISSION = '/sale-management/sales-commission',
    REFUND = '/sale-management/refund',
    REFUND_TRANSACTION = '/sale-management/refund/:id/transaction',
    ADD_REFUND = '/sale-management/refund/add',
    EDIT_REFUND = '/sale-management/refund/:id',

    // PURCHASE MANAGEMENT
    PURCHASE_MANAGEMENT = '/purchase-management',
    PURCHASE_ORDERS = '/purchase-management/purchase-orders',
    PURCHASE_ORDERS_ADD = '/purchase-management/purchase-orders/add',
    PURCHASE_ORDERS_EDIT = '/purchase-management/purchase-orders/:id',

    PURCHASE_INVOICE = '/purchase-management/purchase-invoice',
    PURCHASE_INVOICE_ADD = '/purchase-management/purchase-invoice/add',
    PURCHASE_INVOICE_EDIT = '/purchase-management/purchase-invoice/:id',
    PURCHASE_INVOICE_TRANSACTION_NAVIGATE = '/purchase-management/purchase-invoice/transaction',
    PURCHASE_INVOICE_TRANSACTION = '/purchase-management/purchase-invoice/transaction/:id',

    PURCHASE_REFUND = '/purchase-management/purchase-refund',
    PURCHASE_REFUND_ADD = '/purchase-management/purchase-refund/add',
    PURCHASE_REFUND_EDIT = '/purchase-management/purchase-refund/:id',

    // LOGISTICS
    LOGISTICS = '/logistics',
    ENTER_WAREHOUSE = '/logistics/enter-warehouse',
    HISTORY_ENTER_WAREHOUSE = '/logistics/enter-warehouse/:id',
    ADD_ENTER_WAREHOUSE = '/logistics/enter-warehouse/:orderId/add',
    EDIT_ENTER_WAREHOUSE = '/logistics/enter-warehouse/:orderId/:id',
    EXPORT_WAREHOUSE = '/logistics/export-warehouse',
    ADD_EXPORT_WAREHOUSE = '/logistics/export-warehouse/:orderId/add',
    EDIT_EXPORT_WAREHOUSE = '/logistics/export-warehouse/:orderId/:id',
    HISTORY_EXPORT_WAREHOUSE = '/logistics/export-warehouse/:id',
    INVENTORY = '/logistics/inventory',
    WAREHOUSE_CONFIG = '/logistics/warehouse-config',

    // CUSTOMERS AND PARTNERS
    CUSTOMER = '/customers',
    CUSTOMER_INFO = '/customers/infomation',
    ADD_CUSTOMER_INFO = '/customers/infomation/add',
    EDIT_CUSTOMER_INFO = '/customers/infomation/:id',
    CUSTOMER_HISTORY = '/customers/history',
    VIEW_HISTORY_DETAIL = '/customers/history/:id',
    HISTORY_INTERACTION = '/customers/history-interaction',

    // SUPPLIERS AND PARTNERS
    SUPPLIER = '/suppliers',
    SUPPLIER_INFO = '/suppliers/infomation',
    ADD_SUPPLIER_INFO = '/suppliers/infomation/add',
    EDIT_SUPPLIER_INFO = '/suppliers/infomation/:id',
    SUPPLIER_VIEW_HISTORY = '/suppliers/history',
    SUPPLIER_VIEW_HISTORY_DETAIL = '/suppliers/history/:id',

    // CATEGORIES
    CATEGORIES = '/categories',
    PRODUCT_TYPE = '/categories/product-type',
    PRODUCT_GROUP = '/categories/product-group',
    PRODUCT_UNIT_CONFIG = '/categories/product-unit-config',
    SALES_CHANNEL = '/categories/sales-channel',
    SALES_METHOD = '/categories/sales-method',
    CUSTOMER_TYPE = '/categories/customer-type',
    PARTNER_TYPE = '/categories/partner-type',
    PAYMENT_METHOD = '/categories/payment-method',
    DELIVERY_METHOD = '/categories/delivery-method',
    SHIPPING_METHOD = '/categories/shipping-method',
    ORDER_STATUS = '/categories/order-status',
    WAREHOUSE_AREA = '/categories/warehouse-area',
    WAREHOUSE = '/categories/warehouse',
    BUSINESS_EXPENSE = '/categories/business-expense',
    SHIPPING_FEE = '/categories/shipping-fee',
    DEPARTMENT = '/categories/department',
    POSITION = '/categories/position',
    PAYMENT_FUND = '/categories/payment-fund',
    EXPENSES_TYPE = '/categories/expenses-type',
    MARKETING = '/marketing',
    DISCOUNT_POLICY = '/marketing/discount-policy',
    REMINDER_SCHEDULER = '/marketing/reminder-scheduler',
}

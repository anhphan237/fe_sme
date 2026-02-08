import { AppRouters, DefaultMappingPermission, DefaultRoles } from '@/constants';
import type { FC } from 'react';
import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { Navigate, useRoutes } from 'react-router-dom';

import ContractPage from '@/pages/Contract';
import AddOrChangeContract from '@/pages/Contract/add-or-change';
import ContractDetail from '@/pages/Contract/detail';
import HomePage from '@/pages/Home';
import PortalContract from '@/pages/PortalContract';
import PortalContractRate from '@/pages/PortalContractRate';
import Profile from '@/pages/Profile';
import Index from '@/pages/dashboards';
import LayoutPage from '@/pages/layout';
import LoginPage from '@/pages/login';
import PayrollPage from '@/pages/payroll';
import PayrollDetailPage from '@/pages/payroll/PayrollDetail';

import RouteGuard from './route-guard';

const NotFound = lazy(() => import('@/pages/errors/404'));
const NoPermission = lazy(() => import('@/pages/errors/403'));

const EmployeesPage = lazy(() => import('@/pages/employees'));
const AddEditEmployeePage = lazy(() => import('@/pages/employees/add-or-edit/index'));

// Dashboards
const DashboardsPage = lazy(() => import('@/pages/dashboards'));

// Attendace
const AttendanceAdminPage = lazy(() => import('@/pages/attendance/admin'));

// // Shift
// const ShiftPage = lazy(() => import('@/pages/attendance/shift'));

// Finance - Accounting
const DebtTrackingPage = lazy(() => import('@/pages/finance-accounting/DebtTracking'));
const DebtDetailPage = lazy(() => import('@/pages/finance-accounting/DebtTracking/DebtDetail'));
const ReceivablesPage = lazy(() => import('@/pages/finance-accounting/Receivables'));
const PaymentSlipPage = lazy(() => import('@/pages/finance-accounting/PaymentSlip'));
const AddEditPaymentSlipPage = lazy(() => import('@/pages/finance-accounting/PaymentSlip/AddEditPaymentSlip'));
const DebtTransactionPage = lazy(() => import('@/pages/finance-accounting/DebtTransaction'));
const DebtReceivableOtherPage = lazy(() => import('@/pages/finance-accounting/DebtReceivableOther'));
const AddEditDebtReceivableOtherPage = lazy(() => import('@/pages/finance-accounting/DebtReceivableOther/AddEditDebtReceivableOther'));

const DebtTrackingPayablePage = lazy(() => import('@/pages/finance-accounting/DebtTrackingPayable'));
const DebtTrackingPayableDetailPage = lazy(() => import('@/pages/finance-accounting/DebtPayableSupplier'));
const DebtTrackingPayableTransactionPage = lazy(() => import('@/pages/finance-accounting/DebtPayablesTransaction'));

// System
const UsersPage = lazy(() => import('@/pages/system/users'));
const TenantPage = lazy(() => import('@/pages/system/tenant'));
const RoleGroupPage = lazy(() => import('@/pages/system/role-group'));
const UpdatePermissionGroupPage = lazy(() => import('@/pages/system/role-group/UpdatePermissionGroup'));

// Sale Management
const SaleManagement = lazy(() => import('@/pages/sales/Order'));
const SaleManagementAddOrEdit = lazy(() => import('@/pages/sales/Order/add-or-edit'));
const InvoicePage = lazy(() => import('@/pages/sales/Invoice'));
const AddEditInvoicePage = lazy(() => import('@/pages/sales/Invoice/AddEdit'));
const RefundPage = lazy(() => import('@/pages/sales/Refund'));
const AddEditRefundPage = lazy(() => import('@/pages/sales/Refund/add-or-edit'));

// Purchase Management
const PurchaseOrdersPage = lazy(() => import('@/pages/sales/purchase-orders'));
const AddEditPurchaseOrdersPage = lazy(() => import('@/pages/sales/purchase-orders/add-or-edit'));
const PurchaseInvoicePage = lazy(() => import('@/pages/sales/purchase-invoice'));
const AddEditPurchaseInvoicePage = lazy(() => import('@/pages/sales/purchase-invoice/AddEdit'));
const PurchaseRefundPage = lazy(() => import('@/pages/sales/purchase-refund'));
const AddEditPurchaseRefundPage = lazy(() => import('@/pages/sales/purchase-refund/add-or-edit'));

// Logistics
const EnterWarehousePage = lazy(() => import('@/pages/logistics/EnterWarehouse'));
const HistoryEnterWarehousePage = lazy(() => import('@/pages/logistics/EnterWarehouse/HistoryEnterWarehouse'));
const HistoryExportWarehousePage = lazy(() => import('@/pages/logistics/ExportWarehouse/HistoryExportWarehouse'));
const AddEditEnterWarehousePage = lazy(() => import('@/pages/logistics/EnterWarehouse/AddEditEnterWarehouse'));
const ExportWarehousePage = lazy(() => import('@/pages/logistics/ExportWarehouse'));
const AddEditExportWarehousePage = lazy(() => import('@/pages/logistics/ExportWarehouse/AddEditExportWarehouse'));
const InventoryPage = lazy(() => import('@/pages/logistics/Inventory'));
const WarehouseConfigPage = lazy(() => import('@/pages/logistics/WarehouseConfig'));

// Product
const ProductCategoryPage = lazy(() => import('@/pages/Product/index'));
const AddEditProductPage = lazy(() => import('@/pages/Product/AddEditProduct'));

//Customer

const CustomersInfoPage = lazy(() => import('@/pages/customers/CustomerInfo'));
const AddEditCustomersInfoPage = lazy(() => import('@/pages/customers/CustomerInfo/AddEditCustomerInfo'));
const CustomerHistoryPage = lazy(() => import('@/pages/customers/CustomerHistory'));

//Supplier
const SupplierHistoryPage = lazy(() => import('@/pages/suppliers/SupplierHistory'));
const SuppliersInfoPage = lazy(() => import('@/pages/suppliers/SupplierInfo'));
const AddEditSupplierInfoPage = lazy(() => import('@/pages/suppliers/SupplierInfo/AddEditSupplierInfo'));

// Categories
const ProductTypePage = lazy(() => import('@/pages/categories/ProductType/index'));
const ProductGroupPage = lazy(() => import('@/pages/categories/ProductGroup/index'));
const SalesMethodPage = lazy(() => import('@/pages/categories/SalesMethod/index'));
const CustomerTypePage = lazy(() => import('@/pages/categories/CustomerType/index'));
const PartnerTypePage = lazy(() => import('@/pages/categories/PartnerType/index'));
const PaymentMethodPage = lazy(() => import('@/pages/categories/PaymentMethod/index'));
const ShippingMethodPage = lazy(() => import('@/pages/categories/ShippingMethod/index'));
const WarehouseAreaPage = lazy(() => import('@/pages/categories/WarehouseType/index'));
const WarehousePage = lazy(() => import('@/pages/categories/Warehouse/index'));
const DepartmentPage = lazy(() => import('@/pages/categories/Department/index'));
const PositionPage = lazy(() => import('@/pages/categories/Position/index'));
const PaymentFundPage = lazy(() => import('@/pages/categories/PaymentFund'));
const ExpensesTypePage = lazy(() => import('@/pages/categories/ExpensesType'));

const InprogressPage = () => <div className="p-8 text-center text-xl">Đang Phát triển...</div>;
export type CustomRouteObject = RouteObject & {
    title?: string;
    children?: CustomRouteObject[];
};
export const routeList: CustomRouteObject[] = [
    {
        path: AppRouters.HOME,
        element: <RouteGuard element={<HomePage />} titleId="title.home" roles={DefaultRoles.ALL} />,
    },
    {
        path: AppRouters.LOGIN,
        element: <RouteGuard element={<LoginPage />} titleId="title.login" roles={DefaultRoles.ALL} />,
    },
    {
        path: '',
        id: 'mainRouter',
        element: <RouteGuard element={<LayoutPage />} titleId="title.layout" roles={DefaultRoles.ALL} />,
        children: [
            // DASHBOARDS
            {
                path: AppRouters.DASHBOARDS,
                title: 'title.dashboard',
                element: <RouteGuard element={<Index />} auth={true} titleId="title.dashboard" roles={DefaultRoles.ALL} />,
            },
            {
                path: AppRouters.DASHBOARDS,
                title: 'title.dashboard',
                element: (
                    <RouteGuard
                        element={<DashboardsPage />}
                        auth={true}
                        titleId="title.dashboard"
                        roles={DefaultMappingPermission[AppRouters.DASHBOARDS]}
                    />
                ),
            },

            // SYSTEM
            {
                path: AppRouters.SYSTEM,
                title: 'title.system',
                element: <Navigate to={AppRouters.USERS} />,
            },
            {
                path: AppRouters.USERS,
                title: 'title.users',
                element: <RouteGuard element={<UsersPage />} auth={true} titleId="title.users" roles={DefaultMappingPermission[AppRouters.USERS]} />,
            },
            {
                path: AppRouters.TENANT,
                title: 'menu.tenant',
                element: (
                    <RouteGuard element={<TenantPage />} auth={true} titleId="menu.tenant" roles={DefaultMappingPermission[AppRouters.TENANT]} />
                ),
            },
            {
                path: AppRouters.ROLE_GROUP,
                title: 'title.role_group',
                element: (
                    <RouteGuard
                        element={<RoleGroupPage />}
                        auth={true}
                        titleId="title.role_group"
                        roles={DefaultMappingPermission[AppRouters.ROLE_GROUP]}
                    />
                ),
            },
            {
                path: AppRouters.EDIT_ROLE_GROUP,
                title: 'title.role_group.update',
                element: (
                    <RouteGuard
                        element={<UpdatePermissionGroupPage />}
                        auth={true}
                        titleId="title.role_group.update"
                        roles={DefaultMappingPermission[AppRouters.ROLE_GROUP]}
                    />
                ),
            },
            // EMPLOYEE
            {
                path: AppRouters.EMPLOYEES,
                title: 'title.employees',
                element: <RouteGuard element={<EmployeesPage />} auth={true} titleId="title.employees" roles={DefaultRoles.ALL} />,
            },
            {
                path: AppRouters.EMPLOYEE_ADD,
                title: 'title.employees.add',
                element: <RouteGuard element={<AddEditEmployeePage />} auth={true} titleId="title.employees.add" roles={DefaultRoles.ALL} />,
            },
            {
                path: AppRouters.EMPLOYEE_DETAIL,
                title: 'employee.edit',
                element: <RouteGuard element={<AddEditEmployeePage />} auth={true} titleId="employee.edit" roles={DefaultRoles.ALL} />,
            },

            // CONTRACT
            {
                path: AppRouters.CONTRACT,
                title: 'title.contract',
                element: <RouteGuard element={<ContractPage />} auth={true} titleId="title.contract" roles={DefaultRoles.ALL} />,
            },
            {
                path: AppRouters.ADD_CONTRACT,
                title: 'title.contract.add',
                element: <RouteGuard element={<AddOrChangeContract />} auth={true} titleId="title.contract.add" roles={DefaultRoles.ALL} />,
            },
            {
                path: AppRouters.EDIT_CONTRACT,
                title: 'title.contract.edit',
                element: <RouteGuard element={<AddOrChangeContract />} auth={true} titleId="title.contract.edit" roles={DefaultRoles.ALL} />,
            },
            {
                path: AppRouters.DETAIL_CONTRACT,
                title: 'title.contract.edit',
                element: <RouteGuard element={<ContractDetail />} auth={true} titleId="title.contract.edit" roles={DefaultRoles.ALL} />,
            },

            // PORTAL
            {
                path: AppRouters.PORTAL_CONTRACT,
                title: 'title.portal.contract',
                element: <RouteGuard element={<PortalContract />} auth={true} titleId="title.portal.contract" roles={DefaultRoles.ALL} />,
            },
            {
                path: AppRouters.PORTAL_CONTRACT_RATE,
                title: 'title.portal.contract',
                element: <RouteGuard element={<PortalContractRate />} auth={true} titleId="title.portal.contract" roles={DefaultRoles.ALL} />,
            },

            // PROFILE
            {
                path: AppRouters.PROFILE,
                title: 'title.profile',
                element: <RouteGuard element={<Profile />} auth={true} titleId="title.profile" roles={DefaultRoles.ALL} />,
            },

            // ATTENDANCE
            {
                path: AppRouters.ATTENDANCE_ADMIN,
                title: 'title.attendance.admin',
                element: <RouteGuard element={<AttendanceAdminPage />} auth={true} titleId="title.attendance.admin" roles={DefaultRoles.ALL} />,
            },

            // SHIFT
            // {
            //     path: AppRouters.SHIFT,
            //     title: 'title.shift',
            //     element: <RouteGuard element={<ShiftPage />} auth={true} titleId="title.shift" roles={DefaultRoles.ALL} />,
            // },
            // PAYROLL
            {
                path: AppRouters.PAYROLL,
                title: 'title.payroll',
                element: <RouteGuard element={<PayrollPage />} auth={true} titleId="title.payroll" roles={DefaultRoles.ALL} />,
            },
            {
                path: AppRouters.PAYROLL_DETAIL,
                title: 'title.payroll.detail',
                element: <RouteGuard element={<PayrollDetailPage />} auth={true} titleId="title.payroll.detail" roles={DefaultRoles.ALL} />,
            },

            // Not found or no permission
            {
                path: AppRouters.NO_PERMISSION,
                element: <RouteGuard element={<NoPermission />} auth={true} titleId="title.no_permission" roles={DefaultRoles.ALL} />,
            },
            {
                path: '*',
                element: <RouteGuard element={<NotFound />} auth={true} titleId="title.notFount" roles={DefaultRoles.ALL} />,
            },

            // Finance - Accounting
            {
                path: AppRouters.FINANCE_ACCOUNTING,
                title: 'menu.finance_accounting',
                element: <Navigate to={AppRouters.DEBT_TRACKING} />,
            },
            {
                path: AppRouters.DEBT_TRACKING,
                title: 'finance_accounting.debt_tracking_receivable',
                element: (
                    <RouteGuard
                        element={<DebtTrackingPage />}
                        auth={true}
                        titleId="finance_accounting.debt_tracking_receivable"
                        roles={DefaultMappingPermission[AppRouters.DEBT_TRACKING]}
                    />
                ),
            },
            {
                path: AppRouters.DEBT_DETAIL,
                title: 'finance_accounting.debt_detail',
                element: (
                    <RouteGuard
                        element={<DebtDetailPage />}
                        auth={true}
                        titleId="finance_accounting.debt_detail"
                        roles={DefaultMappingPermission[AppRouters.DEBT_DETAIL]}
                    />
                ),
            },
            {
                path: AppRouters.DEBT_TRANSACTION,
                title: 'finance_accounting.debt_detail',
                element: <Navigate to={AppRouters.DEBT_TRACKING} />,
            },
            {
                path: AppRouters.DEBT_PAYABLE_TRANSACTION,
                title: 'finance_accounting.payables.detail',
                element: <Navigate to={AppRouters.DEBT_TRACKING_PAYABLE} />,
            },

            {
                path: AppRouters.DEBT_DETAIL_TRANSACTION,
                title: 'finance_accounting.debt_transaction',
                element: (
                    <RouteGuard
                        element={<DebtTransactionPage />}
                        auth={true}
                        titleId="finance_accounting.debt_transaction"
                        roles={DefaultMappingPermission[AppRouters.DEBT_DETAIL_TRANSACTION]}
                    />
                ),
            },
            {
                path: AppRouters.RECEIVABLES,
                title: 'finance_accounting.receivables',
                element: (
                    <RouteGuard
                        element={<ReceivablesPage />}
                        auth={true}
                        titleId="finance_accounting.receivables"
                        roles={DefaultMappingPermission[AppRouters.RECEIVABLES]}
                    />
                ),
            },
            {
                path: AppRouters.RECEIVABLES_TRANSACTION,
                title: 'finance_accounting.debt_transaction',
                element: (
                    <RouteGuard
                        element={<DebtTransactionPage />}
                        auth={true}
                        titleId="finance_accounting.debt_transaction"
                        roles={DefaultMappingPermission[AppRouters.RECEIVABLES_TRANSACTION]}
                    />
                ),
            },

            {
                path: AppRouters.PAYMENT_SLIP,
                title: 'finance_accounting.payment_slip',
                element: (
                    <RouteGuard
                        element={<PaymentSlipPage />}
                        auth={true}
                        titleId="finance_accounting.payment_slip"
                        roles={DefaultMappingPermission[AppRouters.PAYMENT_SLIP]}
                    />
                ),
            },
            {
                path: AppRouters.PAYMENT_SLIP_ADD,
                title: 'finance_accounting.payment_slip.add',
                element: (
                    <RouteGuard
                        element={<AddEditPaymentSlipPage />}
                        auth={true}
                        titleId="finance_accounting.payment_slip.add"
                        roles={DefaultMappingPermission[AppRouters.PAYMENT_SLIP_ADD]}
                    />
                ),
            },
            {
                path: AppRouters.PAYMENT_SLIP_EDIT,
                title: 'finance_accounting.payment_slip.edit',
                element: (
                    <RouteGuard
                        element={<AddEditPaymentSlipPage />}
                        auth={true}
                        titleId="finance_accounting.payment_slip.edit"
                        roles={DefaultMappingPermission[AppRouters.PAYMENT_SLIP_EDIT]}
                    />
                ),
            },
            {
                path: AppRouters.DEBT_RECEIVABELES_OTHER,
                title: 'finance_accounting.debt_receivables_other',
                element: (
                    <RouteGuard
                        element={<DebtReceivableOtherPage />}
                        auth={true}
                        titleId="finance_accounting.debt_receivables_other"
                        roles={DefaultMappingPermission[AppRouters.DEBT_RECEIVABELES_OTHER]}
                    />
                ),
            },
            {
                path: AppRouters.DEBT_RECEIVABELES_OTHER_ADD,
                title: 'finance_accounting.debt_receivable_other.add',
                element: (
                    <RouteGuard
                        element={<AddEditDebtReceivableOtherPage />}
                        auth={true}
                        titleId="finance_accounting.debt_receivable_other.add"
                        roles={DefaultMappingPermission[AppRouters.DEBT_RECEIVABELES_OTHER_ADD]}
                    />
                ),
            },
            {
                path: AppRouters.DEBT_RECEIVABELES_OTHER_EDIT,
                title: 'finance_accounting.debt_receivable_other.edit',
                element: (
                    <RouteGuard
                        element={<AddEditDebtReceivableOtherPage />}
                        auth={true}
                        titleId="finance_accounting.debt_receivable_other.edit"
                        roles={DefaultMappingPermission[AppRouters.DEBT_RECEIVABELES_OTHER_EDIT]}
                    />
                ),
            },
            {
                path: AppRouters.DEBT_TRACKING_PAYABLE,
                title: 'finance_accounting.debt_tracking_payable',
                element: (
                    <RouteGuard
                        element={<DebtTrackingPayablePage />}
                        auth={true}
                        titleId="finance_accounting.debt_tracking_payable"
                        roles={DefaultMappingPermission[AppRouters.DEBT_TRACKING_PAYABLE]}
                    />
                ),
            },
            {
                path: AppRouters.DEBT_TRACKING_PAYABLE_DETAIL,
                title: 'finance_accounting.payables.detail',
                element: (
                    <RouteGuard
                        element={<DebtTrackingPayableDetailPage />}
                        auth={true}
                        titleId="finance_accounting.payables.detail"
                        roles={DefaultMappingPermission[AppRouters.DEBT_TRACKING_PAYABLE_DETAIL]}
                    />
                ),
            },
            {
                path: AppRouters.DEBT_TRACKING_PAYABLE_TRANSACTION,
                title: 'finance_accounting.debt_transaction',
                element: (
                    <RouteGuard
                        element={<DebtTrackingPayableTransactionPage />}
                        auth={true}
                        titleId="finance_accounting.debt_transaction"
                        roles={DefaultMappingPermission[AppRouters.DEBT_TRACKING_PAYABLE_TRANSACTION]}
                    />
                ),
            },

            // Sale Management
            {
                path: AppRouters.SALE_MANAGEMENT,
                title: 'title.sale_management',
                element: <Navigate to={AppRouters.SALES_ORDER} />,
            },
            {
                path: AppRouters.SALES_ORDER,
                title: 'menu.order',
                element: (
                    <RouteGuard
                        element={<SaleManagement />}
                        auth={true}
                        titleId="title.sale_management"
                        roles={DefaultMappingPermission[AppRouters.SALES_ORDER]}
                    />
                ),
            },
            {
                path: AppRouters.SALES_ORDER_ADD,
                title: 'title.sale_management_add',
                element: (
                    <RouteGuard element={<SaleManagementAddOrEdit />} auth={true} titleId="title.sale_management_add" roles={DefaultRoles.ALL} />
                ),
            },
            {
                path: AppRouters.SALES_ORDER_EDIT,
                title: 'title.sale_management_edit',
                element: (
                    <RouteGuard element={<SaleManagementAddOrEdit />} auth={true} titleId="title.sale_management_edit" roles={DefaultRoles.ALL} />
                ),
            },

            {
                path: AppRouters.INVOICE,
                title: 'sales.invoice',
                element: (
                    <RouteGuard element={<InvoicePage />} auth={true} titleId="sales.invoice" roles={DefaultMappingPermission[AppRouters.INVOICE]} />
                ),
            },
            {
                path: AppRouters.INVOICE_TRANSACTION,
                title: 'finance_accounting.debt_transaction',
                element: (
                    <RouteGuard
                        element={<DebtTransactionPage />}
                        auth={true}
                        titleId="finance_accounting.debt_transaction"
                        roles={DefaultMappingPermission[AppRouters.INVOICE_TRANSACTION]}
                    />
                ),
            },
            {
                path: AppRouters.ADD_INVOICE,
                title: 'sales.invoice.add',
                element: (
                    <RouteGuard
                        element={<AddEditInvoicePage />}
                        auth={true}
                        titleId="sales.invoice.add"
                        roles={DefaultMappingPermission[AppRouters.ADD_INVOICE]}
                    />
                ),
            },
            {
                path: AppRouters.EDIT_INVOICE,
                title: 'sales.invoice.edit',
                element: (
                    <RouteGuard
                        element={<AddEditInvoicePage />}
                        auth={true}
                        titleId="sales.invoice.edit"
                        roles={DefaultMappingPermission[AppRouters.EDIT_INVOICE]}
                    />
                ),
            },
            {
                path: AppRouters.REFUND,
                title: 'sales.return',
                element: (
                    <RouteGuard element={<RefundPage />} auth={true} titleId="sales.return" roles={DefaultMappingPermission[AppRouters.REFUND]} />
                ),
            },
            {
                path: AppRouters.ADD_REFUND,
                title: 'sales.return.add',
                element: (
                    <RouteGuard
                        element={<AddEditRefundPage />}
                        auth={true}
                        titleId="sales.return.add"
                        roles={DefaultMappingPermission[AppRouters.ADD_REFUND]}
                    />
                ),
            },
            {
                path: AppRouters.EDIT_REFUND,
                title: 'sales.return.edit',
                element: (
                    <RouteGuard
                        element={<AddEditRefundPage />}
                        auth={true}
                        titleId="sales.return.edit"
                        roles={DefaultMappingPermission[AppRouters.EDIT_REFUND]}
                    />
                ),
            },

            {
                path: AppRouters.PURCHASE_MANAGEMENT,
                title: 'purchase-management',
                element: <Navigate to={AppRouters.PURCHASE_ORDERS} />,
            },
            {
                path: AppRouters.PURCHASE_ORDERS,
                title: 'menu.purchase_orders',
                element: (
                    <RouteGuard
                        element={<PurchaseOrdersPage />}
                        auth={true}
                        titleId="menu.purchase_orders"
                        roles={DefaultMappingPermission[AppRouters.PURCHASE_ORDERS]}
                    />
                ),
            },
            {
                path: AppRouters.PURCHASE_ORDERS_ADD,
                title: 'menu.purchase_orders_add',
                element: (
                    <RouteGuard
                        element={<AddEditPurchaseOrdersPage />}
                        auth={true}
                        titleId="menu.purchase_orders_add"
                        roles={DefaultMappingPermission[AppRouters.PURCHASE_ORDERS_ADD]}
                    />
                ),
            },
            {
                path: AppRouters.PURCHASE_ORDERS_EDIT,
                title: 'menu.purchase_orders_edit',
                element: (
                    <RouteGuard
                        element={<AddEditPurchaseOrdersPage />}
                        auth={true}
                        titleId="menu.purchase_orders_edit"
                        roles={DefaultMappingPermission[AppRouters.PURCHASE_ORDERS_EDIT]}
                    />
                ),
            },
            {
                path: AppRouters.PURCHASE_INVOICE,
                title: 'menu.purchase_invoice',
                element: (
                    <RouteGuard
                        element={<PurchaseInvoicePage />}
                        auth={true}
                        titleId="menu.purchase_invoice"
                        roles={DefaultMappingPermission[AppRouters.PURCHASE_INVOICE]}
                    />
                ),
            },
            {
                path: AppRouters.PURCHASE_INVOICE_ADD,
                title: 'menu.purchase_invoice_add',
                element: (
                    <RouteGuard
                        element={<AddEditPurchaseInvoicePage />}
                        auth={true}
                        titleId="menu.purchase_invoice_add"
                        roles={DefaultMappingPermission[AppRouters.PURCHASE_INVOICE_ADD]}
                    />
                ),
            },
            {
                path: AppRouters.PURCHASE_INVOICE_EDIT,
                title: 'menu.purchase_invoice_edit',
                element: (
                    <RouteGuard
                        element={<AddEditPurchaseInvoicePage />}
                        auth={true}
                        titleId="menu.purchase_invoice_edit"
                        roles={DefaultMappingPermission[AppRouters.PURCHASE_INVOICE_EDIT]}
                    />
                ),
            },
            {
                path: AppRouters.PURCHASE_REFUND,
                title: 'menu.purchase_refund',
                element: (
                    <RouteGuard
                        element={<PurchaseRefundPage />}
                        auth={true}
                        titleId="menu.purchase_refund"
                        roles={DefaultMappingPermission[AppRouters.PURCHASE_REFUND]}
                    />
                ),
            },
            {
                path: AppRouters.PURCHASE_REFUND_ADD,
                title: 'menu.purchase_refund_add',
                element: (
                    <RouteGuard
                        element={<AddEditPurchaseRefundPage />}
                        auth={true}
                        titleId="menu.purchase_refund_add"
                        roles={DefaultMappingPermission[AppRouters.PURCHASE_REFUND_ADD]}
                    />
                ),
            },
            {
                path: AppRouters.PURCHASE_REFUND_EDIT,
                title: 'menu.purchase_refund_edit',
                element: (
                    <RouteGuard
                        element={<AddEditPurchaseRefundPage />}
                        auth={true}
                        titleId="menu.purchase_refund_edit"
                        roles={DefaultMappingPermission[AppRouters.PURCHASE_REFUND_EDIT]}
                    />
                ),
            },
            {
                path: AppRouters.PURCHASE_INVOICE_TRANSACTION,
                title: 'finance_accounting.debt_transaction',
                element: (
                    <RouteGuard
                        element={<DebtTrackingPayableTransactionPage />}
                        auth={true}
                        titleId="finance_accounting.debt_transaction"
                        roles={DefaultMappingPermission[AppRouters.PURCHASE_INVOICE_TRANSACTION]}
                    />
                ),
            },
            {
                path: AppRouters.PURCHASE_INVOICE_TRANSACTION_NAVIGATE,
                element: <Navigate to={AppRouters.PURCHASE_INVOICE} />,
            },

            // Logistics

            {
                path: AppRouters.LOGISTICS,
                title: 'menu.logistics',
                element: <Navigate to={AppRouters.ENTER_WAREHOUSE} />,
            },
            {
                path: AppRouters.ENTER_WAREHOUSE,
                title: 'logistics.enter_warehouse',
                element: (
                    <RouteGuard
                        element={<EnterWarehousePage />}
                        auth={true}
                        titleId="logistics.enter_warehouse"
                        roles={DefaultMappingPermission[AppRouters.ENTER_WAREHOUSE]}
                    />
                ),
            },
            {
                path: AppRouters.HISTORY_ENTER_WAREHOUSE,
                title: 'logistics.enter_warehouse.history',
                element: (
                    <RouteGuard
                        element={<HistoryEnterWarehousePage />}
                        auth={true}
                        titleId="logistics.enter_warehouse.history"
                        roles={DefaultMappingPermission[AppRouters.HISTORY_ENTER_WAREHOUSE]}
                    />
                ),
            },
            {
                path: AppRouters.ADD_ENTER_WAREHOUSE,
                title: 'logistics.enter_warehouse.add',
                element: (
                    <RouteGuard
                        element={<AddEditEnterWarehousePage />}
                        auth={true}
                        titleId="logistics.enter_warehouse.add"
                        roles={DefaultMappingPermission[AppRouters.ADD_ENTER_WAREHOUSE]}
                    />
                ),
            },
            {
                path: AppRouters.EDIT_ENTER_WAREHOUSE,
                title: 'logistics.enter_warehouse.edit',
                element: (
                    <RouteGuard
                        element={<AddEditEnterWarehousePage />}
                        auth={true}
                        titleId="logistics.enter_warehouse.edit"
                        roles={DefaultMappingPermission[AppRouters.EDIT_ENTER_WAREHOUSE]}
                    />
                ),
            },
            {
                path: AppRouters.HISTORY_EXPORT_WAREHOUSE,
                title: 'logistics.export_warehouse.history',
                element: (
                    <RouteGuard
                        element={<HistoryExportWarehousePage />}
                        auth={true}
                        titleId="logistics.export_warehouse.history"
                        roles={DefaultMappingPermission[AppRouters.HISTORY_EXPORT_WAREHOUSE]}
                    />
                ),
            },
            {
                path: AppRouters.EXPORT_WAREHOUSE,
                title: 'logistics.export_warehouse',
                element: (
                    <RouteGuard
                        element={<ExportWarehousePage />}
                        auth={true}
                        titleId="logistics.export_warehouse"
                        roles={DefaultMappingPermission[AppRouters.EXPORT_WAREHOUSE]}
                    />
                ),
            },
            {
                path: AppRouters.ADD_EXPORT_WAREHOUSE,
                title: 'logistics.export_warehouse.add',
                element: (
                    <RouteGuard
                        element={<AddEditExportWarehousePage />}
                        auth={true}
                        titleId="logistics.export_warehouse.add"
                        roles={DefaultMappingPermission[AppRouters.ADD_EXPORT_WAREHOUSE]}
                    />
                ),
            },
            {
                path: AppRouters.EDIT_EXPORT_WAREHOUSE,
                title: 'logistics.export_warehouse.edit',
                element: (
                    <RouteGuard
                        element={<AddEditExportWarehousePage />}
                        auth={true}
                        titleId="logistics.export_warehouse.edit"
                        roles={DefaultMappingPermission[AppRouters.EDIT_EXPORT_WAREHOUSE]}
                    />
                ),
            },
            {
                path: AppRouters.INVENTORY,
                title: 'logistics.inventory',
                element: (
                    <RouteGuard
                        element={<InventoryPage />}
                        auth={true}
                        titleId="logistics.inventory"
                        roles={DefaultMappingPermission[AppRouters.INVENTORY]}
                    />
                ),
            },
            {
                path: AppRouters.WAREHOUSE_CONFIG,
                title: 'logistics.warehouse_config',
                element: (
                    <RouteGuard
                        element={<WarehouseConfigPage />}
                        auth={true}
                        titleId="logistics.warehouse_config"
                        roles={DefaultMappingPermission[AppRouters.WAREHOUSE_CONFIG]}
                    />
                ),
            },
            // Categories
            {
                path: AppRouters.CATEGORIES,
                title: 'menu.category',
                element: <Navigate to={AppRouters.PRODUCT_GROUP} />,
            },
            {
                path: AppRouters.PRODUCT_TYPE,
                title: 'menu.productType',
                element: (
                    <RouteGuard
                        element={<ProductTypePage />}
                        auth={true}
                        titleId="menu.productType"
                        roles={DefaultMappingPermission[AppRouters.PRODUCT_TYPE]}
                    />
                ),
            },
            {
                path: AppRouters.PRODUCT_GROUP,
                title: 'menu.productGroup',
                element: (
                    <RouteGuard
                        element={<ProductGroupPage />}
                        auth={true}
                        titleId="menu.productGroup"
                        roles={DefaultMappingPermission[AppRouters.PRODUCT_GROUP]}
                    />
                ),
            },
            {
                path: AppRouters.SALES_METHOD,
                title: 'menu.salesMethod',
                element: (
                    <RouteGuard
                        element={<SalesMethodPage />}
                        auth={true}
                        titleId="menu.salesMethod"
                        roles={DefaultMappingPermission[AppRouters.SALES_METHOD]}
                    />
                ),
            },
            {
                path: AppRouters.CUSTOMER_TYPE,
                title: 'menu.customerType',
                element: (
                    <RouteGuard
                        element={<CustomerTypePage />}
                        auth={true}
                        titleId="menu.customerType"
                        roles={DefaultMappingPermission[AppRouters.CUSTOMER_TYPE]}
                    />
                ),
            },
            {
                path: AppRouters.PARTNER_TYPE,
                title: 'menu.partnerType',
                element: (
                    <RouteGuard
                        element={<PartnerTypePage />}
                        auth={true}
                        titleId="menu.partnerType"
                        roles={DefaultMappingPermission[AppRouters.PARTNER_TYPE]}
                    />
                ),
            },
            {
                path: AppRouters.PAYMENT_METHOD,
                title: 'menu.paymentMethod',
                element: (
                    <RouteGuard
                        element={<PaymentMethodPage />}
                        auth={true}
                        titleId="menu.paymentMethod"
                        roles={DefaultMappingPermission[AppRouters.PAYMENT_METHOD]}
                    />
                ),
            },
            {
                path: AppRouters.PAYMENT_FUND,
                title: 'menu.paymentFund',
                element: (
                    <RouteGuard
                        element={<PaymentFundPage />}
                        auth={true}
                        titleId="menu.paymentFund"
                        roles={DefaultMappingPermission[AppRouters.PAYMENT_FUND]}
                    />
                ),
            },
            {
                path: AppRouters.EXPENSES_TYPE,
                title: 'menu.expensesType',
                element: (
                    <RouteGuard
                        element={<ExpensesTypePage />}
                        auth={true}
                        titleId="menu.expensesType"
                        roles={DefaultMappingPermission[AppRouters.EXPENSES_TYPE]}
                    />
                ),
            },
            {
                path: AppRouters.SHIPPING_METHOD,
                title: 'menu.shippingMethod',
                element: (
                    <RouteGuard
                        element={<ShippingMethodPage />}
                        auth={true}
                        titleId="menu.shippingMethod"
                        roles={DefaultMappingPermission[AppRouters.SHIPPING_METHOD]}
                    />
                ),
            },
            {
                path: AppRouters.WAREHOUSE_AREA,
                title: 'menu.warehouseArea',
                element: (
                    <RouteGuard
                        element={<WarehouseAreaPage />}
                        auth={true}
                        titleId="menu.warehouseArea"
                        roles={DefaultMappingPermission[AppRouters.WAREHOUSE_AREA]}
                    />
                ),
            },
            {
                path: AppRouters.WAREHOUSE,
                title: 'menu.warehouse',
                element: (
                    <RouteGuard
                        element={<WarehousePage />}
                        auth={true}
                        titleId="menu.warehouse"
                        roles={DefaultMappingPermission[AppRouters.WAREHOUSE]}
                    />
                ),
            },
            {
                path: AppRouters.DEPARTMENT,
                title: 'menu.department',
                element: (
                    <RouteGuard
                        element={<DepartmentPage />}
                        auth={true}
                        titleId="menu.department"
                        roles={DefaultMappingPermission[AppRouters.DEPARTMENT]}
                    />
                ),
            },
            {
                path: AppRouters.POSITION,
                title: 'menu.position',
                element: (
                    <RouteGuard
                        element={<PositionPage />}
                        auth={true}
                        titleId="menu.position"
                        roles={DefaultMappingPermission[AppRouters.POSITION]}
                    />
                ),
            },
            {
                path: AppRouters.MARKETING,
                title: 'Marketing',
                element: <Navigate to={AppRouters.DISCOUNT_POLICY} />,
            },

            // Customer
            {
                path: AppRouters.CUSTOMER,
                title: 'customer.profile',
                element: <Navigate to={AppRouters.CUSTOMER_INFO} />,
            },
            {
                path: AppRouters.CUSTOMER_INFO,
                title: 'customer.info',
                element: (
                    <RouteGuard
                        element={<CustomersInfoPage />}
                        auth={true}
                        titleId="title.customers"
                        roles={DefaultMappingPermission[AppRouters.CUSTOMER_INFO]}
                    />
                ),
            },
            {
                path: AppRouters.ADD_CUSTOMER_INFO,
                title: 'customer.info.add',
                element: (
                    <RouteGuard
                        element={<AddEditCustomersInfoPage />}
                        auth={true}
                        titleId="customer.info.add"
                        roles={DefaultMappingPermission[AppRouters.CUSTOMER_INFO]}
                    />
                ),
            },
            {
                path: AppRouters.EDIT_CUSTOMER_INFO,
                title: 'customer.info.edit',
                element: (
                    <RouteGuard
                        element={<AddEditCustomersInfoPage />}
                        auth={true}
                        titleId="customer.info.edit"
                        roles={DefaultMappingPermission[AppRouters.CUSTOMER_INFO]}
                    />
                ),
            },
            {
                path: AppRouters.CUSTOMER_HISTORY,
                title: 'CustomerHistory',
                element: (
                    <RouteGuard
                        element={<CustomerHistoryPage />}
                        auth={true}
                        titleId="CustomerHistory"
                        roles={DefaultMappingPermission[AppRouters.CUSTOMER_HISTORY]}
                    />
                ),
            },
            {
                path: AppRouters.VIEW_HISTORY_DETAIL,
                title: 'CustomerHistory',
                element: (
                    <RouteGuard
                        element={<CustomerHistoryPage />}
                        auth={true}
                        titleId="CustomerHistory"
                        roles={DefaultMappingPermission[AppRouters.VIEW_HISTORY_DETAIL]}
                    />
                ),
            },
            // Supplier
            {
                path: AppRouters.SUPPLIER,
                title: 'menu.suppliers',
                element: <Navigate to={AppRouters.SUPPLIER_INFO} />,
            },
            {
                path: AppRouters.SUPPLIER_INFO,
                title: 'supplier.info',
                element: (
                    <RouteGuard
                        element={<SuppliersInfoPage />}
                        auth={true}
                        titleId="title.suppliers"
                        roles={DefaultMappingPermission[AppRouters.SUPPLIER_INFO]}
                    />
                ),
            },
            {
                path: AppRouters.ADD_SUPPLIER_INFO,
                title: 'supplier.info.add',
                element: (
                    <RouteGuard
                        element={<AddEditSupplierInfoPage />}
                        auth={true}
                        titleId="supplier.info.add"
                        roles={DefaultMappingPermission[AppRouters.SUPPLIER_INFO]}
                    />
                ),
            },
            {
                path: AppRouters.EDIT_SUPPLIER_INFO,
                title: 'supplier.info.edit',
                element: (
                    <RouteGuard
                        element={<AddEditSupplierInfoPage />}
                        auth={true}
                        titleId="supplier.info.edit"
                        roles={DefaultMappingPermission[AppRouters.SUPPLIER_INFO]}
                    />
                ),
            },
            {
                path: AppRouters.SUPPLIER_VIEW_HISTORY,
                title: 'SupplierHistory',
                element: (
                    <RouteGuard
                        element={<SupplierHistoryPage />}
                        auth={true}
                        titleId="SupplierHistory"
                        roles={DefaultMappingPermission[AppRouters.SUPPLIER_VIEW_HISTORY]}
                    />
                ),
            },
            {
                path: AppRouters.SUPPLIER_VIEW_HISTORY_DETAIL,
                title: 'SupplierHistory',
                element: (
                    <RouteGuard
                        element={<SupplierHistoryPage />}
                        auth={true}
                        titleId="SupplierHistory"
                        roles={DefaultMappingPermission[AppRouters.SUPPLIER_VIEW_HISTORY_DETAIL]}
                    />
                ),
            },

            // Product Management
            {
                path: AppRouters.CATEGORIES,
                title: 'menu.category',
                element: <Navigate to={AppRouters.PRODUCT_GROUP} />,
            },
            {
                path: AppRouters.PRODUCT_MANAGEMENT,
                title: 'menu.productManagement',
                element: (
                    <RouteGuard
                        element={<ProductCategoryPage />}
                        auth={true}
                        titleId="menu.productManagement"
                        roles={DefaultMappingPermission[AppRouters.PRODUCT_MANAGEMENT]}
                    />
                ),
            },
            {
                path: AppRouters.PRODUCT_MANAGEMENT_ADD,
                title: 'product.add',
                element: (
                    <RouteGuard
                        element={<AddEditProductPage />}
                        auth={true}
                        titleId="product.add"
                        roles={DefaultMappingPermission[AppRouters.PRODUCT_MANAGEMENT_ADD]}
                    />
                ),
            },
            {
                path: AppRouters.PRODUCT_MANAGEMENT_EDIT,
                title: 'product.edit.popup.header',
                element: (
                    <RouteGuard
                        element={<AddEditProductPage />}
                        auth={true}
                        titleId="product.edit.popup.header"
                        roles={DefaultMappingPermission[AppRouters.PRODUCT_MANAGEMENT_EDIT]}
                    />
                ),
            },
        ],
    },
];

const RenderRouter: FC = () => {
    const element = useRoutes(routeList);

    return element;
};

export default RenderRouter;

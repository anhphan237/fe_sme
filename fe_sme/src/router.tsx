import { Suspense, lazy } from 'react'
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import { RequireAuth, RequireRoles } from './layouts/RequireAuth'
import { PageSkeleton } from './components/ui/Skeleton'
import type { Role } from './shared/types'

const Login = lazy(() => import('./pages/auth/Login'))
const RegisterCompany = lazy(() => import('./pages/auth/RegisterCompany'))
const InviteAccept = lazy(() => import('./pages/auth/InviteAccept'))
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminRoles = lazy(() => import('./pages/admin/Roles'))
const AdminKnowledgeBase = lazy(() => import('./pages/admin/KnowledgeBase'))
const AdminDepartments = lazy(() => import('./pages/admin/Departments'))
const Profile = lazy(() => import('./pages/profile/Profile'))
const Notifications = lazy(() => import('./pages/settings/Notifications'))
const Templates = lazy(() => import('./pages/onboarding/Templates'))
const TemplateEditor = lazy(() => import('./pages/onboarding/TemplateEditor'))
const Employees = lazy(() => import('./pages/onboarding/Employees'))
const CreateEmployee = lazy(() => import('./pages/onboarding/CreateEmployee'))
const EmployeeManagement = lazy(() => import('./pages/onboarding/EmployeeManagement'))
const EmployeeDetail = lazy(() => import('./pages/onboarding/EmployeeDetail'))
const OnboardingTasks = lazy(() => import('./pages/onboarding/Tasks'))
const OnboardingAutomation = lazy(() => import('./pages/onboarding/Automation'))
const Documents = lazy(() => import('./pages/documents/Documents'))
const DocumentDetail = lazy(() => import('./pages/documents/DocumentDetail'))
const Acknowledgments = lazy(() => import('./pages/documents/Acknowledgments'))
const SurveyTemplates = lazy(() => import('./pages/surveys/SurveyTemplates'))
const SurveyTemplateEditor = lazy(() => import('./pages/surveys/SurveyTemplateEditor'))
const SurveySend = lazy(() => import('./pages/surveys/SurveySend'))
const SurveyInbox = lazy(() => import('./pages/surveys/SurveyInbox'))
const SurveyDetail = lazy(() => import('./pages/surveys/SurveyDetail'))
const SurveyReports = lazy(() => import('./pages/surveys/SurveyReports'))
const Chatbot = lazy(() => import('./pages/chatbot/Chatbot'))
const BillingPlan = lazy(() => import('./pages/billing/Plan'))
const BillingUsage = lazy(() => import('./pages/billing/Usage'))
const BillingInvoices = lazy(() => import('./pages/billing/Invoices'))
const BillingPayment = lazy(() => import('./pages/billing/Payment'))
const PlatformTenants = lazy(() => import('./pages/platform/Tenants'))
const PlatformPlans = lazy(() => import('./pages/platform/Plans'))
const PlatformSubscriptions = lazy(() => import('./pages/platform/Subscriptions'))
const PlatformUsage = lazy(() => import('./pages/platform/Usage'))
const PlatformFinance = lazy(() => import('./pages/platform/Finance'))
const PlatformDunning = lazy(() => import('./pages/platform/Dunning'))
const PlatformInvoices = lazy(() => import('./pages/platform/Invoices'))
const PlatformPayments = lazy(() => import('./pages/platform/Payments'))
const PlatformEmailLogs = lazy(() => import('./pages/platform/EmailLogs'))
const Forbidden = lazy(() => import('./pages/Forbidden'))

const suspense = (node: JSX.Element) => (
  <Suspense fallback={<PageSkeleton />}>{node}</Suspense>
)

const withRoles = (node: JSX.Element, requiredRoles?: Role[]) => {
  if (!requiredRoles || requiredRoles.length === 0) {
    return node
  }
  return <RequireRoles requiredRoles={requiredRoles}>{node}</RequireRoles>
}

export const router = createBrowserRouter([
  {
    element: (
      <AuthLayout>
        <Outlet />
      </AuthLayout>
    ),
    children: [
      { path: '/login', element: suspense(<Login />) },
      { path: '/register-company', element: suspense(<RegisterCompany />) },
      { path: '/invite/accept', element: suspense(<InviteAccept />) },
    ],
  },
  {
    element: (
      <RequireAuth>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </RequireAuth>
    ),
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: suspense(<Dashboard />) },
      {
        path: '/admin/departments',
        element: suspense(withRoles(<AdminDepartments />, ['COMPANY_ADMIN'])),
      },
      {
        path: '/admin/users',
        element: suspense(withRoles(<AdminUsers />, ['COMPANY_ADMIN'])),
      },
      {
        path: '/admin/roles',
        element: suspense(withRoles(<AdminRoles />, ['COMPANY_ADMIN'])),
      },
      {
        path: '/admin/knowledge-base',
        element: suspense(withRoles(<AdminKnowledgeBase />, ['HR'])),
      },
      { path: '/profile', element: suspense(<Profile />) },
      { path: '/settings/notifications', element: suspense(<Notifications />) },
      {
        path: '/onboarding/templates',
        element: suspense(withRoles(<Templates />, ['HR'])),
      },
      {
        path: '/onboarding/templates/new',
        element: suspense(withRoles(<TemplateEditor />, ['HR'])),
      },
      {
        path: '/onboarding/templates/:templateId',
        element: suspense(withRoles(<TemplateEditor />, ['HR'])),
      },
      {
        path: '/onboarding/employees',
        element: suspense(withRoles(<Employees />, ['HR', 'MANAGER', 'EMPLOYEE'])),
      },
      {
        path: '/onboarding/employees/new',
        element: suspense(withRoles(<EmployeeManagement />, ['HR'])),
      },
      {
        path: '/onboarding/employees/create',
        element: suspense(withRoles(<CreateEmployee />, ['HR'])),
      },
      {
        path: '/onboarding/employees/:employeeId',
        element: suspense(withRoles(<EmployeeDetail />, ['HR', 'MANAGER', 'EMPLOYEE'])),
      },
      {
        path: '/onboarding/tasks',
        element: suspense(withRoles(<OnboardingTasks />, ['HR', 'MANAGER', 'EMPLOYEE'])),
      },
      {
        path: '/onboarding/automation',
        element: suspense(withRoles(<OnboardingAutomation />, ['HR'])),
      },
      {
        path: '/documents',
        element: suspense(withRoles(<Documents />, ['HR', 'MANAGER', 'EMPLOYEE'])),
      },
      {
        path: '/documents/acknowledgments',
        element: suspense(withRoles(<Acknowledgments />, ['HR', 'MANAGER', 'EMPLOYEE'])),
      },
      {
        path: '/documents/:documentId',
        element: suspense(withRoles(<DocumentDetail />, ['HR', 'MANAGER', 'EMPLOYEE'])),
      },
      {
        path: '/surveys/templates',
        element: suspense(withRoles(<SurveyTemplates />, ['HR'])),
      },
      {
        path: '/surveys/templates/new',
        element: suspense(withRoles(<SurveyTemplateEditor />, ['HR'])),
      },
      {
        path: '/surveys/templates/:templateId',
        element: suspense(withRoles(<SurveyTemplateEditor />, ['HR'])),
      },
      {
        path: '/surveys/send',
        element: suspense(withRoles(<SurveySend />, ['HR'])),
      },
      {
        path: '/surveys/inbox',
        element: suspense(withRoles(<SurveyInbox />, ['HR', 'MANAGER', 'EMPLOYEE'])),
      },
      {
        path: '/surveys/inbox/:surveyId',
        element: suspense(withRoles(<SurveyDetail />, ['HR', 'MANAGER', 'EMPLOYEE'])),
      },
      {
        path: '/surveys/reports',
        element: suspense(withRoles(<SurveyReports />, ['HR'])),
      },
      {
        path: '/chatbot',
        element: suspense(withRoles(<Chatbot />, ['HR', 'MANAGER', 'EMPLOYEE'])),
      },
      {
        path: '/billing/plan',
        element: suspense(withRoles(<BillingPlan />, ['COMPANY_ADMIN'])),
      },
      {
        path: '/billing/usage',
        element: suspense(withRoles(<BillingUsage />, ['COMPANY_ADMIN'])),
      },
      {
        path: '/billing/invoices',
        element: suspense(withRoles(<BillingInvoices />, ['COMPANY_ADMIN'])),
      },
      {
        path: '/billing/payment',
        element: suspense(withRoles(<BillingPayment />, ['COMPANY_ADMIN'])),
      },
      {
        path: '/platform/tenants',
        element: suspense(withRoles(<PlatformTenants />, ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'])),
      },
      {
        path: '/platform/plans',
        element: suspense(withRoles(<PlatformPlans />, ['PLATFORM_ADMIN'])),
      },
      {
        path: '/platform/subscriptions',
        element: suspense(withRoles(<PlatformSubscriptions />, ['PLATFORM_ADMIN'])),
      },
      {
        path: '/platform/usage',
        element: suspense(withRoles(<PlatformUsage />, ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'])),
      },
      {
        path: '/platform/finance',
        element: suspense(withRoles(<PlatformFinance />, ['PLATFORM_ADMIN', 'PLATFORM_MANAGER'])),
      },
      {
        path: '/platform/dunning',
        element: suspense(withRoles(<PlatformDunning />, ['PLATFORM_ADMIN'])),
      },
      {
        path: '/platform/invoices',
        element: suspense(withRoles(<PlatformInvoices />, ['PLATFORM_STAFF'])),
      },
      {
        path: '/platform/payments',
        element: suspense(withRoles(<PlatformPayments />, ['PLATFORM_STAFF'])),
      },
      {
        path: '/platform/email-logs',
        element: suspense(withRoles(<PlatformEmailLogs />, ['PLATFORM_STAFF'])),
      },
      { path: '/403', element: suspense(<Forbidden />) },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])

import { Suspense, lazy } from 'react'
import {
  Navigate,
  Outlet,
  createBrowserRouter,
} from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import { RequireAuth } from './layouts/RequireAuth'
import { PageSkeleton } from './components/ui/Skeleton'

const Login = lazy(() => import('./pages/auth/Login'))
const RegisterCompany = lazy(() => import('./pages/auth/RegisterCompany'))
const InviteAccept = lazy(() => import('./pages/auth/InviteAccept'))
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminRoles = lazy(() => import('./pages/admin/Roles'))
const AdminKnowledgeBase = lazy(() => import('./pages/admin/KnowledgeBase'))
const Profile = lazy(() => import('./pages/profile/Profile'))
const Notifications = lazy(() => import('./pages/settings/Notifications'))
const Templates = lazy(() => import('./pages/onboarding/Templates'))
const TemplateEditor = lazy(() => import('./pages/onboarding/TemplateEditor'))
const Employees = lazy(() => import('./pages/onboarding/Employees'))
const EmployeeDetail = lazy(() => import('./pages/onboarding/EmployeeDetail'))
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
const SuperAdmin = lazy(() => import('./pages/superAdmin/SuperAdmin'))

const suspense = (node: JSX.Element) => (
  <Suspense fallback={<PageSkeleton />}>{node}</Suspense>
)

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
      { path: '/admin/users', element: suspense(<AdminUsers />) },
      { path: '/admin/roles', element: suspense(<AdminRoles />) },
      { path: '/admin/knowledge-base', element: suspense(<AdminKnowledgeBase />) },
      { path: '/profile', element: suspense(<Profile />) },
      { path: '/settings/notifications', element: suspense(<Notifications />) },
      { path: '/onboarding/templates', element: suspense(<Templates />) },
      { path: '/onboarding/templates/new', element: suspense(<TemplateEditor />) },
      { path: '/onboarding/templates/:templateId', element: suspense(<TemplateEditor />) },
      { path: '/onboarding/employees', element: suspense(<Employees />) },
      { path: '/onboarding/employees/:employeeId', element: suspense(<EmployeeDetail />) },
      { path: '/documents', element: suspense(<Documents />) },
      { path: '/documents/acknowledgments', element: suspense(<Acknowledgments />) },
      { path: '/documents/:documentId', element: suspense(<DocumentDetail />) },
      { path: '/surveys/templates', element: suspense(<SurveyTemplates />) },
      { path: '/surveys/templates/new', element: suspense(<SurveyTemplateEditor />) },
      { path: '/surveys/templates/:templateId', element: suspense(<SurveyTemplateEditor />) },
      { path: '/surveys/send', element: suspense(<SurveySend />) },
      { path: '/surveys/inbox', element: suspense(<SurveyInbox />) },
      { path: '/surveys/inbox/:surveyId', element: suspense(<SurveyDetail />) },
      { path: '/surveys/reports', element: suspense(<SurveyReports />) },
      { path: '/chatbot', element: suspense(<Chatbot />) },
      { path: '/billing/plan', element: suspense(<BillingPlan />) },
      { path: '/billing/usage', element: suspense(<BillingUsage />) },
      { path: '/billing/invoices', element: suspense(<BillingInvoices />) },
      { path: '/billing/payment', element: suspense(<BillingPayment />) },
      { path: '/super-admin', element: suspense(<SuperAdmin />) },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])


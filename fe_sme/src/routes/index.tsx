import { Suspense, lazy } from "react";
import {
  Navigate,
  Outlet,
  createBrowserRouter,
  useParams,
} from "react-router-dom";
import { Skeleton } from "antd";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import { GuestRoute, RequireAuth, RequireRoles } from "./route-guard";
import type { Role } from "@/shared/types";

const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));
const Login = lazy(() => import("@/pages/auth/Login"));
const RegisterCompany = lazy(() => import("@/pages/auth/RegisterCompany"));
const InviteAccept = lazy(() => import("@/pages/auth/InviteAccept"));
const InviteSetPassword = lazy(() => import("@/pages/auth/InviteSetPassword"));
const DashboardRouter = lazy(() => import("@/pages/dashboard/DashboardRouter"));
const HRDashboard = lazy(() => import("@/pages/dashboard/HRDashboard"));
const ManagerDashboard = lazy(
  () => import("@/pages/dashboard/ManagerDashboard"),
);
const EmployeeDashboard = lazy(
  () => import("@/pages/dashboard/EmployeeDashboard"),
);
const AdminUsers = lazy(() => import("@/pages/users"));
const AdminRoles = lazy(() => import("@/pages/roles"));
const AdminKnowledgeBase = lazy(() => import("@/pages/knowledge-base"));
const AdminDepartments = lazy(() => import("@/pages/departments"));
const Profile = lazy(() => import("@/pages/profile/Profile"));
const Notifications = lazy(() => import("@/pages/settings/Notifications"));
const NotificationsPage = lazy(
  () => import("@/pages/notifications/NotificationsPage"),
);
const OnboardingDashboard = lazy(() => import("@/pages/onboarding/dashboard"));
const MyJourney = lazy(() => import("@/pages/onboarding/my-journey"));
const Templates = lazy(() => import("@/pages/onboarding/Templates"));
const TemplateEditor = lazy(
  () => import("@/pages/onboarding/templates/editor"),
);
const Employees = lazy(() => import("@/pages/onboarding/employees"));
const EmployeeManagement = lazy(
  () => import("@/pages/onboarding/employees/management"),
);
const EmployeeDetail = lazy(
  () => import("@/pages/onboarding/employees/detail"),
);
const OnboardingTasks = lazy(() => import("@/pages/onboarding/tasks"));
const OnboardingAutomation = lazy(
  () => import("@/pages/onboarding/automation"),
);
const Documents = lazy(() => import("@/pages/documents/Documents"));
const DocumentDetail = lazy(() => import("@/pages/documents/DocumentDetail"));
const Acknowledgments = lazy(() => import("@/pages/documents/Acknowledgments"));
const SurveyTemplates = lazy(() => import("@/pages/surveys/SurveyTemplates"));
const SurveyTemplateEditor = lazy(
  () => import("@/pages/surveys/SurveyTemplateEditor"),
);
const SurveyInbox = lazy(() => import("@/pages/surveys/SurveyInbox"));
const SurveyDetail = lazy(() => import("@/pages/surveys/SurveyDetail"));
const SurveyReports = lazy(() => import("@/pages/surveys/SurveyReports"));
const Chatbot = lazy(() => import("@/pages/chatbot/Chatbot"));
const BillingPlan = lazy(() => import("@/pages/billing/Plan"));
const BillingUsage = lazy(() => import("@/pages/billing/Usage"));
const BillingInvoices = lazy(() => import("@/pages/billing/Invoices"));
const BillingPayment = lazy(() => import("@/pages/billing/Payment"));
const BillingCheckout = lazy(() => import("@/pages/billing/Checkout"));
const PaymentConfirmation = lazy(
  () => import("@/pages/billing/PaymentConfirmation"),
);
const PlatformPayments = lazy(() => import("@/pages/platform/Payments"));
const PlatformDashboard = lazy(
  () => import("@/pages/platform/PlatformDashboard"),
);
const PlatformCompanyList = lazy(
  () => import("@/pages/platform/companies/CompanyList"),
);
const PlatformCompanyDetail = lazy(
  () => import("@/pages/platform/companies/CompanyDetail"),
);
const PlatformOnboardingMonitor = lazy(
  () => import("@/pages/platform/onboarding/OnboardingMonitor"),
);
const PlatformTemplates = lazy(
  () => import("@/pages/platform/onboarding/PlatformTemplates"),
);
const StaffDashboard = lazy(
  () => import("@/pages/platform/staff/StaffDashboard"),
);
const PlatformSubscriptions = lazy(
  () => import("@/pages/platform/admin/PlatformSubscriptions"),
);
const PlatformPlans = lazy(
  () => import("@/pages/platform/admin/PlatformPlans"),
);
const PlatformFeedback = lazy(
  () => import("@/pages/platform/admin/PlatformFeedback"),
);
const PlatformSystem = lazy(
  () => import("@/pages/platform/admin/PlatformSystem"),
);
const Forbidden = lazy(() => import("@/pages/Forbidden"));
const SurveySend = lazy(() => import("@/pages/surveys/SurveySendPage"));
const PageSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton active paragraph={{ rows: 1 }} title={{ width: "33%" }} />
    <Skeleton active paragraph={{ rows: 4 }} />
    <Skeleton active paragraph={{ rows: 4 }} />
  </div>
);

const suspense = (node: JSX.Element) => (
  <Suspense fallback={<PageSkeleton />}>{node}</Suspense>
);

const withRoles = (node: JSX.Element, requiredRoles?: Role[]) => {
  if (!requiredRoles || requiredRoles.length === 0) return node;
  return <RequireRoles requiredRoles={requiredRoles}>{node}</RequireRoles>;
};

const CompanyDetailRedirect = () => {
  const { companyId } = useParams<{ companyId: string }>();
  return <Navigate to={`/platform/admin/companies/${companyId}`} replace />;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <GuestRoute>{suspense(<LandingPage />)}</GuestRoute>,
  },
  {
    element: (
      <AuthLayout>
        <Outlet />
      </AuthLayout>
    ),
    children: [
      { path: "/login", element: suspense(<Login />) },
      { path: "/register-company", element: suspense(<RegisterCompany />) },
      { path: "/invite/accept", element: suspense(<InviteAccept />) },
      {
        path: "/invite/set-password",
        element: suspense(<InviteSetPassword />),
      },
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
      { path: "/dashboard", element: suspense(<DashboardRouter />) },
      {
        path: "/dashboard/hr",
        element: suspense(withRoles(<HRDashboard />, ["HR"])),
      },
      {
        path: "/dashboard/manager",
        element: suspense(withRoles(<ManagerDashboard />, ["MANAGER"])),
      },
      {
        path: "/dashboard/employee",
        element: suspense(withRoles(<EmployeeDashboard />, ["EMPLOYEE"])),
      },
      {
        path: "/hr/departments",
        element: suspense(withRoles(<AdminDepartments />, ["HR"])),
      },
      {
        path: "/hr/users",
        element: suspense(withRoles(<AdminUsers />, ["HR"])),
      },
      {
        path: "/hr/roles",
        element: suspense(withRoles(<AdminRoles />, ["HR"])),
      },
      {
        path: "/hr/knowledge-base",
        element: suspense(withRoles(<AdminKnowledgeBase />, ["HR"])),
      },
      // Legacy redirects for old /admin/* HR routes
      { path: "/admin/departments", element: <Navigate to="/hr/departments" replace /> },
      { path: "/admin/users", element: <Navigate to="/hr/users" replace /> },
      { path: "/admin/roles", element: <Navigate to="/hr/roles" replace /> },
      { path: "/admin/knowledge-base", element: <Navigate to="/hr/knowledge-base" replace /> },
      { path: "/profile", element: suspense(<Profile />) },
      { path: "/settings/notifications", element: suspense(<Notifications />) },
      {
        path: "/notifications",
        element: suspense(
          withRoles(<NotificationsPage />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      // Onboarding - flat structure
      {
        path: "/onboarding",
        element: suspense(
          withRoles(<OnboardingDashboard />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      {
        path: "/onboarding/employees",
        element: suspense(withRoles(<Employees />, ["HR", "MANAGER"])),
      },
      {
        path: "/onboarding/employees/new",
        element: suspense(withRoles(<EmployeeManagement />, ["HR"])),
      },
      {
        path: "/onboarding/employees/:employeeId",
        element: suspense(
          withRoles(<EmployeeDetail />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      {
        path: "/onboarding/templates",
        element: suspense(withRoles(<Templates />, ["HR", "MANAGER"])),
      },
      {
        path: "/onboarding/templates/new",
        element: suspense(withRoles(<TemplateEditor />, ["HR"])),
      },
      {
        path: "/onboarding/templates/:templateId",
        element: suspense(withRoles(<TemplateEditor />, ["HR"])),
      },
      {
        path: "/onboarding/tasks",
        element: suspense(
          withRoles(<OnboardingTasks />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      {
        path: "/onboarding/automation",
        element: suspense(withRoles(<OnboardingAutomation />, ["HR"])),
      },
      {
        path: "/onboarding/my-journey",
        element: suspense(withRoles(<MyJourney />, ["EMPLOYEE"])),
      },
      // Legacy redirects — old role-namespaced URLs
      {
        path: "/onboarding/hr",
        element: <Navigate to="/onboarding" replace />,
      },
      {
        path: "/onboarding/hr/employees",
        element: <Navigate to="/onboarding/employees" replace />,
      },
      {
        path: "/onboarding/hr/employees/new",
        element: <Navigate to="/onboarding/employees/new" replace />,
      },
      {
        path: "/onboarding/hr/employees/:employeeId",
        element: <Navigate to="/onboarding/employees/:employeeId" replace />,
      },
      {
        path: "/onboarding/hr/templates",
        element: <Navigate to="/onboarding/templates" replace />,
      },
      {
        path: "/onboarding/hr/templates/new",
        element: <Navigate to="/onboarding/templates/new" replace />,
      },
      {
        path: "/onboarding/hr/templates/:templateId",
        element: <Navigate to="/onboarding/templates/:templateId" replace />,
      },
      {
        path: "/onboarding/hr/tasks",
        element: <Navigate to="/onboarding/tasks" replace />,
      },
      {
        path: "/onboarding/hr/automation",
        element: <Navigate to="/onboarding/automation" replace />,
      },
      {
        path: "/onboarding/manager",
        element: <Navigate to="/onboarding" replace />,
      },
      {
        path: "/onboarding/manager/employees",
        element: <Navigate to="/onboarding/employees" replace />,
      },
      {
        path: "/onboarding/manager/employees/:employeeId",
        element: <Navigate to="/onboarding/employees/:employeeId" replace />,
      },
      {
        path: "/onboarding/manager/tasks",
        element: <Navigate to="/onboarding/tasks" replace />,
      },
      {
        path: "/onboarding/employee",
        element: <Navigate to="/onboarding/my-journey" replace />,
      },
      {
        path: "/onboarding/employee/instances/:employeeId",
        element: <Navigate to="/onboarding/employees/:employeeId" replace />,
      },
      {
        path: "/documents",
        element: suspense(
          withRoles(<Documents />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      {
        path: "/documents/acknowledgments",
        element: suspense(
          withRoles(<Acknowledgments />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      {
        path: "/documents/:documentId",
        element: suspense(
          withRoles(<DocumentDetail />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      {
        path: "/surveys/templates",
        element: suspense(withRoles(<SurveyTemplates />, ["HR"])),
      },
      {
        path: "/surveys/templates/new",
        element: suspense(withRoles(<SurveyTemplateEditor />, ["HR"])),
      },
      {
        path: "/surveys/templates/:templateId",
        element: suspense(withRoles(<SurveyTemplateEditor />, ["HR"])),
      },
      {
        path: "/surveys/inbox",
        element: suspense(
          withRoles(<SurveyInbox />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      {
        path: "/surveys/inbox/:surveyId",
        element: suspense(
          withRoles(<SurveyDetail />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      {
        path: "/surveys/reports",
        element: suspense(withRoles(<SurveyReports />, ["HR"])),
      },
      {
        path: "/chatbot",
        element: suspense(
          withRoles(<Chatbot />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      {
        path: "/billing/plan",
        element: suspense(withRoles(<BillingPlan />, ["HR"])),
      },
      {
        path: "/billing/usage",
        element: suspense(withRoles(<BillingUsage />, ["HR"])),
      },
      {
        path: "/billing/invoices",
        element: suspense(withRoles(<BillingInvoices />, ["HR"])),
      },
      {
        path: "/billing/payment",
        element: suspense(withRoles(<BillingPayment />, ["HR"])),
      },
      {
        path: "/billing/checkout/:invoiceId",
        element: suspense(withRoles(<BillingCheckout />, ["HR"])),
      },
      {
        path: "/billing/payment/confirmation",
        element: suspense(withRoles(<PaymentConfirmation />, ["HR"])),
      },
      // Platform Admin routes (/platform/admin/*)
      {
        path: "/platform/admin/dashboard",
        element: suspense(withRoles(<PlatformDashboard />, ["ADMIN"])),
      },
      {
        path: "/platform/admin/companies",
        element: suspense(withRoles(<PlatformCompanyList />, ["ADMIN"])),
      },
      {
        path: "/platform/admin/companies/:companyId",
        element: suspense(withRoles(<PlatformCompanyDetail />, ["ADMIN"])),
      },
      {
        path: "/platform/admin/subscriptions",
        element: suspense(withRoles(<PlatformSubscriptions />, ["ADMIN"])),
      },
      {
        path: "/platform/admin/plans",
        element: suspense(withRoles(<PlatformPlans />, ["ADMIN"])),
      },
      {
        path: "/platform/admin/onboarding",
        element: suspense(withRoles(<PlatformOnboardingMonitor />, ["ADMIN"])),
      },
      {
        path: "/platform/admin/templates",
        element: suspense(withRoles(<PlatformTemplates />, ["ADMIN"])),
      },
      {
        path: "/platform/admin/feedback",
        element: suspense(withRoles(<PlatformFeedback />, ["ADMIN"])),
      },
      {
        path: "/platform/admin/system",
        element: suspense(withRoles(<PlatformSystem />, ["ADMIN"])),
      },
      // Platform Staff routes (/platform/staff/*)
      {
        path: "/platform/staff/dashboard",
        element: suspense(withRoles(<StaffDashboard />, ["STAFF"])),
      },
      {
        path: "/platform/staff/payments",
        element: suspense(withRoles(<PlatformPayments />, ["STAFF"])),
      },
      {
        path: "/platform/staff/onboarding",
        element: suspense(withRoles(<PlatformOnboardingMonitor />, ["STAFF"])),
      },
      // Legacy platform route redirects
      {
        path: "/platform/payments",
        element: <Navigate to="/platform/staff/payments" replace />,
      },
      {
        path: "/platform/dashboard",
        element: <Navigate to="/platform/admin/dashboard" replace />,
      },
      {
        path: "/platform/companies",
        element: <Navigate to="/platform/admin/companies" replace />,
      },
      {
        path: "/platform/companies/:companyId",
        element: <CompanyDetailRedirect />,
      },
      {
        path: "/platform/onboarding-monitor",
        element: <Navigate to="/platform/admin/onboarding" replace />,
      },
      {
        path: "/platform/onboarding-templates",
        element: <Navigate to="/platform/admin/templates" replace />,
      },
      { path: "/403", element: suspense(<Forbidden />) },
      {
        path: "/surveys/send",
        element: suspense(withRoles(<SurveySend />, ["HR"])),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

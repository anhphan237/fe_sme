import { Suspense, lazy } from "react";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import { Skeleton } from "antd";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import { GuestRoute, RequireAuth, RequireRoles } from "./route-guard";
import type { Role } from "@/shared/types";

const LandingPage = lazy(() => import("@/pages/landing/LandingPage"));
const Login = lazy(() => import("@/pages/auth/Login"));
const RegisterCompany = lazy(() => import("@/pages/auth/RegisterCompany"));
const InviteAccept = lazy(() => import("@/pages/auth/InviteAccept"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const AdminUsers = lazy(() => import("@/pages/users"));
const AdminRoles = lazy(() => import("@/pages/roles"));
const AdminKnowledgeBase = lazy(() => import("@/pages/knowledge-base"));
const AdminDepartments = lazy(() => import("@/pages/departments"));
const Profile = lazy(() => import("@/pages/profile/Profile"));
const Notifications = lazy(() => import("@/pages/settings/Notifications"));
const OnboardingRoleHome = lazy(() => import("@/pages/onboarding/role-home"));
const OnboardingEmployeeHome = lazy(
  () => import("@/pages/onboarding/role-home/EmployeeHome"),
);
const OnboardingManagerHome = lazy(
  () => import("@/pages/onboarding/role-home/ManagerHome"),
);
const OnboardingHrHome = lazy(
  () => import("@/pages/onboarding/role-home/HrHome"),
);
const Templates = lazy(() => import("@/pages/onboarding/templates"));
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
const Forbidden = lazy(() => import("@/pages/Forbidden"));

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
      { path: "/dashboard", element: suspense(<Dashboard />) },
      {
        path: "/admin/departments",
        element: suspense(withRoles(<AdminDepartments />, ["HR"])),
      },
      {
        path: "/admin/users",
        element: suspense(withRoles(<AdminUsers />, ["HR"])),
      },
      {
        path: "/admin/roles",
        element: suspense(withRoles(<AdminRoles />, ["HR"])),
      },
      {
        path: "/admin/knowledge-base",
        element: suspense(withRoles(<AdminKnowledgeBase />, ["HR"])),
      },
      { path: "/profile", element: suspense(<Profile />) },
      { path: "/settings/notifications", element: suspense(<Notifications />) },
      // Onboarding entry point - redirects by role
      {
        path: "/onboarding",
        element: suspense(
          withRoles(<OnboardingRoleHome />, ["HR", "MANAGER", "EMPLOYEE"]),
        ),
      },
      // HR namespace
      {
        path: "/onboarding/hr",
        element: suspense(withRoles(<OnboardingHrHome />, ["HR"])),
      },
      {
        path: "/onboarding/hr/employees",
        element: suspense(withRoles(<Employees />, ["HR"])),
      },
      {
        path: "/onboarding/hr/employees/new",
        element: suspense(withRoles(<EmployeeManagement />, ["HR"])),
      },
      {
        path: "/onboarding/hr/employees/:employeeId",
        element: suspense(withRoles(<EmployeeDetail />, ["HR"])),
      },
      {
        path: "/onboarding/hr/templates",
        element: suspense(withRoles(<Templates />, ["HR"])),
      },
      {
        path: "/onboarding/hr/templates/new",
        element: suspense(withRoles(<TemplateEditor />, ["HR"])),
      },
      {
        path: "/onboarding/hr/templates/:templateId",
        element: suspense(withRoles(<TemplateEditor />, ["HR"])),
      },
      {
        path: "/onboarding/hr/tasks",
        element: suspense(withRoles(<OnboardingTasks />, ["HR"])),
      },
      {
        path: "/onboarding/hr/automation",
        element: suspense(withRoles(<OnboardingAutomation />, ["HR"])),
      },
      // Manager namespace
      {
        path: "/onboarding/manager",
        element: suspense(withRoles(<OnboardingManagerHome />, ["MANAGER"])),
      },
      {
        path: "/onboarding/manager/employees",
        element: suspense(withRoles(<Employees />, ["MANAGER"])),
      },
      {
        path: "/onboarding/manager/employees/:employeeId",
        element: suspense(withRoles(<EmployeeDetail />, ["MANAGER"])),
      },
      {
        path: "/onboarding/manager/tasks",
        element: suspense(withRoles(<OnboardingTasks />, ["MANAGER"])),
      },
      // Employee namespace
      {
        path: "/onboarding/employee",
        element: suspense(withRoles(<OnboardingEmployeeHome />, ["EMPLOYEE"])),
      },
      {
        path: "/onboarding/employee/instances/:employeeId",
        element: suspense(withRoles(<EmployeeDetail />, ["EMPLOYEE"])),
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
      {
        path: "/platform/payments",
        element: suspense(withRoles(<PlatformPayments />, ["STAFF"])),
      },
      { path: "/403", element: suspense(<Forbidden />) },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

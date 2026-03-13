import { useQuery } from "@tanstack/react-query";
import { Card, Progress, Skeleton, Tag } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useUserStore } from "@/stores/user.store";
import { getPrimaryRole, isPlatformRole } from "@/shared/rbac";
import { apiListInstances } from "@/api/onboarding/onboarding.api";
import { apiGetDocuments } from "@/api/document/document.api";
import { extractList } from "@/api/core/types";
import { mapInstance } from "@/utils/mappers/onboarding";
import type { OnboardingInstance } from "@/shared/types";
import type { Role } from "@/shared/types";

// ---- Query hooks ----

function useInstancesQuery(
  filters?: { employeeId?: string; status?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "instances",
      filters?.employeeId ?? "",
      filters?.status ?? "ACTIVE",
    ],
    queryFn: () =>
      apiListInstances({
        employeeId: filters?.employeeId,
        status: filters?.status ?? "ACTIVE",
      }),
    enabled,
    select: (res: any) =>
      extractList(res, "instances", "items", "list").map(
        mapInstance,
      ) as OnboardingInstance[],
  });
}

function useDocumentsQuery() {
  return useQuery({ queryKey: ["documents"], queryFn: apiGetDocuments });
}

// ---- Sub-components ----

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="small">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-ink">
        {value}
      </p>
    </Card>
  );
}

function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton.Input key={i} active block size="small" />
      ))}
    </div>
  );
}

const kpiMap: Record<Role, { label: string; value: string }[]> = {
  HR: [
    { label: "Active onboardings", value: "12" },
    { label: "Tasks due this week", value: "9" },
    { label: "Survey completion %", value: "82%" },
    { label: "Billing status", value: "Healthy" },
  ],
  IT: [
    { label: "Org setup tasks", value: "6" },
    { label: "Active users", value: "28" },
    { label: "Open invitations", value: "3" },
    { label: "Systems configured", value: "12" },
  ],
  MANAGER: [
    { label: "Team onboardings", value: "4" },
    { label: "Tasks assigned", value: "6" },
    { label: "Pending surveys", value: "2" },
    { label: "Docs to review", value: "3" },
  ],
  EMPLOYEE: [
    { label: "Checklist progress %", value: "64%" },
    { label: "Required docs pending", value: "1" },
    { label: "Surveys due", value: "1" },
    { label: "Messages from HR", value: "2" },
  ],
  ADMIN: [
    { label: "Active tenants", value: "34" },
    { label: "Plans managed", value: "4" },
    { label: "Open invoices", value: "18" },
    { label: "Dunning cases", value: "3" },
  ],
  STAFF: [
    { label: "Invoices to review", value: "8" },
    { label: "Payments failed", value: "4" },
    { label: "Email failures", value: "2" },
    { label: "Tickets handled", value: "11" },
  ],
};

const progressData = [
  { stage: "Welcome", value: 6 },
  { stage: "Systems", value: 4 },
  { stage: "Role setup", value: 3 },
  { stage: "First month", value: 2 },
];

const UPCOMING_TASKS = [
  "Finalize welcome kit for Linh Do",
  "Manager check-in: Minh Pham",
  "Survey send: Day 7 check-in",
  "Docs review reminder",
  "Update onboarding template",
];

const Dashboard = () => {
  const currentUser = useUserStore((s) => s.currentUser);
  const isPlatformUser = isPlatformRole(currentUser?.roles ?? []);

  const {
    isLoading: instancesLoading,
    isError,
    refetch,
  } = useInstancesQuery(undefined, !isPlatformUser);
  const { data: documentsRaw, isLoading: docsLoading } = useDocumentsQuery();

  const documents: any[] = documentsRaw
    ? Array.isArray(documentsRaw)
      ? documentsRaw
      : ((documentsRaw as any).items ?? [])
    : [];

  const primaryRole = getPrimaryRole(currentUser?.roles ?? ["EMPLOYEE"]);
  const kpis = kpiMap[primaryRole] ?? kpiMap["HR"];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-balance text-2xl font-semibold text-ink">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">
          Role-based insights across onboarding progress and employee health.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-balance text-base font-semibold">
                Onboarding Progress
              </h2>
              <p className="text-sm text-muted">Stages by volume</p>
            </div>
            <Tag>Last 30 days</Tag>
          </div>
          <div className="mt-6 h-64">
            {instancesLoading ? (
              <Skeleton active paragraph={{ rows: 5 }} title={false} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Upcoming Tasks</h2>
          <p className="text-sm text-muted">Next 24 hours</p>
          {instancesLoading ? (
            <SkeletonRows />
          ) : (
            <ul className="mt-4 space-y-3 text-sm" aria-label="Upcoming tasks">
              {UPCOMING_TASKS.map((task) => (
                <li
                  key={task}
                  className="rounded-2xl border border-stroke bg-slate-50 p-3">
                  {task}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-balance text-base font-semibold">
            Documents Requiring Acknowledgment
          </h2>
          <p className="text-sm text-muted">This week</p>
          {docsLoading ? (
            <SkeletonRows />
          ) : documents.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No documents pending.</p>
          ) : (
            <ul
              className="mt-4 space-y-3 text-sm"
              aria-label="Documents pending acknowledgment">
              {documents.slice(0, 4).map((doc) => (
                <li
                  key={doc.documentId}
                  className="flex min-w-0 items-center justify-between rounded-2xl border border-stroke bg-slate-50 p-3">
                  <span className="truncate">{doc.name}</span>
                  <Tag color={doc.required ? "red" : "default"}>
                    {doc.required ? "Required" : "Optional"}
                  </Tag>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <p className="text-sm text-muted">Timeline</p>
          {isError ? (
            <div
              role="alert"
              aria-live="polite"
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm">
              Something went wrong.{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => refetch()}>
                Retry
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-2xl border border-stroke bg-slate-50 p-3">
                <p className="font-semibold">Survey Submitted</p>
                <p className="text-muted">Linh Do completed day 7 survey.</p>
              </div>
              <div className="rounded-2xl border border-stroke bg-slate-50 p-3">
                <p className="font-semibold">Document Acknowledged</p>
                <p className="text-muted">Employee Handbook signed.</p>
              </div>
              <div className="rounded-2xl border border-stroke bg-slate-50 p-3">
                <p className="font-semibold">Checklist Progress</p>
                <Progress percent={64} size="small" />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

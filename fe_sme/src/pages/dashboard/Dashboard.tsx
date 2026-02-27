import { Card } from "../../components/ui/Card";
import { PageHeader } from "../../components/common/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Progress } from "../../components/ui/Progress";
import { Skeleton } from "../../components/ui/Skeleton";
import { useQuery } from "@tanstack/react-query";
import { apiListInstances } from "@/api/onboarding/onboarding.api";
import { apiGetDocuments } from "@/api/document/document.api";
import { extractList } from "@/api/core/types";
import { mapInstance } from "@/utils/mappers/onboarding";
import type { OnboardingInstance } from "@/shared/types";

const useInstancesQuery = (
  filters?: { employeeId?: string; status?: string },
  enabled = true,
) =>
  useQuery({
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
const useDocumentsQuery = () =>
  useQuery({ queryKey: ["documents"], queryFn: apiGetDocuments });
import { useAppStore } from "../../store/useAppStore";
import { getPrimaryRole, isPlatformRole } from "../../shared/rbac";
import type { Role } from "../../shared/types";
import {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

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

function Dashboard() {
  const currentUser = useAppStore((state) => state.currentUser);
  const isPlatformUser = isPlatformRole(currentUser?.roles ?? []);
  const { isLoading: instancesLoading, isError } =
    useInstancesQuery(!isPlatformUser);
  const { data: documents, isLoading: docsLoading } =
    useDocumentsQuery(!isPlatformUser);

  const primaryRole = getPrimaryRole(currentUser?.roles ?? ["EMPLOYEE"]);
  const kpis = kpiMap[primaryRole];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Role-based insights across onboarding progress and employee health."
        actionLabel="Create action"
        onAction={() => {}}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <p className="text-sm text-muted">{kpi.label}</p>
            <p className="mt-3 text-2xl font-semibold text-ink">{kpi.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Onboarding Progress</h3>
              <p className="text-sm text-muted">Stages by volume</p>
            </div>
            <Badge>Last 30 days</Badge>
          </div>
          <div className="mt-6 h-64">
            {instancesLoading ? (
              <Skeleton className="h-full" />
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
          <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
          <p className="text-sm text-muted">Next 24 hours</p>
          {instancesLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              <li className="rounded-2xl border border-stroke bg-slate-50 p-3">
                Finalize welcome kit for Linh Do
              </li>
              <li className="rounded-2xl border border-stroke bg-slate-50 p-3">
                Manager check-in: Minh Pham
              </li>
              <li className="rounded-2xl border border-stroke bg-slate-50 p-3">
                Survey send: Day 7 check-in
              </li>
              <li className="rounded-2xl border border-stroke bg-slate-50 p-3">
                Docs review reminder
              </li>
              <li className="rounded-2xl border border-stroke bg-slate-50 p-3">
                Update onboarding template
              </li>
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold">
            Documents Requiring Acknowledgment
          </h3>
          <p className="text-sm text-muted">This week</p>
          {docsLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
              <Skeleton className="h-6" />
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {documents?.slice(0, 4).map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-2xl border border-stroke bg-slate-50 p-3">
                  <span>{doc.title}</span>
                  <Badge>{doc.required ? "Required" : "Optional"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <p className="text-sm text-muted">Timeline</p>
          {isError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm">
              Something went wrong.{" "}
              <button className="font-semibold">Retry</button>
            </div>
          ) : (
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-2xl border border-stroke bg-slate-50 p-3">
                <p className="font-semibold">Survey submitted</p>
                <p className="text-muted">Linh Do completed day 7 survey.</p>
              </div>
              <div className="rounded-2xl border border-stroke bg-slate-50 p-3">
                <p className="font-semibold">Document acknowledged</p>
                <p className="text-muted">Employee Handbook signed.</p>
              </div>
              <div className="rounded-2xl border border-stroke bg-slate-50 p-3">
                <p className="font-semibold">Checklist progress</p>
                <Progress value={64} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;

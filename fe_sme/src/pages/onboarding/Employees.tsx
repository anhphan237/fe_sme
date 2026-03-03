import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  apiListInstances,
  apiCreateInstance,
  apiListTemplates,
  apiActivateInstance,
} from "@/api/onboarding/onboarding.api";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapInstance, mapTemplate } from "@/utils/mappers/onboarding";
import { mapUser } from "@/utils/mappers/identity";
import type {
  OnboardingInstance,
  OnboardingTemplate,
  User,
} from "@/shared/types";
import { useToast } from "../../components/ui/Toast";

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
const useStartInstance = () => useMutation({ mutationFn: apiCreateInstance });
const useTemplatesQuery = () =>
  useQuery({
    queryKey: ["templates"],
    queryFn: () => apiListTemplates(),
    select: (res: any) =>
      extractList(res, "templates", "items", "list").map(
        mapTemplate,
      ) as OnboardingTemplate[],
  });
const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: any) =>
      extractList(res, "users", "items").map(mapUser) as User[],
  });
import { ROLE_LABELS, getPrimaryRole } from "../../shared/rbac";
import { useAppStore } from "../../store/useAppStore";

function Employees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const currentUser = useAppStore((state) => state.currentUser);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
  const [form, setForm] = useState({
    employeeId: "",
    templateId: "",
    startDate: "",
  });
  const instanceFilters = { status: statusFilter };
  const {
    data: instances,
    isLoading,
    isError,
    error,
    refetch,
  } = useInstancesQuery(instanceFilters);
  const { data: users } = useUsersQuery();
  const { data: templates } = useTemplatesQuery();
  const startInstance = useStartInstance();
  const canStart = Boolean(currentUser?.roles.includes("HR"));

  const handleStart = async () => {
    const instance = await startInstance.mutateAsync({
      employeeId: form.employeeId,
      templateId: form.templateId,
      startDate: form.startDate,
      progress: 0,
    });
    try {
      await apiActivateInstance(instance.id, (instance as any).requestNo);
    } catch (e) {
      toast(
        e instanceof Error
          ? e.message
          : "Onboarding created but activate failed.",
      );
    }
    queryClient.invalidateQueries({ queryKey: ["instances"] });
    toast("Onboarding started.");
    setOpen(false);
    navigate(`/onboarding/employees/${instance.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding Employee"
        subtitle="Track onboarding status across teams."
        actionLabel={canStart ? "Start Onboarding" : undefined}
        onAction={canStart ? () => setOpen(true) : undefined}
        extra={
          canStart ? (
            <Button
              variant="secondary"
              onClick={() => navigate("/onboarding/employees/new")}>
              Employees
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            placeholder="Search employee"
            className="rounded-2xl border border-stroke px-4 py-2 text-sm"
          />
          <select
            className="rounded-2xl border border-stroke px-4 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Paused</option>
          </select>
          <input
            type="date"
            className="rounded-2xl border border-stroke px-4 py-2 text-sm"
          />
        </div>
      </Card>

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm">
            {error != null && typeof (error as Error).message === "string"
              ? (error as Error).message
              : "Something went wrong."}{" "}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : instances && instances.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No onboarding instances"
              description="Start a new onboarding to track employees."
              actionLabel="Start Onboarding"
              onAction={() => setOpen(true)}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Start date</th>
                <th className="px-4 py-3">Progress %</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances?.map((instance) => {
                const employee = users?.find(
                  (user) =>
                    user.id === instance.employeeUserId ||
                    user.id === instance.employeeId ||
                    user.employeeId === instance.employeeId,
                );
                const isCurrentEmployeeRow = Boolean(
                  currentUser &&
                  (instance.employeeUserId === currentUser.id ||
                    instance.employeeId === currentUser.id),
                );
                const employeeName =
                  employee?.name ??
                  (isCurrentEmployeeRow ? currentUser?.name : null) ??
                  "-";
                const employeeRole =
                  employee?.roles ??
                  (isCurrentEmployeeRow ? currentUser?.roles : undefined);
                return (
                  <tr
                    key={instance.id}
                    className="border-t border-stroke hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{employeeName}</td>
                    <td className="px-4 py-3 text-muted">
                      {employeeRole
                        ? ROLE_LABELS[getPrimaryRole(employeeRole)]
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {instance.startDate}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {instance.progress}%
                    </td>
                    <td className="px-4 py-3 text-muted">{instance.status}</td>
                    <td className="px-4 py-3 text-muted">
                      {employee?.manager || instance.managerName || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          navigate(`/onboarding/employees/${instance.id}`)
                        }>
                        Open
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={open}
        title="Start onboarding"
        onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm">
            Select employee
            <select
              className="rounded-2xl border border-stroke px-4 py-2"
              value={form.employeeId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, employeeId: event.target.value }))
              }>
              <option value="">Select</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Pick template
            <select
              className="rounded-2xl border border-stroke px-4 py-2"
              value={form.templateId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, templateId: event.target.value }))
              }>
              <option value="">Select</option>
              {templates?.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Confirm start date
            <input
              type="date"
              className="rounded-2xl border border-stroke px-4 py-2"
              value={form.startDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, startDate: event.target.value }))
              }
            />
          </label>
          <Button onClick={handleStart}>Create onboarding</Button>
        </div>
      </Modal>
    </div>
  );
}

export default Employees;

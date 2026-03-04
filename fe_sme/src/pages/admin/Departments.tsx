import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import { apiSearchUsers } from "@/api/identity/identity.api";
import {
  apiListDepartments,
  apiCreateDepartment,
  apiUpdateDepartment,
} from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import { mapUser } from "@/utils/mappers/identity";
import { useLocale } from "@/i18n";
import { useAppStore } from "../../store/useAppStore";
import {
  DepartmentFormModal,
  type DepartmentModalMode,
} from "./components/DepartmentFormModal";
import type { User } from "@/shared/types";
import type { DepartmentItem } from "@/interface/company";
import type { UserListItem } from "@/interface/identity";

const DEPARTMENT_TYPES = [
  { value: "IT", label: "IT" },
  { value: "HR", label: "HR" },
  { value: "FCT", label: "Finance" },
  { value: "OPS", label: "Operations" },
  { value: "SLS", label: "Sales" },
  { value: "MKT", label: "Marketing" },
  { value: "GEN", label: "General" },
  { value: "OTHER", label: "Other" },
] as const;

const TYPE_STYLES: Record<string, string> = {
  IT: "bg-blue-50 text-blue-700",
  HR: "bg-purple-50 text-purple-700",
  FCT: "bg-emerald-50 text-emerald-700",
  OPS: "bg-amber-50 text-amber-700",
  SLS: "bg-rose-50 text-rose-700",
  MKT: "bg-pink-50 text-pink-700",
  GEN: "bg-slate-100 text-slate-600",
  OTHER: "bg-gray-100 text-gray-600",
};

function getTypeLabel(value: string | null): string {
  if (!value) return "Other";
  return DEPARTMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function getTypeStyle(value: string | null): string {
  return TYPE_STYLES[value ?? "OTHER"] ?? TYPE_STYLES.OTHER;
}

const useDepartmentsQuery = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    select: (res: unknown) => extractList<DepartmentItem>(res, "items"),
  });

const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: unknown) =>
      extractList<UserListItem>(res, "users", "items").map(mapUser) as User[],
  });

function Departments() {
  const [modalMode, setModalMode] = useState<DepartmentModalMode>(null);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

  const { t } = useLocale();
  const currentTenant = useAppStore((s) => s.currentTenant);
  const currentUser = useAppStore((s) => s.currentUser);
  const toast = useToast();

  const {
    data: departments,
    isLoading,
    isError,
    refetch,
  } = useDepartmentsQuery();
  const { data: users } = useUsersQuery();

  const resolveManagerName = useCallback(
    (userId: string | null) => {
      if (!userId) return null;
      const u = users?.find((u) => u.id === userId);
      return u ? u.name || u.email : null;
    },
    [users],
  );

  const openCreate = () => {
    setEditingDept(null);
    setModalMode("create");
  };

  const openEdit = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingDept(null);
  };

  const handleModalSubmit = async (
    mode: "create" | "edit",
    form: { name: string; type: string; managerUserId: string },
    departmentId: string | null,
  ) => {
    if (mode === "create") {
      const companyId = currentTenant?.id ?? currentUser?.companyId ?? "";
      if (!companyId) throw new Error(t("department.error.no_company"));
      await apiCreateDepartment({
        companyId,
        name: form.name,
        type: form.type,
        managerId: form.managerUserId || undefined,
      });
      toast(t("department.create_success"));
    } else if (mode === "edit" && departmentId) {
      await apiUpdateDepartment({
        departmentId,
        name: form.name,
        type: form.type,
        managerUserId: form.managerUserId || undefined,
      });
      toast(t("department.update_success"));
    }
    await refetch();
    closeModal();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("department.title")}
        subtitle={t("department.subtitle")}
        actionLabel={t("department.new")}
        onAction={openCreate}
        extra={
          <span className="hidden items-center gap-1.5 text-sm text-slate-500 sm:flex">
            <Building2 className="h-4 w-4" />
            {departments?.length ?? 0} {t("department.total")}
          </span>
        }
      />

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-sm text-slate-500">
              {t("department.error.load_failed")}
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              {t("department.retry")}
            </Button>
          </div>
        ) : !departments || departments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={t("department.empty_title")}
              description={t("department.empty_description")}
            />
          </div>
        ) : (
          <Table>
            <thead className="bg-slate-50/80 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">{t("department.column.name")}</th>
                <th className="px-5 py-3.5">{t("department.column.type")}</th>
                <th className="px-5 py-3.5">
                  {t("department.column.manager")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => {
                const manager = resolveManagerName(dept.managerUserId);
                return (
                  <tr
                    key={dept.departmentId}
                    className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => openEdit(dept)}
                            className="text-left font-medium text-slate-900 hover:text-indigo-600 hover:underline transition-colors">
                            {dept.name}
                          </button>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {dept.departmentId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        className={clsx("text-xs", getTypeStyle(dept.type))}>
                        {getTypeLabel(dept.type)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {manager ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                            {(manager[0] ?? "?").toUpperCase()}
                          </div>
                          <span className="text-sm text-slate-700">
                            {manager}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          {t("department.not_assigned")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <DepartmentFormModal
        mode={modalMode}
        department={editingDept}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}

export default Departments;

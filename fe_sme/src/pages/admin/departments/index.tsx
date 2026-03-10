import { useState } from "react";
import { Building2 } from "lucide-react";
import { clsx } from "clsx";
import { PageHeader } from "../../../components/common/PageHeader";
import { Card } from "../../../components/ui/Card";
import MyTable from "@/components/table";
import type { ColumnsType } from "antd/es/table";
import { Button } from "../../../components/ui/Button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Badge } from "../../../components/ui/Badge";
import { useToast } from "../../../components/ui/Toast";
import {
  apiCreateDepartment,
  apiUpdateDepartment,
} from "@/api/company/company.api";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { getDeptTypeLabel, getDeptTypeStyle } from "../shared";
import { useUsersQuery, useDepartmentsQuery } from "../hooks";
import {
  DepartmentFormModal,
  type DepartmentModalMode,
} from "./components/DepartmentFormModal";
import type { DepartmentItem } from "@/interface/company";

function Departments() {
  const [modalMode, setModalMode] = useState<DepartmentModalMode>(null);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

  const { t } = useLocale();
  const currentTenant = useUserStore((s) => s.currentTenant);
  const currentUser = useUserStore((s) => s.currentUser);
  const toast = useToast();

  const {
    data: departments,
    isLoading,
    isError,
    refetch,
  } = useDepartmentsQuery();
  const { data: users } = useUsersQuery();

  const resolveManagerName = (userId: string | null) => {
    if (!userId) return null;
    const u = users?.find((u) => u.id === userId);
    return u ? u.name || u.email : null;
  };

  const columns: ColumnsType<DepartmentItem> = [
    {
      title: t("department.column.name"),
      key: "name",
      render: (_: unknown, dept: DepartmentItem) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <button
              type="button"
              onClick={() => {
                setEditingDept(dept);
                setModalMode("edit");
              }}
              className="text-left font-medium text-slate-900 transition-colors hover:text-indigo-600 hover:underline">
              {dept.name}
            </button>
            <p className="mt-0.5 text-xs text-slate-400">{dept.departmentId}</p>
          </div>
        </div>
      ),
    },
    {
      title: t("department.column.type"),
      key: "type",
      render: (_: unknown, dept: DepartmentItem) => (
        <Badge className={clsx("text-xs", getDeptTypeStyle(dept.type))}>
          {getDeptTypeLabel(dept.type)}
        </Badge>
      ),
    },
    {
      title: t("department.column.manager"),
      key: "manager",
      render: (_: unknown, dept: DepartmentItem) => {
        const manager = resolveManagerName(dept.managerUserId);
        return manager ? (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
              {(manager[0] ?? "?").toUpperCase()}
            </div>
            <span className="text-sm text-slate-700">{manager}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">
            {t("department.not_assigned")}
          </span>
        );
      },
    },
  ];

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
        onAction={() => {
          setEditingDept(null);
          setModalMode("create");
        }}
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
          <MyTable
            columns={columns}
            dataSource={departments ?? []}
            rowKey="departmentId"
            pagination={false}
          />
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

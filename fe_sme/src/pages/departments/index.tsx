import { useState } from "react";
import { AlertCircle, Building2, Plus } from "lucide-react";
import { clsx } from "clsx";
import { Empty, Tag } from "antd";
import { notify } from "@/utils/notify";
import MyTable from "@/components/table";
import type { ColumnsType } from "antd/es/table";
import BaseButton from "@/components/button";
import BaseSearch from "@/components/search";
import {
  apiCreateDepartment,
  apiUpdateDepartment,
} from "@/api/company/company.api";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { getDeptTypeLabel, getDeptTypeStyle } from "./constants";
import { useUsersQuery, useDepartmentsQuery } from "@/hooks/adminHooks";
import {
  DepartmentFormModal,
  type DepartmentModalMode,
} from "./components/DepartmentFormModal";
import type { DepartmentItem } from "@/interface/company";

const Departments = () => {
  const [modalMode, setModalMode] = useState<DepartmentModalMode>(null);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [search, setSearch] = useState("");

  const { t } = useLocale();
  const currentTenant = useUserStore((s) => s.currentTenant);
  const currentUser = useUserStore((s) => s.currentUser);

  const {
    data: departments,
    isLoading,
    isError,
    refetch,
  } = useDepartmentsQuery();
  const { data: users = [] } = useUsersQuery();

  const resolveManagerName = (userId: string | null) => {
    if (!userId) return null;
    const u = users.find((u) => u.id === userId);
    return u ? u.name || u.email : null;
  };

  const q = search.trim().toLowerCase();
  const filtered = !departments
    ? []
    : !q
      ? departments
      : departments.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            (d.departmentId ?? "").toLowerCase().includes(q) ||
            getDeptTypeLabel(d.type).toLowerCase().includes(q),
        );

  const emptyLocale = isError ? (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <AlertCircle aria-hidden="true" className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm font-medium text-slate-700">
        {t("department.error.load_failed")}
      </p>
      <BaseButton onClick={() => refetch()} label="department.retry" />
    </div>
  ) : (
    <Empty
      description={
        <div className="mt-2 space-y-1">
          <p className="text-sm font-medium text-slate-700">
            {t("department.empty_title")}
          </p>
          <p className="text-xs text-slate-400">
            {t("department.empty_description")}
          </p>
        </div>
      }
    />
  );

  const columns: ColumnsType<DepartmentItem> = [
    {
      title: t("department.column.name"),
      key: "name",
      render: (_: unknown, dept: DepartmentItem) => (
        <div className="flex min-w-0 items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3684DB]/10 text-[#3684DB]">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => {
                setEditingDept(dept);
                setModalMode("edit");
              }}
              className="max-w-full truncate text-left font-medium text-[#223A59] transition-colors hover:text-[#3684DB] hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3684DB]">
              {dept.name}
            </button>
            <p className="mt-0.5 truncate text-xs text-[#758BA5]">
              {dept.departmentId}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: t("department.column.type"),
      key: "type",
      width: 140,
      render: (_: unknown, dept: DepartmentItem) => (
        <Tag className={clsx("text-xs", getDeptTypeStyle(dept.type))}>
          {getDeptTypeLabel(dept.type)}
        </Tag>
      ),
    },
    {
      title: t("department.column.manager"),
      key: "manager",
      render: (_: unknown, dept: DepartmentItem) => {
        const manager = resolveManagerName(dept.managerUserId);
        return manager ? (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3684DB]/10 text-xs font-medium text-[#3684DB]">
              {(manager[0] ?? "?").toUpperCase()}
            </div>
            <span className="text-sm text-[#223A59]">{manager}</span>
          </div>
        ) : (
          <span className="text-sm text-[#758BA5]">
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
      notify.success(t("department.create_success"));
    } else if (mode === "edit" && departmentId) {
      await apiUpdateDepartment({
        departmentId,
        name: form.name,
        type: form.type,
        managerUserId: form.managerUserId || undefined,
      });
      notify.success(t("department.update_success"));
    }
    await refetch();
    closeModal();
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <BaseButton
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingDept(null);
            setModalMode("create");
          }}
          label="department.new"
        />
        <div className="flex items-center gap-2">
          <BaseSearch
            placeholder={t("department.search_placeholder")}
            allowClear
            className="w-72"
            onSearch={(val) => setSearch(val ?? "")}
          />
        </div>
      </div>
      <MyTable
        columns={columns}
        dataSource={isError ? [] : filtered}
        rowKey="departmentId"
        wrapClassName="!h-full w-full"
        loading={isLoading}
        pagination={{}}
        locale={{ emptyText: emptyLocale }}
      />

      <DepartmentFormModal
        mode={modalMode}
        department={editingDept}
        users={users}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default Departments;

import { useMemo, useState } from "react";
import { AlertCircle, Building2, Pencil, Plus, Users } from "lucide-react";
import { clsx } from "clsx";
import { Empty, Skeleton, Tag } from "antd";
import { notify } from "@/utils/notify";
import BaseButton from "@/components/button";
import BaseSearch from "@/components/search";
import {
  apiCreateDepartment,
  apiUpdateOrgDepartment,
} from "@/api/company/company.api";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { getDeptTypeLabel, getDeptTypeStyle } from "./constants";
import { useUsersQuery, useDepartmentsQuery } from "@/hooks/adminHooks";
import {
  DepartmentFormDrawer,
  type DepartmentDrawerMode,
} from "./components/DepartmentFormDrawer";
import { UserStatusTag } from "@core/components/Status/StatusTag";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { ROLE_BADGE_STYLES } from "../users/constants";
import type { DepartmentItem } from "@/interface/company";

const Departments = () => {
  const [modalMode, setModalMode] = useState<DepartmentDrawerMode>(null);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  // member count per department, computed from users list
  const memberCountByDept = useMemo(
    () =>
      users.reduce<Record<string, number>>((acc, u) => {
        if (u.departmentId) {
          acc[u.departmentId] = (acc[u.departmentId] ?? 0) + 1;
        }
        return acc;
      }, {}),
    [users],
  );

  const q = search.trim().toLowerCase();
  const filtered = !departments
    ? []
    : departments.filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          getDeptTypeLabel(d.type).toLowerCase().includes(q),
      );

  const selected =
    departments?.find((d) => d.departmentId === selectedId) ?? null;
  const deptUsers = users.filter((u) => u.departmentId === selectedId);

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
      await apiUpdateOrgDepartment({
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
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="flex shrink-0 items-center justify-between border-b border-stroke bg-white px-6 py-4">
        <h1 className="text-base font-semibold text-[#223A59]">
          {t("department.title")}
        </h1>
        <BaseButton
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingDept(null);
            setModalMode("create");
          }}
          label="department.new"
        />
      </div>

      {/* Split pane body */}
      <div className="flex min-h-0 flex-1">
        {/* ── Left: dept list ── */}
        <div className="flex w-72 shrink-0 flex-col border-r border-stroke bg-white">
          <div className="shrink-0 p-3">
            <BaseSearch
              placeholder={t("department.search_placeholder")}
              allowClear
              className="w-full"
              onSearch={(val) => setSearch(val ?? "")}
            />
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-lg px-3 py-2">
                  <Skeleton active paragraph={{ rows: 1 }} />
                </div>
              ))
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <p className="text-sm text-slate-500">
                  {t("department.error.load_failed")}
                </p>
                <BaseButton
                  size="small"
                  onClick={() => refetch()}
                  label="department.retry"
                />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#758BA5]">
                {t("department.empty_title")}
              </p>
            ) : (
              filtered.map((dept) => {
                const count = memberCountByDept[dept.departmentId] ?? 0;
                const manager = resolveManagerName(dept.managerUserId);
                const isSelected = dept.departmentId === selectedId;

                return (
                  <button
                    key={dept.departmentId}
                    type="button"
                    onClick={() => setSelectedId(dept.departmentId)}
                    className={clsx(
                      "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                      isSelected
                        ? "bg-[#3684DB]/10 ring-1 ring-[#3684DB]/20"
                        : "hover:bg-slate-50",
                    )}>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={clsx(
                          "truncate text-sm font-medium",
                          isSelected ? "text-[#3684DB]" : "text-[#223A59]",
                        )}>
                        {dept.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-[#758BA5]">
                        <Users className="h-3 w-3" />
                        {count}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Tag
                        className={clsx(
                          "!py-0 !text-[10px]",
                          getDeptTypeStyle(dept.type),
                        )}>
                        {getDeptTypeLabel(dept.type)}
                      </Tag>
                      <span className="truncate text-[11px] text-[#758BA5]">
                        {manager ?? t("department.not_assigned")}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: dept detail ── */}
        <div className="flex min-w-0 flex-1 flex-col bg-slate-50/40">
          {!selected ? (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[#758BA5]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm">{t("department.select_hint")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 overflow-y-auto p-6">
              {/* Dept header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3684DB]/10 text-[#3684DB]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#223A59]">
                      {selected.name}
                    </h2>
                    <div className="mt-1 flex items-center gap-2">
                      <Tag
                        className={clsx(
                          "!text-xs",
                          getDeptTypeStyle(selected.type),
                        )}>
                        {getDeptTypeLabel(selected.type)}
                      </Tag>
                      <span className="text-xs text-[#758BA5]">
                        {memberCountByDept[selected.departmentId] ?? 0}{" "}
                        {t("department.members_count")}
                      </span>
                    </div>
                  </div>
                </div>
                <BaseButton
                  icon={<Pencil className="h-4 w-4" />}
                  onClick={() => {
                    setEditingDept(selected);
                    setModalMode("edit");
                  }}
                  label="global.edit"
                />
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-stroke bg-white p-4">
                <div>
                  <p className="text-xs text-[#758BA5]">
                    {t("department.column.manager")}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-[#223A59]">
                    {resolveManagerName(selected.managerUserId) ?? (
                      <span className="font-normal text-[#758BA5]">
                        {t("department.not_assigned")}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#758BA5]">
                    {t("department.column.id")}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-[#758BA5]">
                    {selected.departmentId}
                  </p>
                </div>
              </div>

              {/* Members list */}
              <div>
                <h3 className="mb-3 text-sm font-medium text-[#223A59]">
                  {t("department.members_title")} ({deptUsers.length})
                </h3>
                {deptUsers.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span className="text-sm text-[#758BA5]">
                        {t("department.no_members")}
                      </span>
                    }
                  />
                ) : (
                  <div className="divide-y divide-stroke overflow-hidden rounded-xl border border-stroke bg-white">
                    {deptUsers.map((user) => {
                      const primaryRole = getPrimaryRole(user.roles);
                      return (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 px-4 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3684DB]/10 text-xs font-semibold text-[#3684DB]">
                            {(
                              user.name?.[0] ??
                              user.email?.[0] ??
                              "?"
                            ).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[#223A59]">
                              {user.name || user.email}
                            </p>
                            <p className="truncate text-xs text-[#758BA5]">
                              {user.email}
                            </p>
                          </div>
                          <Tag
                            className={clsx(
                              "shrink-0 text-xs",
                              ROLE_BADGE_STYLES[primaryRole] ??
                                ROLE_BADGE_STYLES.EMPLOYEE,
                            )}>
                            {ROLE_LABELS[primaryRole]}
                          </Tag>
                          <UserStatusTag status={user.status} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <DepartmentFormDrawer
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

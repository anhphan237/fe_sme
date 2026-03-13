import { Mail } from "lucide-react";
import { Table } from "@core/components/ui/Table";
import { useLocale } from "@/i18n";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import { StatusBadge } from "./StatCard";
import type { User } from "@/shared/types";

interface Props {
  users: User[];
  onSelectUser: (userId: string) => void;
}

export const EmployeeTable = ({ users, onSelectUser }: Props) => {
  const { t } = useLocale();
  return (
    <>
      <div className="flex items-center justify-between border-b border-stroke px-4 py-2.5">
        <p className="text-xs text-muted">
          {users.length} {t("onboarding.employee.result_count")}
        </p>
      </div>
      <Table>
        <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 w-[220px]">
              {t("onboarding.employee.col.name")}
            </th>
            <th className="px-4 py-3">{t("auth.email")}</th>
            <th className="px-4 py-3 w-[120px]">
              {t("onboarding.employee.col.role")}
            </th>
            <th className="px-4 py-3 w-[160px]">{t("employee.department")}</th>
            <th className="px-4 py-3 w-[110px]">{t("global.status")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="group cursor-pointer border-t border-stroke transition-colors hover:bg-blue-50/40"
              onClick={() => onSelectUser(user.id)}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    {user.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <span className="font-medium text-ink">{user.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5 text-muted">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted">
                {ROLE_LABELS[getPrimaryRole(user.roles)]}
              </td>
              <td className="px-4 py-3 text-sm text-muted">
                {user.department || <span className="text-slate-300">—</span>}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={user.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

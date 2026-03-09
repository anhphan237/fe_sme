import { Progress } from "@/components/ui/Progress";
import { ROLE_LABELS, getPrimaryRole } from "@/shared/rbac";
import type { OnboardingInstance, User } from "@/shared/types";
import { InstanceStatusBadge } from "./InstanceStatusBadge";

interface InstanceRowProps {
  instance: OnboardingInstance;
  users: User[];
  currentUser: User | null;
  onOpen: (id: string) => void;
}

export function InstanceRow({
  instance,
  users,
  currentUser,
  onOpen,
}: InstanceRowProps) {
  const isCurrentRow = Boolean(
    currentUser &&
    (instance.employeeUserId === currentUser.id ||
      instance.employeeId === currentUser.id),
  );

  const employee = users.find(
    (u) =>
      u.id === instance.employeeUserId ||
      u.id === instance.employeeId ||
      u.employeeId === instance.employeeId,
  );

  const name =
    employee?.name ?? (isCurrentRow ? (currentUser?.name ?? "-") : "-");
  const roles =
    employee?.roles ?? (isCurrentRow ? currentUser?.roles : undefined);
  const initial = name !== "-" ? name.charAt(0).toUpperCase() : "?";

  return (
    <tr className="group border-t border-stroke transition-colors hover:bg-blue-50/40">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
            {initial}
          </div>
          <button
            type="button"
            className="cursor-pointer font-medium text-blue-600 hover:underline"
            onClick={() => onOpen(instance.id)}>
            {name}
          </button>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted">
        {roles ? ROLE_LABELS[getPrimaryRole(roles)] : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-muted">
        {instance.startDate || "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-24">
            <Progress value={instance.progress ?? 0} />
          </div>
          <span className="text-sm tabular-nums text-muted">
            {instance.progress ?? 0}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <InstanceStatusBadge status={instance.status} />
      </td>
      <td className="px-4 py-3 text-sm text-muted">
        {employee?.manager || instance.managerName || "—"}
      </td>
    </tr>
  );
}

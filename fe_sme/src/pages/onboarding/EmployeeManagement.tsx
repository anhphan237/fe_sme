import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { apiSearchUsers, apiGetUserById } from "@/api/identity/identity.api";
import { extractList } from "@/api/core/types";
import { mapUser, mapUserDetail } from "@/utils/mappers/identity";
import type { User } from "@/shared/types";

const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: any) =>
      extractList(res, "users", "items").map(mapUser) as User[],
  });
const useUserDetailQuery = (userId: string | undefined) =>
  useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => apiGetUserById(userId!),
    enabled: Boolean(userId),
    select: (res: any) => mapUserDetail(res),
  });
import { ROLE_LABELS, getPrimaryRole } from "../../shared/rbac";
import type { UserDetail } from "../../shared/types";

function UserDetailContent({ detail }: { detail: UserDetail }) {
  const rows: { label: string; value: string | null }[] = [
    { label: "Full name", value: detail.fullName },
    { label: "Email", value: detail.email },
    { label: "Phone", value: detail.phone },
    { label: "Status", value: detail.status },
    { label: "Employee ID", value: detail.employeeId },
    { label: "Department ID", value: detail.departmentId },
    { label: "Employee code", value: detail.employeeCode },
    { label: "Job title", value: detail.jobTitle },
    { label: "Manager user ID", value: detail.managerUserId },
    { label: "Start date", value: detail.startDate },
    { label: "Work location", value: detail.workLocation },
  ];
  return (
    <div className="grid gap-3 text-sm">
      {rows.map(
        (row) =>
          row.value != null &&
          row.value !== "" && (
            <div
              key={row.label}
              className="flex justify-between gap-4 border-b border-stroke pb-2">
              <span className="text-muted">{row.label}</span>
              <span className="font-medium text-ink">{row.value}</span>
            </div>
          ),
      )}
    </div>
  );
}

function EmployeeManagement() {
  const navigate = useNavigate();
  const { data: users, isLoading, isError, error, refetch } = useUsersQuery();
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const { data: userDetail, isLoading: detailLoading } = useUserDetailQuery(
    detailUserId ?? undefined,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee management"
        subtitle="View and manage employee list and details."
        actionLabel="Add employee"
        onAction={() => navigate("/onboarding/employees/create")}
      />

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
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
        ) : users && users.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No employees yet"
              description="Add an employee to get started."
              actionLabel="Add employee"
              onAction={() => navigate("/onboarding/employees/create")}
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-stroke hover:bg-slate-50 cursor-pointer"
                  onClick={() => setDetailUserId(user.id)}>
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3 text-muted">
                    {ROLE_LABELS[getPrimaryRole(user.roles)]}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {user.department || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{user.status}</Badge>
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      onClick={() => setDetailUserId(user.id)}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={Boolean(detailUserId)}
        title="User detail"
        onClose={() => setDetailUserId(null)}>
        {detailLoading ? (
          <div className="space-y-2 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : userDetail && "userId" in userDetail ? (
          <UserDetailContent detail={userDetail as UserDetail} />
        ) : (
          <p className="text-sm text-muted">Could not load user detail.</p>
        )}
      </Modal>
    </div>
  );
}

export default EmployeeManagement;

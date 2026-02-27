import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { apiSearchUsers } from "@/api/identity/identity.api";
import { apiListDepartments } from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import { mapUser } from "@/utils/mappers/identity";
import type { User } from "@/shared/types";
import type { DepartmentItem } from "@/interface/company";

const useDepartmentsQuery = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    select: (res: any) => extractList<DepartmentItem>(res, "items"),
  });
const useUsersQuery = () =>
  useQuery({
    queryKey: ["users"],
    queryFn: () => apiSearchUsers(),
    select: (res: any) =>
      extractList(res, "users", "items").map(mapUser) as User[],
  });
import {
  apiCreateDepartment,
  apiUpdateDepartment,
} from "@/api/company/company.api";
import { useAppStore } from "../../store/useAppStore";
import type { Department } from "../../shared/types";

const DEPARTMENT_TYPES = [
  { value: "FCT", label: "Finance" },
  { value: "IT", label: "IT" },
  { value: "HR", label: "HR" },
  { value: "OPS", label: "Operations" },
  { value: "SLS", label: "Sales" },
  { value: "MKT", label: "Marketing" },
  { value: "GEN", label: "General" },
];

function Departments() {
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("FCT");
  const [createManagerId, setCreateManagerId] = useState("");
  const [createManagerQuery, setCreateManagerQuery] = useState("");
  const [createManagerDropdownOpen, setCreateManagerDropdownOpen] =
    useState(false);
  const createManagerDropdownRef = useRef<HTMLDivElement>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const currentTenant = useAppStore((s) => s.currentTenant);
  const currentUser = useAppStore((s) => s.currentUser);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const [editManagerUserId, setEditManagerUserId] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [assignManagerDept, setAssignManagerDept] = useState<Department | null>(
    null,
  );
  const [assignManagerUserId, setAssignManagerUserId] = useState("");
  const [assignManagerUpdating, setAssignManagerUpdating] = useState(false);
  const [assignManagerError, setAssignManagerError] = useState<string | null>(
    null,
  );
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useDepartmentsQuery();
  const { data: users } = useUsersQuery();

  const createFilteredUsers = useMemo(() => {
    if (!users) return [];
    const q = createManagerQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q),
    );
  }, [users, createManagerQuery]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (
        createManagerDropdownRef.current &&
        !createManagerDropdownRef.current.contains(e.target as Node)
      ) {
        setCreateManagerDropdownOpen(false);
      }
    };
    if (createManagerDropdownOpen) {
      document.addEventListener("mousedown", onMouseDown);
      return () => document.removeEventListener("mousedown", onMouseDown);
    }
  }, [createManagerDropdownOpen]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const name = createName.trim();
    if (!name) {
      setCreateError("Department name is required.");
      return;
    }
    if (!createManagerId) {
      setCreateError("Manager is required.");
      return;
    }
    const companyId = currentTenant?.id ?? currentUser?.companyId ?? "";
    if (!companyId) {
      setCreateError("No company selected.");
      return;
    }
    try {
      await apiCreateDepartment({
        companyId,
        name,
        type: createType,
        managerId: createManagerId,
      });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setCreateOpen(false);
      setCreateName("");
      setCreateType("FCT");
      setCreateManagerId("");
      setCreateManagerQuery("");
      toast("Department created.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create department.";
      setCreateError(msg);
      toast(msg);
    }
  };

  const openEdit = (dept: Department) => {
    setEditDept(dept);
    setEditName(dept.name);
    setEditManagerUserId(dept.managerUserId ?? "");
    setEditError(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDept) return;
    setEditError(null);
    const name = editName.trim();
    if (!name) {
      setEditError("Department name is required.");
      return;
    }
    setUpdating(true);
    try {
      await apiUpdateDepartment({
        departmentId: editDept.id,
        name,
        managerUserId: editManagerUserId || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setEditDept(null);
      toast("Department updated.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update department.";
      setEditError(msg);
      toast(msg);
    } finally {
      setUpdating(false);
    }
  };

  const managerName = (userId: string | null | undefined) => {
    if (!userId) return "—";
    const u = users?.find((u) => u.id === userId);
    return u ? u.name || u.email : userId;
  };

  const openAssignManager = (dept: Department) => {
    setAssignManagerDept(dept);
    setAssignManagerUserId(dept.managerUserId ?? "");
    setAssignManagerError(null);
  };

  const handleAssignManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignManagerDept) return;
    setAssignManagerError(null);
    setAssignManagerUpdating(true);
    try {
      await apiUpdateDepartment({
        departmentId: assignManagerDept.id,
        name: assignManagerDept.name,
        managerUserId: assignManagerUserId || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      setAssignManagerDept(null);
      toast("Manager assigned.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to assign manager.";
      setAssignManagerError(msg);
      toast(msg);
    } finally {
      setAssignManagerUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        subtitle="Create and maintain the org structure for this tenant."
      />

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
          className="rounded-lg">
          Create department
        </Button>
      </div>

      <Modal
        open={createOpen}
        title="Create department"
        onClose={() => {
          setCreateOpen(false);
          setCreateError(null);
          setCreateManagerQuery("");
          setCreateManagerDropdownOpen(false);
        }}>
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {createError}
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1d1d1f]">
              Name
            </label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. Finance Department"
              className="w-full rounded-lg border border-[#d2d2d7] px-3 py-2 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#1d1d1f]">
              Type
            </label>
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value)}
              className="w-full rounded-lg border border-[#d2d2d7] px-3 py-2 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20">
              {DEPARTMENT_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.value})
                </option>
              ))}
            </select>
          </div>
          <div ref={createManagerDropdownRef} className="relative w-full">
            <label className="mb-1 block text-sm font-medium text-[#1d1d1f]">
              Manager <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={
                createManagerDropdownOpen
                  ? createManagerQuery
                  : createManagerId
                    ? (() => {
                        const u = users?.find((x) => x.id === createManagerId);
                        return u ? `${u.name || u.email} (${u.email})` : "";
                      })()
                    : ""
              }
              onChange={(e) => {
                setCreateManagerQuery(e.target.value);
                setCreateManagerDropdownOpen(true);
              }}
              onFocus={() => setCreateManagerDropdownOpen(true)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-[#d2d2d7] px-3 py-2 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              autoComplete="off"
            />
            {createManagerDropdownOpen && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[#d2d2d7] bg-white py-1 shadow-lg">
                {createFilteredUsers.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted">No matches</li>
                ) : (
                  createFilteredUsers.map((u) => (
                    <li
                      key={u.id}
                      role="option"
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCreateManagerId(u.id);
                        setCreateManagerQuery("");
                        setCreateManagerDropdownOpen(false);
                      }}>
                      {u.name || u.email} ({u.email})
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="rounded-lg">
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editDept}
        title="Update department"
        onClose={() => {
          setEditDept(null);
          setEditError(null);
        }}>
        {editDept && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            {editError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {editError}
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1d1d1f]">
                Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Department name"
                className="w-full rounded-lg border border-[#d2d2d7] px-3 py-2 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1d1d1f]">
                Manager (optional)
              </label>
              <select
                value={editManagerUserId}
                onChange={(e) => setEditManagerUserId(e.target.value)}
                className="w-full rounded-lg border border-[#d2d2d7] px-3 py-2 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20">
                <option value="">No manager</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditDept(null)}
                className="rounded-lg">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="rounded-lg"
                disabled={updating}>
                {updating ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!assignManagerDept}
        title="Assign manager"
        onClose={() => {
          setAssignManagerDept(null);
          setAssignManagerError(null);
        }}>
        {assignManagerDept && (
          <form onSubmit={handleAssignManagerSubmit} className="space-y-4">
            {assignManagerError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {assignManagerError}
              </p>
            )}
            <p className="text-sm text-muted">
              Assign a manager for <strong>{assignManagerDept.name}</strong>.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1d1d1f]">
                Manager
              </label>
              <select
                value={assignManagerUserId}
                onChange={(e) => setAssignManagerUserId(e.target.value)}
                className="w-full rounded-lg border border-[#d2d2d7] px-3 py-2 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20">
                <option value="">No manager</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAssignManagerDept(null)}
                className="rounded-lg">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="rounded-lg"
                disabled={assignManagerUpdating}>
                {assignManagerUpdating ? "Saving…" : "Assign"}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Card className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="p-6 text-sm">
            Something went wrong.{" "}
            <button className="font-semibold" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : data && data.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No departments yet"
              description="Create your first department to organize teams."
            />
          </div>
        ) : (
          <Table>
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Department</th>
                <th className="min-w-[180px] px-4 py-3">Department ID</th>
                <th className="px-4 py-3">Manager</th>
                <th className="w-[100px] px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((dept) => (
                <tr
                  key={dept.id}
                  className="border-t border-stroke hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{dept.name}</td>
                  <td className="min-w-[180px] break-all px-4 py-3 font-mono text-sm text-muted">
                    {dept.id}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {managerName(dept.managerUserId)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        className="rounded-lg text-sm"
                        onClick={() => openAssignManager(dept)}>
                        Assign manager
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-lg text-sm"
                        onClick={() => openEdit(dept)}>
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export default Departments;

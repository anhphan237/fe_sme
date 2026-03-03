import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../../components/common/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { apiCreateUser } from "@/api/identity/identity.api";
import { apiListDepartments } from "@/api/company/company.api";
import { extractList } from "@/api/core/types";
import type { CreateUserRequest } from "@/interface/identity";
import type { DepartmentItem } from "@/interface/company";

const useDepartmentsQuery = () =>
  useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    select: (res: any) => extractList<DepartmentItem>(res, "items"),
  });
const useCreateUser = () =>
  useMutation({
    mutationFn: (payload: CreateUserRequest) => apiCreateUser(payload),
  });
import { ROLE_LABELS } from "../../shared/rbac";
import type { Role } from "../../shared/types";

const EMPLOYEE_ROLES: Role[] = ["EMPLOYEE", "MANAGER", "HR"];

function CreateEmployee() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const createUser = useCreateUser();
  const { data: departments } = useDepartmentsQuery();
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    roleCode: "EMPLOYEE" as Role,
    password: "",
    departmentId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email?.trim() || !form.fullName?.trim()) {
      toast("Email and full name are required.");
      return;
    }
    try {
      await createUser.mutateAsync({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        roleCode: form.roleCode,
        password: form.password || "changeme",
        departmentId: form.departmentId || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast("Employee created.");
      navigate("/onboarding/employees/new");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create employee.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Add a new employee to your organization."
      />

      <Card className="max-w-xl">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Email *
            <input
              type="email"
              className="rounded-xl border border-stroke px-4 py-2.5 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="email@company.com"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Full name *
            <input
              type="text"
              className="rounded-xl border border-stroke px-4 py-2.5 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              value={form.fullName}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value }))
              }
              placeholder="Nguyen Van A"
              required
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Phone
            <input
              type="tel"
              className="rounded-xl border border-stroke px-4 py-2.5 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="0912345678"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Role
            <select
              className="rounded-xl border border-stroke px-4 py-2.5 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              value={form.roleCode}
              onChange={(e) =>
                setForm((p) => ({ ...p, roleCode: e.target.value as Role }))
              }>
              {EMPLOYEE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          {departments && departments.length > 0 && (
            <label className="grid gap-1.5 text-sm font-medium">
              Department
              <select
                className="rounded-xl border border-stroke px-4 py-2.5 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                value={form.departmentId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, departmentId: e.target.value }))
                }>
                <option value="">— Select —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-1.5 text-sm font-medium">
            Password (optional)
            <input
              type="password"
              className="rounded-xl border border-stroke px-4 py-2.5 text-[15px] focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              placeholder="Leave blank to send invite"
            />
            <span className="text-xs text-muted">
              Leave blank if you will send an invite link.
            </span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Creating…" : "Create employee"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/onboarding/employees/new")}>
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default CreateEmployee;

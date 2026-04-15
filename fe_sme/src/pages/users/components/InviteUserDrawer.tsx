import { useEffect, useMemo, useState } from "react";
import { KeyRound, Mail, UserPlus } from "lucide-react";
import { Drawer, Form, Segmented } from "antd";
import dayjs from "dayjs";
import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
import BaseDatePicker from "@core/components/DatePicker";
import { useLocale } from "@/i18n";
import { ROLE_OPTIONS } from "../constants";
import type { User } from "@/shared/types";
import type { DepartmentItem } from "@/interface/company";

type CreateMode = "invite" | "direct";

export interface InviteForm {
  createMode: CreateMode;
  // Account
  email: string;
  name: string;
  password: string;
  // Role & Organization
  roleCode: string;
  departmentId: string;
  managerUserId: string;
  // Employee profile
  phone: string;
  jobTitle: string;
  employeeCode: string;
  startDate: string; // YYYY-MM-DD after conversion
  workLocation: string;
}

const SectionLabel = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => (
  <div className={`mb-3 flex items-center gap-2 ${className ?? ""}`}>
    <span className="text-xs font-semibold uppercase tracking-wider text-[#758BA5]">
      {label}
    </span>
    <div className="h-px flex-1 bg-[#E8EDF3]" />
  </div>
);

const FORM_ID = "invite-user-form";

function generateEmployeeCode(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `EMP-${year}-${rand}`;
}

// Internal form type (startDate is Dayjs while editing)
interface RawForm {
  email: string;
  name: string;
  password: string;
  roleCode: string;
  departmentId: string;
  managerUserId: string;
  phone: string;
  jobTitle: string;
  employeeCode: string;
  startDate: dayjs.Dayjs | null;
  workLocation: string;
}

export interface InviteUserDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: InviteForm) => Promise<void>;
  users: User[];
  departments: DepartmentItem[];
}

export const InviteUserDrawer = ({
  open,
  onClose,
  onSubmit,
  users,
  departments,
}: InviteUserDrawerProps) => {
  const { t } = useLocale();
  const [form] = Form.useForm<RawForm>();
  const [createMode, setCreateMode] = useState<CreateMode>("invite");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedDeptId = Form.useWatch("departmentId", form);

  const managerOptions = useMemo(() => {
    const filtered = selectedDeptId
      ? users.filter((u) => u.departmentId === selectedDeptId)
      : users;
    return filtered.map((u) => ({ value: u.id, label: u.name || u.email }));
  }, [users, selectedDeptId]);

  const reset = () => {
    form.resetFields();
    form.setFieldValue("employeeCode", generateEmployeeCode());
    setError(null);
    setCreateMode("invite");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Auto-generate employee code when drawer opens
  useEffect(() => {
    if (open) {
      form.setFieldValue("employeeCode", generateEmployeeCode());
    }
  }, [open, form]);

  const handleFinish = async (values: RawForm) => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        createMode,
        email: values.email,
        name: values.name,
        password: values.password ?? "",
        roleCode: values.roleCode,
        departmentId: values.departmentId ?? "",
        managerUserId: values.managerUserId ?? "",
        phone: values.phone ?? "",
        jobTitle: values.jobTitle ?? "",
        employeeCode: values.employeeCode ?? "",
        startDate: values.startDate
          ? dayjs.isDayjs(values.startDate)
            ? values.startDate.format("YYYY-MM-DD")
            : String(values.startDate)
          : "",
        workLocation: values.workLocation ?? "",
      });
      reset();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("user.error.invite_failed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-2">
      <BaseButton
        htmlType="button"
        onClick={handleClose}
        label="global.cancel"
      />
      <BaseButton
        type="primary"
        htmlType="submit"
        form={FORM_ID}
        loading={submitting}
        icon={
          createMode === "invite" ? (
            <Mail className="h-3.5 w-3.5" />
          ) : (
            <KeyRound className="h-3.5 w-3.5" />
          )
        }
        label={
          submitting
            ? "user.invite.creating"
            : createMode === "invite"
              ? "user.invite.create"
              : "user.create_direct"
        }
      />
    </div>
  );

  return (
    <Drawer
      open={open}
      title={t("user.create.title")}
      onClose={handleClose}
      width={600}
      destroyOnClose
      maskClosable={false}
      footer={footer}>
      {/* Header accent */}
      <div className="mb-5 flex items-center gap-4 rounded-xl border border-[#E8EDF3] bg-[#F5F8FC] p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3684DB]/10">
          <UserPlus className="h-6 w-6 text-[#3684DB]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#223A59]">
            {t("user.create.title")}
          </p>
          <p className="mt-0.5 text-xs text-[#758BA5]">
            {t("user.create.subtitle")}
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="mb-5">
        <Segmented
          block
          value={createMode}
          onChange={(v) => {
            setCreateMode(v as CreateMode);
            form.setFieldValue("password", "");
          }}
          options={[
            {
              value: "invite",
              label: (
                <div className="flex items-center justify-center gap-1.5 py-0.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{t("user.create.mode_invite")}</span>
                </div>
              ),
            },
            {
              value: "direct",
              label: (
                <div className="flex items-center justify-center gap-1.5 py-0.5">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>{t("user.create.mode_direct")}</span>
                </div>
              ),
            },
          ]}
        />
        <p
          className="mt-2 rounded-lg border px-3 py-2 text-xs leading-relaxed text-[#758BA5]"
          style={{
            borderColor: createMode === "invite" ? "#dbeafe" : "#fef3c7",
            backgroundColor: createMode === "invite" ? "#eff6ff" : "#fffbeb",
          }}>
          {createMode === "invite"
            ? t("user.create.mode_invite_desc")
            : t("user.create.mode_direct_desc")}
        </p>
      </div>

      <Form
        id={FORM_ID}
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ roleCode: "EMPLOYEE" }}>
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Account ── */}
        <SectionLabel label={t("user.section.account")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <BaseInput
            name="email"
            label={
              <>
                {t("user.email")} <span className="text-red-400">*</span>
              </>
            }
            type="email"
            placeholder="employee@company.com"
            autoFocus
            formItemProps={{
              rules: [
                { required: true, message: t("user.error.no_email") },
                { type: "email", message: t("user.error.no_email") },
              ],
            }}
          />
          <BaseInput
            name="name"
            label={
              <>
                {t("user.name")} <span className="text-red-400">*</span>
              </>
            }
            placeholder="Nguyen Van A"
            formItemProps={{
              rules: [{ required: true, message: t("user.error.no_name") }],
            }}
          />
        </div>

        {/* Password (direct mode only) */}
        {createMode === "direct" && (
          <BaseInput
            name="password"
            label={
              <>
                {t("user.password")} <span className="text-red-400">*</span>
              </>
            }
            type="password"
            placeholder={t("user.password_placeholder")}
            formItemProps={{
              rules: [
                { required: true, message: t("user.error.no_password") },
                {
                  min: 8,
                  message: t("user.error.password_min"),
                },
              ],
            }}
          />
        )}

        {/* ── Role & Organization ── */}
        <SectionLabel
          label={t("user.section.role_department")}
          className="mt-2"
        />
        <BaseSelect
          name="roleCode"
          label={t("user.role")}
          options={ROLE_OPTIONS as { value: string; label: string }[]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <BaseSelect
            name="departmentId"
            label={t("user.invite.department_id")}
            showSearch
            allowClear
            placeholder={t("user.invite.department_placeholder")}
            options={departments.map((d) => ({
              value: d.departmentId,
              label: d.name,
            }))}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            onChange={() => form.setFieldValue("managerUserId", undefined)}
          />
          <BaseSelect
            name="managerUserId"
            label={t("user.invite.manager_id")}
            showSearch
            allowClear
            options={managerOptions}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </div>

        {/* ── Employee profile ── */}
        <SectionLabel label={t("user.section.profile")} className="mt-2" />
        <div className="grid gap-4 sm:grid-cols-2">
          <BaseInput
            name="phone"
            label={t("user.detail.phone")}
            type="tel"
            placeholder="+84 xxx xxx xxx"
          />
          <BaseInput
            name="jobTitle"
            label={t("user.detail.job_title")}
            placeholder={t("user.form.job_title_placeholder")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <BaseInput
            name="employeeCode"
            label={t("user.detail.employee_code")}
            placeholder="EMP-2026-xxxx"
          />
          <BaseInput
            name="workLocation"
            label={t("user.detail.work_location")}
            placeholder={t("user.form.work_location_placeholder")}
          />
        </div>
      </Form>
    </Drawer>
  );
};

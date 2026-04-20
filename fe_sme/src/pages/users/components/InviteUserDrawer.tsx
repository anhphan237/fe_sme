import { useEffect, useMemo, useState } from "react";
import { KeyRound, Mail, UserPlus } from "lucide-react";
import { Drawer, Form, Segmented } from "antd";
import BaseButton from "@/components/button";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseSelect from "@core/components/Select/BaseSelect";
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
  <div className={`mb-4 flex items-center gap-2 ${className ?? ""}`}>
    <span className="text-xs font-semibold uppercase tracking-wider text-[#758BA5]">
      {label}
    </span>
    <div className="h-px flex-1 bg-[#E8EDF3]" />
  </div>
);

const RequiredMark = () => <span className="ml-0.5 text-red-400">*</span>;

const FORM_ID = "invite-user-form";

function generateEmployeeCode(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `EMP-${year}-${rand}`;
}

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
  departments,
}: InviteUserDrawerProps) => {
  const { t } = useLocale();
  const [form] = Form.useForm<RawForm>();
  const [createMode, setCreateMode] = useState<CreateMode>("invite");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const roleOptions = useMemo(
    () =>
      ROLE_OPTIONS.filter((o) => !o.isPlatform).map((o) => ({
        value: o.value,
        label: t(o.labelKey),
      })),
    [t],
  );

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
        startDate: "",
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
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <BaseInput
            name="email"
            label={
              <>
                {t("user.email")}
                <RequiredMark />
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
                {t("user.name")}
                <RequiredMark />
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
          <div className="mt-3">
            <BaseInput
              name="password"
              label={
                <>
                  {t("user.password")}
                  <RequiredMark />
                </>
              }
              type="password"
              placeholder={t("user.password_placeholder")}
              formItemProps={{
                rules: [
                  { required: true, message: t("user.error.no_password") },
                  { min: 8, message: t("user.error.password_min") },
                ],
              }}
            />
          </div>
        )}

        {/* ── Role & Organization ── */}
        <SectionLabel
          label={t("user.section.role_department")}
          className="mt-5"
        />
        <div className="flex flex-col gap-y-3">
          <BaseSelect
            name="roleCode"
            label={<>{t("user.role")}</>}
            options={roleOptions}
            formItemProps={{
              rules: [
                { required: true, message: t("user.role") + " is required" },
              ],
            }}
          />
          <div className="grid gap-x-4 sm:grid-cols-2">
            <BaseSelect
              name="departmentId"
              label={<>{t("user.invite.department_id")}</>}
              showSearch
              allowClear
              placeholder={t("user.invite.department_placeholder")}
              options={departments.map((d) => ({
                value: d.departmentId,
                label: d.name,
              }))}
              formItemProps={{
                rules: [
                  {
                    required: true,
                    message: t("user.invite.department_id") + " is required",
                  },
                ],
              }}
              filterOption={(input, option) =>
                String(option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </div>
        </div>

        {/* ── Employee Profile ── */}
        <SectionLabel label={t("user.section.profile")} className="mt-5" />
        <div className="flex flex-col gap-y-3">
          <div className="grid gap-x-4 sm:grid-cols-2">
            <BaseInput
              name="phone"
              label={t("user.detail.phone")}
              type="tel"
              placeholder="+84 xxx xxx xxx"
              formItemProps={{
                rules: [
                  {
                    pattern: /^[+]?[\d\s\-().]{7,20}$/,
                    message: "Invalid phone number format.",
                  },
                ],
              }}
            />
            <BaseInput
              name="jobTitle"
              label={t("user.detail.job_title")}
              placeholder={t("user.form.job_title_placeholder")}
            />
          </div>
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

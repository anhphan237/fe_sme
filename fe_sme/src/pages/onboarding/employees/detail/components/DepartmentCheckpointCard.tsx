import React, { useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Progress,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Hash,
  History,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/utils/notify";
import { apiTaskDepartmentConfirm } from "@/api/onboarding/onboarding.api";
import type { DepartmentCheckpoint } from "@/interface/onboarding";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";

interface ConfirmCheckpointModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  checkpoint: DepartmentCheckpoint;
  onSuccess?: () => void;
}

interface ConfirmFormValues {
  evidenceNote?: string;
  evidenceRef?: string;
}

const fallback = (value: string | undefined, fallbackValue: string) =>
  value && !value.startsWith("onboarding.") && !value.startsWith("global.")
    ? value
    : fallbackValue;

const formatDateTime = (value?: string, locale?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString((locale ?? "vi-VN").replace("_", "-"), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isHttpUrl = (value?: string) => /^https?:\/\//i.test(value ?? "");

const getCheckpointKey = (checkpoint: DepartmentCheckpoint, index: number) =>
  checkpoint.checkpointId ??
  `${checkpoint.taskId ?? "task"}-${checkpoint.departmentId}-${index}`;

const MetaItem = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
      {icon}
      <span>{label}</span>
    </div>
    <div className="min-w-0 text-sm font-medium text-gray-800">{children}</div>
  </div>
);

const EvidenceBlock = ({
  checkpoint,
  noteLabel,
  refLabel,
}: {
  checkpoint: DepartmentCheckpoint;
  noteLabel: string;
  refLabel: string;
}) => {
  if (!checkpoint.evidenceNote && !checkpoint.evidenceRef) return null;

  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3 text-sm">
      {checkpoint.evidenceNote && (
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500">
              {noteLabel}
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-gray-700">
              {checkpoint.evidenceNote}
            </p>
          </div>
        </div>
      )}
      {checkpoint.evidenceRef && (
        <div
          className={
            checkpoint.evidenceNote
              ? "mt-2 flex items-start gap-2"
              : "flex items-start gap-2"
          }
        >
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500">
              {refLabel}
            </p>
            {isHttpUrl(checkpoint.evidenceRef) ? (
              <a
                href={checkpoint.evidenceRef}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 block truncate text-blue-600 hover:underline"
                title={checkpoint.evidenceRef}
              >
                {checkpoint.evidenceRef}
              </a>
            ) : (
              <p
                className="mt-0.5 truncate text-gray-700"
                title={checkpoint.evidenceRef}
              >
                {checkpoint.evidenceRef}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ConfirmCheckpointModal: React.FC<ConfirmCheckpointModalProps> = ({
  open,
  onClose,
  taskId,
  checkpoint,
  onSuccess,
}) => {
  const { t } = useLocale();
  const [form] = Form.useForm<ConfirmFormValues>();
  const queryClient = useQueryClient();
  const requireEvidence = checkpoint.requireEvidence === true;

  const mutation = useMutation({
    mutationFn: (values: ConfirmFormValues) =>
      apiTaskDepartmentConfirm({
        taskId,
        departmentId: checkpoint.departmentId,
        evidenceNote: values.evidenceNote?.trim() || undefined,
        evidenceRef: values.evidenceRef?.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey;
          if (!Array.isArray(key)) return false;
          return (
            key.includes("onboarding-task-full") ||
            key.includes("onboarding-task-detail") ||
            key.includes("onboarding-tasks-by-instance") ||
            key.includes("onboarding-tasks-by-assignee") ||
            key.includes("department-dependent-tasks") ||
            key.includes(taskId)
          );
        },
      });
      notify.success(t("onboarding.approvals.dept.toast.confirmed"));
      form.resetFields();
      onSuccess?.();
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : t("onboarding.approvals.dept.toast.confirm_failed");
      notify.error(msg);
    },
  });

  const handleFinish = (values: ConfirmFormValues) => {
    const evidenceNote = values.evidenceNote?.trim();
    const evidenceRef = values.evidenceRef?.trim();
    if (requireEvidence && !evidenceNote && !evidenceRef) {
      form.setFields([
        {
          name: "evidenceNote",
          errors: [t("onboarding.approvals.dept.validation.evidence_required")],
        },
      ]);
      return;
    }
    mutation.mutate({ evidenceNote, evidenceRef });
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-gray-900">
              {t("onboarding.approvals.dept.modal.title")}
            </p>
            <p className="truncate text-xs font-normal text-gray-500">
              {checkpoint.departmentName ?? checkpoint.departmentId}
            </p>
          </div>
        </div>
      }
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500">
            {t("onboarding.approvals.dept.modal.dept_label")}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-gray-900">
            {checkpoint.departmentName ?? checkpoint.departmentId}
          </p>
          {checkpoint.checkpointId && (
            <p className="mt-1 truncate font-mono text-[11px] text-gray-400">
              {checkpoint.checkpointId}
            </p>
          )}
        </div>

        {requireEvidence ? (
          <>
            <Form.Item
              label={t("onboarding.approvals.dept.modal.evidence_note_label")}
              name="evidenceNote"
            >
              <Input.TextArea
                rows={3}
                placeholder={t(
                  "onboarding.approvals.dept.modal.evidence_note_placeholder",
                )}
                className="resize-none"
              />
            </Form.Item>
            <Form.Item
              label={t("onboarding.approvals.dept.modal.evidence_ref_label")}
              name="evidenceRef"
              extra={t("onboarding.approvals.dept.modal.evidence_ref_extra")}
            >
              <Input
                placeholder={t(
                  "onboarding.approvals.dept.modal.evidence_ref_placeholder",
                )}
              />
            </Form.Item>
          </>
        ) : (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3.5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
            <Typography.Text className="text-sm text-gray-700">
              {t("onboarding.approvals.dept.modal.no_evidence_confirm")}
            </Typography.Text>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={handleClose} disabled={mutation.isPending}>
            {t("global.cancel")}
          </Button>
          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            {t("global.confirm")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

interface DepartmentCheckpointCardProps {
  taskId: string;
  checkpoints: DepartmentCheckpoint[];
  onCheckpointConfirmed?: () => void;
}

export const DepartmentCheckpointCard: React.FC<
  DepartmentCheckpointCardProps
> = ({ taskId, checkpoints, onCheckpointConfirmed }) => {
  const { t, locale } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const userDeptId = currentUser?.departmentId;
  const [activeCheckpoint, setActiveCheckpoint] =
    useState<DepartmentCheckpoint | null>(null);

  const { confirmedCount, pendingCount, progressPct } = useMemo(() => {
    const confirmed = checkpoints.filter(
      (cp) => cp.status === "CONFIRMED",
    ).length;
    const pending = checkpoints.length - confirmed;
    return {
      confirmedCount: confirmed,
      pendingCount: pending,
      progressPct:
        checkpoints.length > 0
          ? Math.round((confirmed / checkpoints.length) * 100)
          : 0,
    };
  }, [checkpoints]);

  if (!checkpoints || checkpoints.length === 0) return null;

  const allConfirmed = pendingCount === 0;
  const title = fallback(
    t("onboarding.template.editor.task.responsible_departments"),
    "Department checkpoints",
  );
  const pendingLabel = fallback(
    t("onboarding.approvals.dept.tab.pending"),
    "Pending",
  );
  const confirmedLabel = fallback(
    t("onboarding.approvals.dept.tab.confirmed"),
    "Confirmed",
  );
  const evidenceRequiredLabel = fallback(
    t("onboarding.approvals.dept.badge.require_evidence"),
    "Evidence required",
  );

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  allConfirmed ? "bg-green-100" : "bg-blue-100"
                }`}
              >
                {allConfirmed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Building2 className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  {confirmedCount}/{checkpoints.length}{" "}
                  {confirmedLabel.toLowerCase()}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <Tag
                color={allConfirmed ? "success" : "processing"}
                style={{ margin: 0 }}
              >
                {progressPct}%
              </Tag>
              {pendingCount > 0 && (
                <Tag color="warning" style={{ margin: 0 }}>
                  {pendingCount} {pendingLabel.toLowerCase()}
                </Tag>
              )}
            </div>
          </div>
          <Progress
            percent={progressPct}
            showInfo={false}
            strokeColor={allConfirmed ? "#16a34a" : "#2563eb"}
            trailColor="#e5e7eb"
            className="mt-3"
          />
        </div>

        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {checkpoints.map((cp, index) => {
            const isConfirmed = cp.status === "CONFIRMED";
            const canConfirm =
              !isConfirmed &&
              Boolean(userDeptId) &&
              userDeptId?.trim() === cp.departmentId?.trim();
            const departmentName = cp.departmentName ?? cp.departmentId;

            return (
              <article
                key={getCheckpointKey(cp, index)}
                className={`rounded-xl border p-3 transition-colors ${
                  isConfirmed
                    ? "border-green-200 bg-green-50/35"
                    : canConfirm
                      ? "border-blue-200 bg-blue-50/20"
                      : "border-gray-200 bg-gray-50/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-white ${
                      isConfirmed ? "border-green-200" : "border-amber-200"
                    }`}
                  >
                    {isConfirmed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Tooltip title={departmentName}>
                        <h4 className="max-w-full truncate text-sm font-semibold text-gray-900">
                          {departmentName}
                        </h4>
                      </Tooltip>
                      <Tag
                        color={isConfirmed ? "success" : "warning"}
                        style={{ margin: 0, fontSize: 11 }}
                      >
                        {isConfirmed ? confirmedLabel : pendingLabel}
                      </Tag>
                      {cp.requireEvidence && (
                        <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                          {evidenceRequiredLabel}
                        </Tag>
                      )}
                    </div>
                    <p
                      className="mt-1 truncate text-xs text-gray-400"
                      title={cp.departmentId}
                    >
                      {cp.departmentId}
                    </p>
                  </div>

                  {canConfirm && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      onClick={() => setActiveCheckpoint(cp)}
                    >
                      {t("global.confirm")}
                    </Button>
                  )}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(cp.confirmedByName || cp.confirmedBy) && (
                    <MetaItem
                      label={t(
                        "onboarding.approvals.dept.confirmed.confirmed_by",
                      )}
                      icon={<UserIcon className="h-3.5 w-3.5" />}
                    >
                      <span
                        className="truncate"
                        title={cp.confirmedByName ?? cp.confirmedBy}
                      >
                        {cp.confirmedByName ?? cp.confirmedBy}
                      </span>
                    </MetaItem>
                  )}
                  {cp.confirmedAt && (
                    <MetaItem
                      label={t(
                        "onboarding.approvals.dept.confirmed.confirmed_at",
                      )}
                      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                    >
                      {formatDateTime(cp.confirmedAt, locale)}
                    </MetaItem>
                  )}
                  {cp.createdAt && (
                    <MetaItem
                      label={t("global.created_at")}
                      icon={<History className="h-3.5 w-3.5" />}
                    >
                      {formatDateTime(cp.createdAt, locale)}
                    </MetaItem>
                  )}
                  {cp.updatedAt && (
                    <MetaItem
                      label={t("global.updated_at")}
                      icon={<History className="h-3.5 w-3.5" />}
                    >
                      {formatDateTime(cp.updatedAt, locale)}
                    </MetaItem>
                  )}
                  {cp.checkpointId && (
                    <MetaItem
                      label="Checkpoint ID"
                      icon={<Hash className="h-3.5 w-3.5" />}
                    >
                      <span
                        className="block truncate font-mono text-xs"
                        title={cp.checkpointId}
                      >
                        {cp.checkpointId}
                      </span>
                    </MetaItem>
                  )}
                </div>

                <EvidenceBlock
                  checkpoint={cp}
                  noteLabel={t("onboarding.approvals.dept.confirmed.note")}
                  refLabel={t("onboarding.approvals.dept.confirmed.ref")}
                />
              </article>
            );
          })}
        </div>
      </section>

      {activeCheckpoint && (
        <ConfirmCheckpointModal
          open
          taskId={taskId}
          checkpoint={activeCheckpoint}
          onClose={() => setActiveCheckpoint(null)}
          onSuccess={onCheckpointConfirmed}
        />
      )}
    </>
  );
};

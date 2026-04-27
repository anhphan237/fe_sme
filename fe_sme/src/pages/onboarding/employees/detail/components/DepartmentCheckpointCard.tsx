import React, { useState } from "react";
import { Button, Card, Form, Input, Modal, Tag, Typography } from "antd";
import { Building2, CheckCircle2, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { notify } from "@/utils/notify";
import { apiTaskDepartmentConfirm } from "@/api/onboarding/onboarding.api";
import type { DepartmentCheckpoint } from "@/interface/onboarding";
import { useUserStore } from "@/stores/user.store";

interface ConfirmCheckpointModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  checkpoint: DepartmentCheckpoint;
  onSuccess?: () => void;
}

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
};

const ConfirmCheckpointModal: React.FC<ConfirmCheckpointModalProps> = ({
  open,
  onClose,
  taskId,
  checkpoint,
  onSuccess,
}) => {
  const [form] = Form.useForm<{ evidenceNote?: string; evidenceRef?: string }>();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: { evidenceNote?: string; evidenceRef?: string }) =>
      apiTaskDepartmentConfirm({
        taskId,
        departmentId: checkpoint.departmentId,
        evidenceNote: values.evidenceNote,
        evidenceRef: values.evidenceRef,
      }),
    onSuccess: () => {
      // Invalidate task detail + task list queries
      void queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey;
          if (!Array.isArray(key)) return false;
          return (
            key.includes("onboarding-task-full") ||
            key.includes("onboarding-task-detail") ||
            key.includes("onboarding-tasks-by-instance") ||
            key.includes("onboarding-tasks-by-assignee") ||
            key.includes(taskId)
          );
        },
      });
      notify.success("Department checkpoint confirmed");
      form.resetFields();
      onSuccess?.();
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error
          ? err.message
          : "Department checkpoint confirmation failed";
      notify.error(msg);
    },
  });

  return (
    <Modal
      open={open}
      title={`Confirm checkpoint: ${checkpoint.departmentName ?? checkpoint.departmentId}`}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
      >
        {checkpoint.requireEvidence && (
          <>
            <Form.Item
              label="Evidence note"
              name="evidenceNote"
              rules={[
                {
                  required: true,
                  message: "Please enter an evidence note",
                },
              ]}
            >
              <Input.TextArea rows={3} placeholder="Describe the evidence..." />
            </Form.Item>
            <Form.Item label="Evidence reference (URL/file path)" name="evidenceRef">
              <Input placeholder="https://..." />
            </Form.Item>
          </>
        )}
        {!checkpoint.requireEvidence && (
          <Typography.Text type="secondary">
            Confirm that department{" "}
            <strong>{checkpoint.departmentName ?? checkpoint.departmentId}</strong>{" "}
            has completed this checkpoint?
          </Typography.Text>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={mutation.isPending}
          >
            Confirm
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
  const currentUser = useUserStore((s) => s.currentUser);
  const userDeptId = currentUser?.departmentId;

  const [activeCheckpoint, setActiveCheckpoint] =
    useState<DepartmentCheckpoint | null>(null);

  if (!checkpoints || checkpoints.length === 0) return null;

  return (
    <>
      <Card
        size="small"
        title={
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Building2 size={14} /> Department checkpoints
          </span>
        }
        className="mb-3"
      >
        <div className="flex flex-col gap-2">
          {checkpoints.map((cp) => {
            const isConfirmed = cp.status === "CONFIRMED";
            const canConfirm = !isConfirmed && userDeptId === cp.departmentId;

            return (
              <div
                key={cp.checkpointId}
                className="rounded border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    {isConfirmed ? (
                      <CheckCircle2 size={14} className="text-green-500" />
                    ) : (
                      <Clock size={14} className="text-amber-500" />
                    )}
                    <span className="font-medium">
                      {cp.departmentName ?? cp.departmentId}
                    </span>
                    <Tag
                      color={isConfirmed ? "success" : "warning"}
                      style={{ margin: 0, fontSize: 11 }}
                    >
                      {isConfirmed ? "Confirmed" : "Pending"}
                    </Tag>
                    {cp.requireEvidence && !isConfirmed && (
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                        Evidence required
                      </Tag>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isConfirmed && cp.confirmedByName && (
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {cp.confirmedByName}
                      </Typography.Text>
                    )}
                    {canConfirm && (
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => setActiveCheckpoint(cp)}
                      >
                        Confirm
                      </Button>
                    )}
                  </div>
                </div>
                {isConfirmed && (cp.evidenceNote || cp.evidenceRef || cp.confirmedAt) && (
                  <div className="mt-2 rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                    {cp.evidenceNote && (
                      <p>
                        <span className="font-medium text-gray-700">Evidence note:</span>{" "}
                        {cp.evidenceNote}
                      </p>
                    )}
                    {cp.evidenceRef && (
                      <p className="mt-1">
                        <span className="font-medium text-gray-700">Reference:</span>{" "}
                        <a
                          href={cp.evidenceRef}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {cp.evidenceRef}
                        </a>
                      </p>
                    )}
                    {cp.confirmedAt && (
                      <p className="mt-1">
                        <span className="font-medium text-gray-700">Confirmed at:</span>{" "}
                        {formatDateTime(cp.confirmedAt)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

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

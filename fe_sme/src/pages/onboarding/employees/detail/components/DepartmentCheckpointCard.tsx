import React, { useState } from "react";
import { Button, Card, Form, Input, Modal, Spin, Tag, Typography } from "antd";
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
      // Invalidate task detail queries so checkpoint status refreshes
      void queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey;
          return (
            Array.isArray(key) &&
            (key.includes("onboarding-task-full") ||
              key.includes("onboarding-task") ||
              key.includes(taskId))
          );
        },
      });
      notify.success("Đã xác nhận checkpoint thành công");
      form.resetFields();
      onSuccess?.();
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "Xác nhận checkpoint thất bại";
      notify.error(msg);
    },
  });

  return (
    <Modal
      open={open}
      title={`Xác nhận checkpoint: ${checkpoint.departmentName ?? checkpoint.departmentId}`}
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
              label="Ghi chú bằng chứng"
              name="evidenceNote"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập ghi chú bằng chứng",
                },
              ]}
            >
              <Input.TextArea rows={3} placeholder="Mô tả bằng chứng..." />
            </Form.Item>
            <Form.Item label="Tham chiếu (URL/file path)" name="evidenceRef">
              <Input placeholder="https://..." />
            </Form.Item>
          </>
        )}
        {!checkpoint.requireEvidence && (
          <Typography.Text type="secondary">
            Xác nhận phòng ban{" "}
            <strong>{checkpoint.departmentName ?? checkpoint.departmentId}</strong>{" "}
            đã hoàn thành checkpoint này?
          </Typography.Text>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={onClose} disabled={mutation.isPending}>
            Huỷ
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={mutation.isPending}
          >
            Xác nhận
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────

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
            <Building2 size={14} /> Checkpoint phòng ban
          </span>
        }
        className="mb-3"
      >
        <div className="flex flex-col gap-2">
          {checkpoints.map((cp) => {
            const isConfirmed = cp.status === "CONFIRMED";
            const canConfirm =
              !isConfirmed && userDeptId === cp.departmentId;

            return (
              <div
                key={cp.checkpointId}
                className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-3 py-2"
              >
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
                    {isConfirmed ? "Đã xác nhận" : "Chờ xác nhận"}
                  </Tag>
                  {cp.requireEvidence && !isConfirmed && (
                    <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                      Cần bằng chứng
                    </Tag>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isConfirmed && cp.confirmedByName && (
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 11 }}
                    >
                      {cp.confirmedByName}
                    </Typography.Text>
                  )}
                  {canConfirm && (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setActiveCheckpoint(cp)}
                    >
                      Xác nhận
                    </Button>
                  )}
                </div>
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

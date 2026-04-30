import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  FileText,
  UploadCloud,
  FileCheck,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button, Form, Input, Modal, Upload } from "antd";
import { apiTaskDepartmentConfirm } from "@/api/onboarding/onboarding.api";
import { apiUploadDocumentFile } from "@/api/document/document.api";
import { useLocale } from "@/i18n";
import { notify } from "@/utils/notify";

interface ConfirmCheckpointModalProps {
  open: boolean;
  taskId: string | null;
  taskTitle?: string;
  checklistName?: string;
  requireEvidence: boolean;
  departmentId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  evidenceNote?: string;
  evidenceRef?: string;
}

export function ConfirmCheckpointModal({
  open,
  taskId,
  taskTitle,
  checklistName,
  requireEvidence,
  departmentId,
  onClose,
  onSuccess,
}: ConfirmCheckpointModalProps) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiTaskDepartmentConfirm({
        taskId: taskId!,
        departmentId: departmentId!,
        evidenceNote: values.evidenceNote?.trim() || undefined,
        evidenceRef: values.evidenceRef?.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["department-dependent-tasks", departmentId],
      });
      void queryClient.invalidateQueries({ queryKey: ["approval-task-detail"] });
      void queryClient.invalidateQueries({
        queryKey: ["onboarding-task-detail"],
      });
      void queryClient.invalidateQueries({ queryKey: ["approval-tasks"] });
      notify.success(t("onboarding.approvals.dept.toast.confirmed"));
      form.resetFields();
      setUploadedFile(null);
      onSuccess();
    },
    onError: (error: unknown) => {
      notify.error(
        error instanceof Error
          ? error.message
          : t("onboarding.approvals.dept.toast.confirm_failed"),
      );
    },
  });

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiUploadDocumentFile(formData);
      setUploadedFile({ name: file.name, url: res.fileUrl });
      form.setFieldValue("evidenceRef", res.fileUrl);
    } catch (err) {
      notify.error(
        err instanceof Error
          ? err.message
          : t("onboarding.approvals.dept.toast.confirm_failed"),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    form.setFieldValue("evidenceRef", undefined);
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    form.resetFields();
    setUploadedFile(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
            <Building2 className="h-4 w-4 text-purple-600" />
          </div>
          <span className="text-base font-semibold text-gray-900">
            {t("onboarding.approvals.dept.modal.title")}
          </span>
        </div>
      }
      onCancel={handleClose}
      footer={null}
      destroyOnClose
      width={560}
    >
      {taskId && (
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => mutation.mutate(values)}
        >
          {/* Task info card */}
          <div className="mb-5 overflow-hidden rounded-xl border border-purple-100 bg-gradient-to-b from-purple-50/60 to-white">
            <div className="px-4 py-3">
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-purple-400">
                {t("onboarding.approvals.dept.modal.task_label")}
              </p>
              <p className="text-sm font-semibold text-gray-800">{taskTitle}</p>
            </div>
            {checklistName && (
              <div className="border-t border-purple-100 px-4 py-2.5">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-purple-400">
                  {t("onboarding.approvals.dept.checklist_label")}
                </p>
                <p className="text-sm font-medium text-purple-700">
                  {checklistName}
                </p>
              </div>
            )}
          </div>

          {requireEvidence ? (
            <>
              {/* Evidence note */}
              <Form.Item
                label={
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-purple-500" />
                    <span>
                      {t(
                        "onboarding.approvals.dept.modal.evidence_note_label",
                      )}
                    </span>
                  </span>
                }
                name="evidenceNote"
                rules={[
                  {
                    required: true,
                    message: t(
                      "onboarding.approvals.dept.modal.evidence_note_required",
                    ),
                  },
                ]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder={t(
                    "onboarding.approvals.dept.modal.evidence_note_placeholder",
                  )}
                  className="resize-none"
                />
              </Form.Item>

              {/* Hidden field to carry the uploaded file URL into onFinish values */}
              <Form.Item name="evidenceRef" hidden>
                <Input />
              </Form.Item>

              {/* Evidence file upload */}
              <div className="mb-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-sm">
                  <UploadCloud className="h-3.5 w-3.5 text-purple-500" />
                  <span className="font-medium text-gray-800">
                    {t(
                      "onboarding.approvals.dept.modal.evidence_file_label",
                    )}
                  </span>
                  <span className="text-xs font-normal text-gray-400">
                    {t(
                      "onboarding.approvals.dept.modal.evidence_file_optional",
                    )}
                  </span>
                </p>

                {uploadedFile ? (
                  <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                    <FileCheck className="h-5 w-5 shrink-0 text-green-500" />
                    <span className="flex-1 truncate text-sm font-medium text-green-700">
                      {uploadedFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={mutation.isPending}
                      className="rounded p-0.5 text-gray-400 transition-colors hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Upload.Dragger
                    accept="*/*"
                    showUploadList={false}
                    multiple={false}
                    disabled={isUploading || mutation.isPending}
                    beforeUpload={(file) => {
                      void handleFileUpload(file);
                      return false;
                    }}
                    style={{ borderColor: "#d8b4fe" }}
                  >
                    <div className="flex flex-col items-center gap-1.5 py-4">
                      {isUploading ? (
                        <>
                          <Loader2 className="h-7 w-7 animate-spin text-purple-400" />
                          <p className="text-sm text-gray-500">
                            {t(
                              "onboarding.approvals.dept.modal.evidence_file_uploading",
                            )}
                          </p>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-7 w-7 text-purple-300" />
                          <p className="text-sm text-gray-600">
                            {t(
                              "onboarding.approvals.dept.modal.evidence_file_hint",
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            {t(
                              "onboarding.approvals.dept.modal.evidence_file_types",
                            )}
                          </p>
                        </>
                      )}
                    </div>
                  </Upload.Dragger>
                )}
              </div>
            </>
          ) : (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <p className="text-sm text-gray-700">
                {t("onboarding.approvals.dept.modal.no_evidence_confirm")}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={handleClose} disabled={mutation.isPending}>
              {t("global.cancel")}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
              disabled={isUploading}
              className="bg-purple-600 hover:!bg-purple-700"
            >
              {t("global.confirm")}
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
}

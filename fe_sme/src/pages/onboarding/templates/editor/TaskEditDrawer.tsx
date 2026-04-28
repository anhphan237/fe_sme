import { useEffect, useState } from "react";
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Tag,
  Divider,
  Upload as AntUpload,
  Button,
  Popconfirm,
  message,
} from "antd";
import {
  Copy,
  FileText,
  FileImage,
  File as GenericFileIcon,
  GripVertical,
  Info,
  Loader2,
  Trash2,
  UploadCloud,
  FileCheck2,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import BaseModal from "@core/components/Modal/BaseModal";
import {
  apiGetDocuments,
  apiUploadDocumentFile,
} from "@/api/document/document.api";
import { apiListDepartments } from "@/api/company/company.api";
import { useUsersQuery } from "@/hooks/adminHooks";
import type { DocumentItem } from "@/interface/document";
import type { TaskDraft } from "./constants";

function getFileExt(fileUrl: string): string {
  return fileUrl?.split(".").pop()?.toLowerCase() ?? "";
}

function FileTypeIcon({ fileUrl }: { fileUrl?: string }) {
  const ext = getFileExt(fileUrl ?? "");
  if (ext === "pdf")
    return <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />;
  if (["docx", "doc"].includes(ext))
    return <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />;
  if (["xlsx", "xls", "csv"].includes(ext))
    return <FileText className="h-3.5 w-3.5 shrink-0 text-green-600" />;
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return <FileImage className="h-3.5 w-3.5 shrink-0 text-purple-500" />;
  return <GenericFileIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />;
}

const DocumentPickerInDrawer = ({
  value,
  onChange,
  disabled,
}: {
  value?: string[];
  onChange?: (ids: string[]) => void;
  disabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: docsData, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiGetDocuments(),
    staleTime: 10 * 60 * 1000,
  });
  const rawDocs = (docsData as any)?.documents ?? (docsData as any)?.data ?? docsData;
  const documents: DocumentItem[] = Array.isArray(rawDocs) ? rawDocs : [];

  const handleUploadConfirm = async () => {
    if (!uploadFile || !uploadName.trim()) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("name", uploadName.trim());
      const result = await apiUploadDocumentFile(formData);
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      onChange?.([...(value ?? []), result.documentId]);
      message.success(`Đã upload "${uploadName.trim()}"`);
      setUploadOpen(false);
      setUploadFile(null);
      setUploadName("");
    } catch (err: any) {
      message.error(err?.message ?? "Upload thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Select
        mode="multiple"
        size="small"
        disabled={disabled}
        loading={isLoadingDocs}
        value={value}
        onChange={onChange}
        placeholder="Tìm và chọn tài liệu..."
        optionFilterProp="label"
        className="w-full"
        tagRender={(props) => {
          const doc = documents.find((d) => d.documentId === props.value);
          return (
            <Tag
              closable={!disabled}
              onClose={props.onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginRight: 4,
                marginBlock: 2,
                paddingInline: 6,
                paddingBlock: 2,
                borderRadius: 6,
                fontSize: 11,
              }}>
              <FileTypeIcon fileUrl={doc?.fileUrl} />
              <span
                style={{
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                {doc?.name ?? String(props.value)}
              </span>
            </Tag>
          );
        }}
        notFoundContent={
          isLoadingDocs ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <FileText className="h-6 w-6 text-muted/40" />
              <p className="text-xs text-muted">Chưa có tài liệu</p>
              <Button
                size="small"
                type="primary"
                ghost
                onClick={() => setUploadOpen(true)}>
                Upload tài liệu
              </Button>
            </div>
          )
        }
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: "4px 0" }} />
            <div style={{ padding: "4px 8px 8px" }}>
              <Button
                type="dashed"
                size="small"
                block
                icon={<UploadCloud className="h-3.5 w-3.5" />}
                onClick={() => setUploadOpen(true)}>
                Upload tài liệu mới
              </Button>
            </div>
          </>
        )}
        options={documents.map((d) => ({
          value: d.documentId,
          label: d.name,
          fileUrl: d.fileUrl,
          description: d.description,
        }))}
        optionRender={(opt) => (
          <div className="flex items-center gap-2 py-0.5">
            <FileTypeIcon fileUrl={(opt.data as any).fileUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">
                {opt.data.label as string}
              </p>
              {(opt.data as any).description && (
                <p className="truncate text-[10px] text-muted">
                  {(opt.data as any).description}
                </p>
              )}
            </div>
          </div>
        )}
      />

      <BaseModal
        title={
          <div className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-brand" />
            <span>Upload tài liệu mới</span>
          </div>
        }
        open={uploadOpen}
        onCancel={() => {
          if (isUploading) return;
          setUploadOpen(false);
          setUploadFile(null);
          setUploadName("");
        }}
        onOk={handleUploadConfirm}
        confirmLoading={isUploading}
        okText="Upload & chọn"
        cancelText="Hủy"
        okButtonProps={{ disabled: !uploadFile || !uploadName.trim() }}
        width={440}>
        <div className="space-y-4 py-1">
          <AntUpload.Dragger
            accept="*/*"
            maxCount={1}
            showUploadList={{ showRemoveIcon: true }}
            beforeUpload={(file) => {
              setUploadFile(file);
              if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ""));
              return false;
            }}
            onRemove={() => {
              setUploadFile(null);
              setUploadName("");
            }}
            fileList={
              uploadFile
                ? [{ uid: "1", name: uploadFile.name, status: "done", size: uploadFile.size }]
                : []
            }
            style={{ borderRadius: 8 }}>
            <div className="py-4">
              <UploadCloud className="mx-auto mb-2 h-8 w-8 text-brand/40" />
              <p className="text-sm font-medium text-ink">
                Kéo thả hoặc click để chọn file
              </p>
              <p className="mt-1 text-[11px] text-muted">
                PDF, DOCX, XLSX, ảnh và các định dạng khác
              </p>
            </div>
          </AntUpload.Dragger>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted">
              Tên tài liệu <span className="font-normal text-red-400">*</span>
            </p>
            <Input
              size="small"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              placeholder="Nhập tên tài liệu..."
              disabled={isUploading}
            />
          </div>
        </div>
      </BaseModal>
    </>
  );
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface DrawerState {
  /** Checklist index */
  ci: number;
  /** Task index within that checklist (-1 = new task) */
  ti: number;
  /** Initial task data (undefined for new task) */
  task?: TaskDraft;
}

export interface TaskEditDrawerProps {
  open: boolean;
  state: DrawerState | null;
  readOnly?: boolean;
  onClose: () => void;
  onSave: (ci: number, ti: number, updates: Partial<TaskDraft>) => void;
  onDelete: (ci: number, ti: number) => void;
  onClone: (ci: number, ti: number) => void;
}

// ── Main component ─────────────────────────────────────────────────────────────

export const TaskEditDrawer = ({
  open,
  state,
  readOnly,
  onClose,
  onSave,
  onDelete,
  onClone,
}: TaskEditDrawerProps) => {
  const { t } = useLocale();
  const [form] = Form.useForm();

  const isNew = state?.ti === -1;

  // Prefetch users (for manager/approver select)
  const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery({
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const allUsers = (usersData as any)?.users ?? (usersData as any)?.data ?? usersData ?? [];
  const managerUsers = allUsers.filter(
    (u: any) =>
      u.role === "MANAGER" ||
      u.roleCode === "MANAGER" ||
      (u.roles ?? []).includes("MANAGER"),
  );

  // Prefetch departments (for DEPARTMENT assignee + responsibleDepartmentIds)
  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => apiListDepartments(),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });
  const departments = ((departmentsData as any)?.items ?? (departmentsData as any)?.data ?? departmentsData ?? []) as Array<{
    departmentId: string;
    name: string;
    type?: string | null;
    managerUserId?: string | null;
  }>;

  // Sync form when state changes
  useEffect(() => {
    if (!open) return;
    if (state?.task) {
      form.setFieldsValue({
        name: state.task.name,
        description: state.task.description,
        assignee: state.task.assignee ?? "EMPLOYEE",
        ownerRefId: state.task.assignee === "DEPARTMENT"
          ? state.task.ownerRefId ?? undefined
          : undefined,
        dueDaysOffset: state.task.dueDaysOffset ?? 0,
        requireAck: state.task.requireAck ?? false,
        requireDoc: state.task.requireDoc ?? false,
        requiresManagerApproval: state.task.requiresManagerApproval ?? false,
        approverUserId: state.task.approverUserId,
        requiredDocumentIds: state.task.requiredDocumentIds ?? [],
        responsibleDepartmentsEnabled: (state.task.responsibleDepartmentIds ?? []).length > 0,
        responsibleDepartmentIds: state.task.responsibleDepartmentIds ?? [],
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        assignee: "EMPLOYEE",
        dueDaysOffset: 0,
        requireAck: false,
        requireDoc: false,
        requiresManagerApproval: false,
        requiredDocumentIds: [],
        responsibleDepartmentsEnabled: false,
        responsibleDepartmentIds: [],
      });
    }
  }, [open, state, form]);

  const handleSave = async () => {
    if (readOnly || !state) return;
    try {
      const values = await form.validateFields();
      const assignee = values.assignee as TaskDraft["assignee"];
      const effectiveResponsibleIds = values.responsibleDepartmentsEnabled
        ? (values.responsibleDepartmentIds ?? [])
        : [];
      onSave(state.ci, state.ti, {
        name: values.name,
        description: values.description ?? "",
        assignee,
        ownerRefId: assignee === "DEPARTMENT" ? (values.ownerRefId ?? null) : null,
        dueDaysOffset: values.dueDaysOffset ?? 0,
        requireAck: values.requireAck ?? false,
        requireDoc: values.requireDoc ?? false,
        requiresManagerApproval: values.requiresManagerApproval ?? false,
        approverUserId: values.requiresManagerApproval
          ? values.approverUserId
          : undefined,
        requiredDocumentIds:
          values.requireAck ? (values.requiredDocumentIds ?? []) : [],
        responsibleDepartmentIds: effectiveResponsibleIds,
        ownerRefName: assignee === "DEPARTMENT" && values.ownerRefId
          ? departments.find((d) => d.departmentId === values.ownerRefId)?.name
          : undefined,
        responsibleDepartmentNames: effectiveResponsibleIds.map(
          (id: string) => departments.find((d) => d.departmentId === id)?.name ?? id,
        ),
      });
      onClose();
    } catch {
      // validation errors shown inline
    }
  };

  const handleDelete = () => {
    if (!state) return;
    onDelete(state.ci, state.ti);
    onClose();
  };

  const handleClone = () => {
    if (!state) return;
    onClone(state.ci, state.ti);
    onClose();
  };

  const drawerTitle = isNew
    ? t("onboarding.template.editor.task_drawer.title_add")
    : t("onboarding.template.editor.task_drawer.title_edit");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted/40" />
          <span className="font-semibold text-ink">{drawerTitle}</span>
        </div>
      }
      width={520}
      destroyOnClose={false}
      footer={
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1">
            {!isNew && !readOnly && (
              <>
                <Popconfirm
                  title={t(
                    "onboarding.template.editor.task_drawer.delete_confirm",
                  )}
                  onConfirm={handleDelete}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("onboarding.template.editor.remove_task")}
                  </button>
                </Popconfirm>
                <button
                  type="button"
                  onClick={handleClone}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-ink">
                  <Copy className="h-3.5 w-3.5" />
                  {t("onboarding.template.editor.task_drawer.clone")}
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:bg-slate-100 hover:text-ink">
              {t("onboarding.template.editor.btn.cancel")}
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">
                {t("onboarding.template.editor.task_drawer.save")}
              </button>
            )}
          </div>
        </div>
      }>
      <Form
        form={form}
        layout="vertical"
        size="middle"
        disabled={readOnly}
        className="flex flex-col gap-0">

        {/* ── Section: Thông tin cơ bản ───────────────────────────────── */}
        <div className="mb-5 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Thông tin nhiệm vụ
          </p>

          <Form.Item
            name="name"
            label={
              <span className="text-xs font-medium text-slate-600">
                {t("onboarding.template.editor.task.name_label")}
                <span className="ml-0.5 text-red-400">*</span>
              </span>
            }
            rules={[
              {
                required: true,
                message: t("onboarding.template.editor.task.name_placeholder"),
              },
            ]}
            className="mb-0">
            <Input
              placeholder={t("onboarding.template.editor.task.name_placeholder")}
              className="font-medium"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="text-xs font-medium text-slate-600">
                {t("onboarding.template.editor.task.desc_label")}
              </span>
            }
            className="mb-0">
            <Input.TextArea
              placeholder={t(
                "onboarding.template.editor.task.desc_placeholder",
              )}
              rows={2}
              className="resize-none"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="assignee"
              label={
                <span className="text-xs font-medium text-slate-600">
                  {t("onboarding.template.editor.task.assignee_label")}
                </span>
              }
              className="mb-0">
              <Select
                options={[
                  {
                    value: "EMPLOYEE",
                    label: t(
                      "onboarding.template.editor.task.assignee.employee",
                    ),
                  },
                  {
                    value: "HR",
                    label: t("onboarding.template.editor.task.assignee.hr"),
                  },
                  {
                    value: "MANAGER",
                    label: t(
                      "onboarding.template.editor.task.assignee.manager",
                    ),
                  },
                  {
                    value: "IT",
                    label: t("onboarding.template.editor.task.assignee.it"),
                  },
                  {
                    value: "DEPARTMENT",
                    label: t("onboarding.template.editor.task.assignee.department"),
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="dueDaysOffset"
              label={
                <span className="text-xs font-medium text-slate-600">
                  {t("onboarding.template.editor.task.due_label")}
                </span>
              }
              className="mb-0">
              <InputNumber
                min={0}
                className="w-full"
                addonAfter={<span className="text-xs text-muted">ngày</span>}
              />
            </Form.Item>
          </div>

          {/* Department owner selector — shown when assignee=DEPARTMENT */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.assignee !== curr.assignee}>
            {({ getFieldValue }) =>
              getFieldValue("assignee") === "DEPARTMENT" ? (
                <div className="mt-3">
                  <Form.Item
                    name="ownerRefId"
                    label={
                      <span className="text-xs font-medium text-slate-600">
                        {t("onboarding.template.editor.task.department_label")}
                        <span className="ml-0.5 text-red-400">*</span>
                      </span>
                    }
                    rules={[
                      {
                        required: true,
                        message: t("onboarding.template.editor.task.department_required"),
                      },
                    ]}
                    className="mb-0">
                    <Select
                      loading={isLoadingDepartments}
                      placeholder={t("onboarding.template.editor.task.department_placeholder")}
                      showSearch
                      optionFilterProp="label"
                      options={departments.map((d) => ({
                        value: d.departmentId,
                        label: d.name,
                      }))}
                    />
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>
        </div>

        <Divider className="!my-0" />

        {/* ── Section: Yêu cầu hoàn thành ─────────────────────────────── */}
        <div className="mt-4 space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t("onboarding.template.editor.task.completion_requirements_section")}
          </p>

          {/* Require Ack */}
          <div className="overflow-hidden rounded-xl border border-blue-100 bg-blue-50/30">
            <div className="flex items-center justify-between gap-3 px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {t("onboarding.template.editor.task.require_ack")}
                  </p>
                  <p className="text-[11px] leading-tight text-muted">
                    {t("onboarding.template.editor.task.require_ack_hint")}
                  </p>
                </div>
              </div>
              <Form.Item name="requireAck" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>

            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.requireAck !== curr.requireAck}>
              {({ getFieldValue }) =>
                getFieldValue("requireAck") ? (
                  <div className="border-t border-blue-100 bg-white/60 px-3.5 py-3 space-y-2.5">
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                      <Info className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                      <p className="text-[11px] text-blue-700">
                        {t("onboarding.template.editor.task.require_ack_hint")}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-blue-700">
                        {t("onboarding.template.editor.task.required_docs_label")}
                      </p>
                      <Form.Item name="requiredDocumentIds" noStyle>
                        <DocumentPickerInDrawer disabled={readOnly} />
                      </Form.Item>
                    </div>
                  </div>
                ) : null
              }
            </Form.Item>
          </div>

          {/* Require Doc upload */}
          <div className="overflow-hidden rounded-xl border border-sky-100 bg-sky-50/30">
            <div className="flex items-center justify-between gap-3 px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                  <UploadCloud className="h-3.5 w-3.5 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {t("onboarding.template.editor.task.require_doc")}
                  </p>
                  <p className="text-[11px] leading-tight text-muted">
                    {t("onboarding.template.editor.task.require_doc_hint")}
                  </p>
                </div>
              </div>
              <Form.Item name="requireDoc" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>

            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.requireDoc !== curr.requireDoc}>
              {({ getFieldValue }) =>
                getFieldValue("requireDoc") ? (
                  <div className="border-t border-sky-100 bg-white/60 px-3.5 py-3">
                    <div className="flex items-start gap-2 rounded-lg bg-sky-50 px-3 py-2.5">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
                      <div>
                        <p className="text-[11px] font-medium text-sky-700">
                          {t("onboarding.template.editor.task.require_doc_label")}
                        </p>
                        <p className="mt-0.5 text-[11px] text-sky-600">
                          {t("onboarding.template.editor.task.require_doc_info")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null
              }
            </Form.Item>
          </div>

          {/* Require Manager Approval */}
          <div className="overflow-hidden rounded-xl border border-violet-100 bg-violet-50/30">
            <div className="flex items-center justify-between gap-3 px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {t("onboarding.template.editor.task.require_approval")}
                  </p>
                  <p className="text-[11px] leading-tight text-muted">
                    {t("onboarding.template.editor.task.require_approval_hint")}
                  </p>
                </div>
              </div>
              <Form.Item
                name="requiresManagerApproval"
                valuePropName="checked"
                noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>

            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) =>
                prev.requiresManagerApproval !== curr.requiresManagerApproval
              }>
              {({ getFieldValue }) =>
                getFieldValue("requiresManagerApproval") ? (
                  <div className="border-t border-violet-100 bg-white/60 px-3.5 py-3 space-y-2.5">
                    <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2">
                      <Info className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                      <p className="text-[11px] text-violet-700">
                        {t("onboarding.template.editor.task.require_approval_hint")}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-violet-700">
                        {t("onboarding.template.editor.task.approver_label")}
                      </p>
                      <Form.Item
                        name="approverUserId"
                        noStyle
                        rules={[
                          {
                            required: true,
                            message: t("onboarding.template.editor.task.approver_required_message"),
                          },
                        ]}>
                        <Select
                          loading={isLoadingUsers}
                          placeholder={t("onboarding.template.editor.task.approver_select_placeholder")}
                          className="w-full"
                          showSearch
                          optionFilterProp="label"
                          allowClear
                          options={(managerUsers.length > 0
                            ? managerUsers
                            : allUsers
                          ).map((u: any) => ({
                            value: u.userId ?? u.id,
                            label: u.fullName ?? u.name ?? u.email,
                          }))}
                        />
                      </Form.Item>
                    </div>
                  </div>
                ) : null
              }
            </Form.Item>
          </div>

          {/* Responsible Departments (department checkpoint confirmations) */}
          <div className="overflow-hidden rounded-xl border border-teal-100 bg-teal-50/30">
            <div className="flex items-center justify-between gap-3 px-3.5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                  <Building2 className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {t("onboarding.template.editor.task.responsible_departments")}
                  </p>
                  <p className="text-[11px] leading-tight text-muted">
                    {t("onboarding.template.editor.task.responsible_departments_hint")}
                  </p>
                </div>
              </div>
              <Form.Item name="responsibleDepartmentsEnabled" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>

            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) =>
                prev.responsibleDepartmentsEnabled !== curr.responsibleDepartmentsEnabled
              }>
              {({ getFieldValue }) =>
                getFieldValue("responsibleDepartmentsEnabled") ? (
                  <div className="border-t border-teal-100 bg-white/60 px-3.5 py-3 space-y-2.5">
                    <div className="flex items-center gap-2 rounded-lg bg-teal-50 px-3 py-2">
                      <Info className="h-3.5 w-3.5 shrink-0 text-teal-500" />
                      <p className="text-[11px] text-teal-700">
                        {t("onboarding.template.editor.task.responsible_departments_hint")}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-teal-700">
                        {t("onboarding.template.editor.task.responsible_departments")}
                      </p>
                      <Form.Item name="responsibleDepartmentIds" noStyle>
                        <Select
                          mode="multiple"
                          size="small"
                          loading={isLoadingDepartments}
                          placeholder={t("onboarding.template.editor.task.responsible_departments_placeholder")}
                          optionFilterProp="label"
                          className="w-full"
                          options={departments.map((d) => ({
                            value: d.departmentId,
                            label: d.name,
                          }))}
                        />
                      </Form.Item>
                    </div>
                  </div>
                ) : null
              }
            </Form.Item>
          </div>
        </div>
      </Form>
    </Drawer>
  );
};

export type { DrawerState };

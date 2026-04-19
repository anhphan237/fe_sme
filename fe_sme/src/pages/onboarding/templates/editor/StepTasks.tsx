import { memo, useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Form,
  Input,
  Select,
  Button,
  Tag,
  Divider,
  Upload as AntUpload,
  message,
  Checkbox,
} from "antd";
import {
  BookOpen,
  ClipboardList,
  Copy,
  GripVertical,
  Loader2,
  Plus,
  Search,
  X,
  FileText,
  FileImage,
  File as GenericFileIcon,
  UploadCloud,
  UserCheck,
  FileCheck2,
  FolderOpen,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocale } from "@/i18n";
import BaseInput from "@core/components/Input/InputWithLabel";
import BaseInputNumber from "@core/components/Input/BaseNumberInput";
import BaseModal from "@core/components/Modal/BaseModal";
import BaseSelect from "@core/components/Select/BaseSelect";
import { STAGE_ACCENTS, STAGE_OPTIONS, getStageMeta } from "./constants";
import type { TaskDraft, ChecklistDraft, LibraryTask } from "./constants";
import {
  apiListTaskLibraries,
  apiGetTaskLibrary,
} from "@/api/onboarding/onboarding.api";
import {
  apiGetDocuments,
  apiUploadDocumentFile,
} from "@/api/document/document.api";
import { useUsersQuery } from "@/hooks/adminHooks";
import type { User } from "@/shared/types";
import type { DocumentItem } from "@/interface/document";
import type { TaskTemplateDetail } from "@/interface/onboarding";

// ── Task Library Modal ─────────────────────────────────────────────────────────

/** Maps a BE TaskTemplateDetail ownerType/ownerRefId to a UI assignee role */
function resolveAssignee(task: TaskTemplateDetail): LibraryTask["assignee"] {
  const ownerType = task.ownerType?.toUpperCase() ?? "";
  if (ownerType === "MANAGER") return "MANAGER";
  if (ownerType === "IT_STAFF") return "IT";
  if (ownerType === "DEPARTMENT" || ownerType === "USER") return "HR";
  // ownerType === "ROLE" or "EMPLOYEE" — check ownerRefId
  const ref = String(task.ownerRefId ?? "").toUpperCase();
  if (ref === "HR" || ref === "DEPARTMENT") return "HR";
  if (ref === "MANAGER") return "MANAGER";
  if (ref === "IT" || ref === "IT_STAFF") return "IT";
  if (ownerType === "EMPLOYEE") return "EMPLOYEE";
  return "EMPLOYEE";
}

type TaskLibraryEntry = LibraryTask & { _groupName: string; _stage?: string };

const TaskLibraryModal = ({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (task: LibraryTask) => void;
}) => {
  const { t } = useLocale();
  const [search, setSearch] = useState("");
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(
    null,
  );

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedLibraryId(null);
    }
  }, [open]);

  // Fetch list of active task libraries
  const { data: libraryList, isLoading: isLoadingList } = useQuery({
    queryKey: ["task-libraries", "ACTIVE"],
    queryFn: () => apiListTaskLibraries({ status: "ACTIVE", size: 100 }),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select first library when list loads
  useEffect(() => {
    if (libraryList?.items?.length && !selectedLibraryId) {
      setSelectedLibraryId(libraryList.items[0].templateId);
    }
  }, [libraryList, selectedLibraryId]);

  // Fetch detail of selected library
  const { data: libraryDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["task-library", selectedLibraryId],
    queryFn: () => apiGetTaskLibrary(selectedLibraryId!),
    enabled: !!selectedLibraryId,
    staleTime: 5 * 60 * 1000,
  });

  // Flatten all tasks from all checklists into entries with group metadata
  const allEntries = useMemo<TaskLibraryEntry[]>(() => {
    if (!libraryDetail?.checklists) return [];
    return libraryDetail.checklists.flatMap((cl) =>
      cl.tasks.map((task) => ({
        name: task.name ?? task.title ?? "",
        description: task.description ?? "",
        dueDaysOffset: task.dueDaysOffset ?? 0,
        requireAck: task.requireAck ?? false,
        requireDoc: task.requireDoc ?? false,
        requiresManagerApproval: task.requiresManagerApproval ?? false,
        category: "hr" as LibraryTask["category"],
        assignee: resolveAssignee(task),
        _groupName: cl.name,
        _stage: cl.stage,
      })),
    );
  }, [libraryDetail]);

  // Filter by search query
  const filtered = useMemo(() => {
    if (!search.trim()) return allEntries;
    const q = search.toLowerCase();
    return allEntries.filter(
      (tk) =>
        tk.name.toLowerCase().includes(q) ||
        tk.description.toLowerCase().includes(q),
    );
  }, [allEntries, search]);

  // Group filtered entries by checklist name
  const grouped = useMemo(() => {
    const map = new Map<string, TaskLibraryEntry[]>();
    for (const tk of filtered) {
      const arr = map.get(tk._groupName) ?? [];
      arr.push(tk);
      map.set(tk._groupName, arr);
    }
    return map;
  }, [filtered]);

  const libraries = libraryList?.items ?? [];
  const isLoading = isLoadingList || isLoadingDetail;

  return (
    <BaseModal
      title={
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand" />
          <span>{t("onboarding.template.library.title")}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}>
      {/* Library selector — shown only when there are multiple libraries */}
      {libraries.length > 1 && (
        <Select
          value={selectedLibraryId}
          onChange={setSelectedLibraryId}
          options={libraries.map((lib) => ({
            value: lib.templateId,
            label: lib.departmentTypeName
              ? `${lib.name} (${lib.departmentTypeName})`
              : lib.name,
          }))}
          className="mb-3 w-full"
          size="small"
        />
      )}

      <Input
        prefix={<Search className="h-3.5 w-3.5 text-muted" />}
        placeholder={t("onboarding.template.library.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        className="mb-3"
      />

      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </div>
        ) : grouped.size === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted">
              {libraries.length === 0
                ? t("onboarding.template.library.no_libraries")
                : t("onboarding.template.library.no_results")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([groupName, tasks]) => {
              const stageMeta = getStageMeta(tasks[0]?._stage);
              const accent = STAGE_ACCENTS[stageMeta.accent];
              return (
                <div key={groupName}>
                  <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                    <span>{groupName}</span>
                    {tasks[0]?._stage && (
                      <span
                        className={`rounded-md border px-1.5 py-0.5 text-[10px] normal-case tracking-normal font-medium ${accent.chip}`}>
                        {t(stageMeta.labelKey)}
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1.5">
                    {tasks.map((tk, i) => (
                      <div
                        key={`${groupName}-${i}`}
                        className="group flex items-start gap-3 rounded-lg border border-stroke bg-white p-3 transition hover:border-brand/30 hover:shadow-sm">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink">
                            {tk.name}
                          </p>
                          {tk.description && (
                            <p className="mt-0.5 text-xs text-muted">
                              {tk.description}
                            </p>
                          )}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted/70">
                            <span>
                              {t("onboarding.template.library.due_days", {
                                days: tk.dueDaysOffset,
                              })}
                            </span>
                            {tk.requireAck && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-600">
                                {t("onboarding.template.library.requires_ack")}
                              </span>
                            )}
                            {tk.requireDoc && (
                              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-600">
                                {t(
                                  "onboarding.template.editor.task.require_doc",
                                )}
                              </span>
                            )}
                            {tk.requiresManagerApproval && (
                              <span className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-600">
                                {t(
                                  "onboarding.template.editor.task.require_approval",
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAdd(tk)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-stroke text-muted transition hover:border-brand hover:bg-brand/5 hover:text-brand">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

// ── DocumentPickerField ────────────────────────────────────────────────────────

function getFileExt(fileUrl: string): string {
  return fileUrl?.split(".").pop()?.toLowerCase() ?? "";
}

function FileTypeIcon({
  fileUrl,
  size = "sm",
}: {
  fileUrl?: string;
  size?: "sm" | "md";
}) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const ext = getFileExt(fileUrl ?? "");
  if (ext === "pdf")
    return <FileText className={`${cls} shrink-0 text-red-500`} />;
  if (["docx", "doc"].includes(ext))
    return <FileText className={`${cls} shrink-0 text-blue-500`} />;
  if (["xlsx", "xls", "csv"].includes(ext))
    return <FileText className={`${cls} shrink-0 text-green-600`} />;
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return <FileImage className={`${cls} shrink-0 text-purple-500`} />;
  return <GenericFileIcon className={`${cls} shrink-0 text-gray-400`} />;
}

const DocumentPickerField = ({
  value,
  onChange,
  documents,
  isLoading,
  disabled,
}: {
  value?: string[];
  onChange?: (ids: string[]) => void;
  documents: DocumentItem[];
  isLoading: boolean;
  disabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const openUpload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setUploadOpen(true);
  };

  const closeUpload = () => {
    if (isUploading) return;
    setUploadOpen(false);
    setUploadFile(null);
    setUploadName("");
  };

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
      closeUpload();
    } catch (err: any) {
      message.error(err?.message ?? "Upload thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const emptyContent = isLoading ? (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted" />
    </div>
  ) : (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <FileText className="h-5 w-5 text-muted" />
      </div>
      <p className="text-xs font-medium text-ink">Chưa có tài liệu nào</p>
      <p className="text-[11px] text-muted">
        Upload tài liệu để nhân viên có thể xác nhận
      </p>
      <Button
        size="small"
        type="primary"
        ghost
        icon={<UploadCloud className="h-3.5 w-3.5" />}
        onClick={openUpload}
        className="mt-1">
        Upload tài liệu đầu tiên
      </Button>
    </div>
  );

  return (
    <>
      <Select
        mode="multiple"
        size="small"
        disabled={disabled}
        loading={isLoading}
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
                lineHeight: "16px",
              }}>
              <FileTypeIcon fileUrl={doc?.fileUrl} />
              <span
                style={{
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                {doc?.name ?? String(props.value)}
              </span>
            </Tag>
          );
        }}
        notFoundContent={emptyContent}
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
                onClick={openUpload}>
                Upload tài liệu mới
              </Button>
            </div>
          </>
        )}
        options={documents.map((d) => ({
          value: d.documentId,
          label: d.name,
          desc: d.description,
          fileUrl: d.fileUrl,
        }))}
        optionRender={(opt) => (
          <div className="flex items-center gap-2 py-0.5">
            <FileTypeIcon
              fileUrl={(opt.data as unknown as DocumentItem).fileUrl}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">
                {opt.data.label as string}
              </p>
              {(opt.data as unknown as DocumentItem).description && (
                <p className="truncate text-[10px] text-muted">
                  {(opt.data as unknown as DocumentItem).description}
                </p>
              )}
            </div>
          </div>
        )}
      />

      {/* Upload modal */}
      <BaseModal
        title={
          <div className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-brand" />
            <span>Upload tài liệu mới</span>
          </div>
        }
        open={uploadOpen}
        onCancel={closeUpload}
        onOk={handleUploadConfirm}
        confirmLoading={isUploading}
        okText="Upload & chọn"
        cancelText="Hủy"
        okButtonProps={{ disabled: !uploadFile || !uploadName.trim() }}
        width={440}>
        <div className="space-y-4 py-1">
          {/* Drag & drop area */}
          <AntUpload.Dragger
            accept="*/*"
            maxCount={1}
            showUploadList={{ showRemoveIcon: true }}
            beforeUpload={(file) => {
              setUploadFile(file);
              if (!uploadName) {
                setUploadName(file.name.replace(/\.[^.]+$/, ""));
              }
              return false;
            }}
            onRemove={() => {
              setUploadFile(null);
              setUploadName("");
            }}
            fileList={
              uploadFile
                ? [
                    {
                      uid: "1",
                      name: uploadFile.name,
                      status: "done",
                      size: uploadFile.size,
                    },
                  ]
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

          {/* Document name */}
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

// ── SortableTaskCard ───────────────────────────────────────────────────────────

interface FormValues {
  tasks: {
    name: string;
    description: string;
    dueDaysOffset: number;
    requireAck: boolean;
    requireDoc: boolean;
    requiresManagerApproval: boolean;
    approverUserId?: string;
    requiredDocumentIds?: string[];
    assignee: string;
  }[];
}

function SortableTaskCard({
  taskId,
  field,
  index,
  total,
  onCloneTask,
  onRemoveTask,
  readOnly,
  documents,
  isLoadingDocs,
  users,
  isLoadingUsers,
}: {
  taskId: string;
  field: { name: number; key: number };
  index: number;
  total: number;
  onCloneTask: (ti: number) => void;
  onRemoveTask: (ti: number) => void;
  readOnly?: boolean;
  documents?: DocumentItem[];
  isLoadingDocs?: boolean;
  users?: User[];
  isLoadingUsers?: boolean;
}) {
  const { t } = useLocale();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: taskId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group overflow-hidden rounded-xl border border-stroke bg-white transition hover:shadow-sm ${
        isDragging ? "shadow-md opacity-90" : ""
      }`}>
      {/* Card header */}
      <div className="flex items-center justify-between border-b border-stroke/60 bg-slate-50/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              type="button"
              className="cursor-grab touch-none rounded p-0.5 text-muted/40 transition hover:text-muted active:cursor-grabbing"
              {...attributes}
              {...listeners}>
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">
            {index + 1}
          </span>
          <span className="text-xs font-semibold text-muted">
            {t("onboarding.template.editor.step_tasks.task_label")}
          </span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCloneTask(index)}
              className="flex items-center gap-1 text-xs font-medium text-muted/60 opacity-0 transition hover:text-brand group-hover:opacity-100">
              <Copy className="h-3.5 w-3.5" />
              {t("onboarding.template.editor.clone_task")}
            </button>
            <button
              type="button"
              onClick={() => onRemoveTask(index)}
              disabled={total <= 1}
              className="flex items-center gap-1 text-xs font-medium text-muted/60 opacity-0 transition hover:text-red-500 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0">
              <X className="h-3.5 w-3.5" />
              {t("onboarding.template.editor.remove_task")}
            </button>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <BaseInput
              name={[field.name, "name"]}
              label={t("onboarding.template.editor.task.name_label")}
              placeholder={t(
                "onboarding.template.editor.task.name_placeholder",
              )}
              disabled={readOnly}
              formItemProps={{
                rules: readOnly
                  ? []
                  : [
                      {
                        required: true,
                        message: t(
                          "onboarding.template.editor.task.name_placeholder",
                        ),
                      },
                    ],
              }}
            />
          </div>
          <div>
            <BaseInputNumber
              name={[field.name, "dueDaysOffset"]}
              label={t("onboarding.template.editor.task.due_label")}
              min={0}
              disabled={readOnly}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <BaseInput
              name={[field.name, "description"]}
              label={t("onboarding.template.editor.task.desc_label")}
              placeholder={t(
                "onboarding.template.editor.task.desc_placeholder",
              )}
              disabled={readOnly}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              {t("onboarding.template.editor.task.assignee_label")}
            </p>
            <Form.Item name={[field.name, "assignee"]} className="mb-0">
              <Select
                size="small"
                disabled={readOnly}
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
                ]}
              />
            </Form.Item>
          </div>
        </div>

        {/* ── Option cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2 border-t border-stroke/60 pt-3">
          {/* Xác nhận tài liệu */}
          <div className="cursor-pointer rounded-xl border border-stroke bg-white p-3 transition has-[input:checked]:border-amber-300 has-[input:checked]:bg-amber-50/60 hover:border-amber-200 hover:shadow-sm">
            <div className="mb-2.5 flex items-start justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                <FileCheck2 className="h-3.5 w-3.5 text-amber-600" />
              </span>
              <Form.Item
                name={[field.name, "requireAck"]}
                valuePropName="checked"
                className="mb-0">
                <Checkbox disabled={readOnly} />
              </Form.Item>
            </div>
            <p className="text-xs font-semibold text-ink">
              {t("onboarding.template.editor.task.require_ack") ?? "Xác nhận tài liệu"}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
              Nhân viên phải đọc & xác nhận trước khi hoàn thành
            </p>
          </div>

          {/* Nộp tài liệu */}
          <div className="cursor-pointer rounded-xl border border-stroke bg-white p-3 transition has-[input:checked]:border-blue-300 has-[input:checked]:bg-blue-50/60 hover:border-blue-200 hover:shadow-sm">
            <div className="mb-2.5 flex items-start justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
              </span>
              <Form.Item
                name={[field.name, "requireDoc"]}
                valuePropName="checked"
                className="mb-0">
                <Checkbox disabled={readOnly} />
              </Form.Item>
            </div>
            <p className="text-xs font-semibold text-ink">
              {t("onboarding.template.editor.task.require_doc") ?? "Nộp tài liệu"}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
              Nhân viên phải upload tài liệu để hoàn thành
            </p>
          </div>

          {/* Phê duyệt quản lý */}
          <div className="cursor-pointer rounded-xl border border-stroke bg-white p-3 transition has-[input:checked]:border-violet-300 has-[input:checked]:bg-violet-50/60 hover:border-violet-200 hover:shadow-sm">
            <div className="mb-2.5 flex items-start justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100">
                <UserCheck className="h-3.5 w-3.5 text-violet-600" />
              </span>
              <Form.Item
                name={[field.name, "requiresManagerApproval"]}
                valuePropName="checked"
                className="mb-0">
                <Checkbox disabled={readOnly} />
              </Form.Item>
            </div>
            <p className="text-xs font-semibold text-ink">
              {t("onboarding.template.editor.task.require_approval") ?? "Phê duyệt quản lý"}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
              Quản lý phải phê duyệt để đánh dấu hoàn thành
            </p>
          </div>
        </div>

        {/* Conditional approver input — shown only when requiresManagerApproval is checked */}
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) =>
            prev.tasks?.[field.name]?.requiresManagerApproval !==
            curr.tasks?.[field.name]?.requiresManagerApproval
          }>
          {({ getFieldValue }) => {
            const needsApproval = getFieldValue([
              "tasks",
              field.name,
              "requiresManagerApproval",
            ]);
            if (!needsApproval) return null;
            return (
              <div className="overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-b from-orange-50/70 to-transparent">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-orange-100/80 bg-orange-50/60 px-4 py-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                    <UserCheck className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-orange-800">
                      {t("onboarding.template.editor.task.approver_label") ?? "Người phê duyệt"}
                    </p>
                    <p className="text-[10px] text-orange-500">
                      Chọn quản lý sẽ phê duyệt task này
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                    Tùy chọn
                  </span>
                </div>
                {/* Select */}
                <div className="p-3">
                  <Form.Item
                    name={[field.name, "approverUserId"]}
                    className="mb-0">
                    <Select
                      showSearch
                      allowClear
                      size="small"
                      disabled={readOnly}
                      loading={isLoadingUsers}
                      placeholder="Mặc định: line manager của nhân viên"
                      filterOption={(input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      notFoundContent={
                        isLoadingUsers ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-muted" />
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-muted">
                            Không tìm thấy người dùng
                          </div>
                        )
                      }
                      options={(users ?? []).map((u) => ({
                        value: u.id,
                        label: u.name || u.email,
                        email: u.email,
                      }))}
                      optionRender={(opt) => {
                        const initials = String(opt.data.label ?? "?")
                          .split(" ")
                          .filter(Boolean)
                          .slice(-2)
                          .map((w: string) => w[0])
                          .join("")
                          .toUpperCase();
                        return (
                          <div className="flex items-center gap-2.5 py-0.5">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-700">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-ink">
                                {opt.data.label as string}
                              </p>
                              <p className="truncate text-[10px] text-muted">
                                {(opt.data as { email?: string }).email}
                              </p>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </Form.Item>
                  <p className="mt-2 text-[10px] text-orange-500/80">
                    Nếu để trống, line manager của nhân viên sẽ được dùng làm người phê duyệt.
                  </p>
                </div>
              </div>
            );
          }}
        </Form.Item>

        {/* Conditional document picker — shown only when requireAck is checked */}
        <Form.Item
          noStyle
          shouldUpdate={(prev, curr) =>
            prev.tasks?.[field.name]?.requireAck !==
            curr.tasks?.[field.name]?.requireAck
          }>
          {({ getFieldValue }) => {
            const needsAck = getFieldValue(["tasks", field.name, "requireAck"]);
            if (!needsAck) return null;
            return (
              <div className="overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50/70 to-transparent">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-blue-100/80 bg-blue-50/60 px-4 py-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-blue-800">
                      {t("onboarding.template.editor.task.required_docs_label") ?? "Tài liệu xác nhận"}
                    </p>
                    <p className="text-[10px] text-blue-500">
                      Nhân viên phải đọc và xác nhận trước khi hoàn thành
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-500">
                    Bắt buộc
                  </span>
                </div>
                {/* Picker */}
                <div className="p-3">
                  <Form.Item
                    name={[field.name, "requiredDocumentIds"]}
                    className="mb-0"
                    rules={
                      readOnly
                        ? []
                        : [
                            {
                              required: true,
                              type: "array",
                              min: 1,
                              message:
                                t(
                                  "onboarding.template.editor.task.required_docs_error",
                                ) ?? "Vui lòng chọn ít nhất một tài liệu",
                            },
                          ]
                    }>
                    <DocumentPickerField
                      documents={documents ?? []}
                      isLoading={isLoadingDocs ?? false}
                      disabled={readOnly}
                    />
                  </Form.Item>
                </div>
              </div>
            );
          }}
        </Form.Item>
      </div>
    </div>
  );
}

// ── TaskForm — inner form for one stage's tasks (memoized) ─────────────────────

const TaskForm = memo(function TaskForm({
  checklist,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onCloneTask,
  onReorderTask,
  onAddLibraryTask,
  readOnly,
}: {
  checklist: ChecklistDraft;
  onUpdateTask: (ti: number, updates: Partial<TaskDraft>) => void;
  onAddTask: () => void;
  onRemoveTask: (ti: number) => void;
  onCloneTask: (ti: number) => void;
  onReorderTask: (from: number, to: number) => void;
  onAddLibraryTask: (task: LibraryTask) => void;
  readOnly?: boolean;
}) {
  const { t } = useLocale();
  const [antdForm] = Form.useForm<FormValues>();
  const skipSync = useRef(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Fetch document list once — used for requiredDocumentIds picker
  const { data: docData, isLoading: isLoadingDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiGetDocuments(),
    staleTime: 10 * 60 * 1000,
  });
  const documents = docData?.items ?? [];

  // Fetch user list once — used for approverUserId picker
  const { data: users = [], isLoading: isLoadingUsers } = useUsersQuery();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Sync parent tasks into antd form when active stage or its tasks change
  useEffect(() => {
    skipSync.current = true;
    antdForm.setFieldsValue({
      tasks: checklist.tasks.map((tk) => ({
        name: tk.name,
        description: tk.description,
        dueDaysOffset: tk.dueDaysOffset,
        requireAck: tk.requireAck,
        requireDoc: tk.requireDoc,
        requiresManagerApproval: tk.requiresManagerApproval,
        approverUserId: tk.approverUserId,
        requiredDocumentIds: tk.requiredDocumentIds,
        assignee: tk.assignee,
      })),
    });
    const timer = setTimeout(() => {
      skipSync.current = false;
    }, 0);
    return () => clearTimeout(timer);
  }, [checklist.id, checklist.tasks, antdForm]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active: dragActive, over } = event;
    if (!over || dragActive.id === over.id) return;
    const from = checklist.tasks.findIndex((tk) => tk.id === dragActive.id);
    const to = checklist.tasks.findIndex((tk) => tk.id === over.id);
    if (from !== -1 && to !== -1) onReorderTask(from, to);
  };

  return (
    <Form
      form={antdForm}
      onValuesChange={(_, all) => {
        if (skipSync.current) return;
        all.tasks?.forEach(
          (
            tk: {
              name: string;
              description: string;
              dueDaysOffset: number;
              requireAck: boolean;
              requireDoc: boolean;
              requiresManagerApproval: boolean;
              approverUserId?: string;
              requiredDocumentIds?: string[];
              assignee: string;
            },
            ti: number,
          ) => {
            const orig = checklist.tasks[ti];
            if (!orig) return;
            // When approval is unchecked, clear approverUserId
            const approverUserId = tk.requiresManagerApproval
              ? (tk.approverUserId ?? undefined)
              : undefined;
            // When requireAck is unchecked, clear requiredDocumentIds
            const requiredDocumentIds = tk.requireAck
              ? (tk.requiredDocumentIds ?? undefined)
              : undefined;
            if (
              tk.name !== orig.name ||
              tk.description !== orig.description ||
              tk.dueDaysOffset !== orig.dueDaysOffset ||
              tk.requireAck !== orig.requireAck ||
              tk.requireDoc !== orig.requireDoc ||
              tk.requiresManagerApproval !== orig.requiresManagerApproval ||
              approverUserId !== orig.approverUserId ||
              JSON.stringify(requiredDocumentIds) !==
                JSON.stringify(orig.requiredDocumentIds) ||
              tk.assignee !== orig.assignee
            ) {
              onUpdateTask(ti, {
                name: tk.name,
                description: tk.description,
                dueDaysOffset: tk.dueDaysOffset,
                requireAck: tk.requireAck,
                requireDoc: tk.requireDoc,
                requiresManagerApproval: tk.requiresManagerApproval,
                approverUserId,
                requiredDocumentIds,
                assignee: tk.assignee as TaskDraft["assignee"],
              });
            }
          },
        );
      }}>
      {/* Action bar */}
      <div className="flex items-center justify-between border-b border-stroke/60 bg-slate-50/30 px-5 py-3">
        <p className="text-xs font-semibold text-muted">
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-muted">
            {checklist.tasks.length}{" "}
            {t("onboarding.template.editor.step_tasks.task_label")}
          </span>
        </p>
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button
              type="default"
              size="small"
              icon={<BookOpen className="h-3.5 w-3.5" />}
              onClick={() => setLibraryOpen(true)}>
              {t("onboarding.template.library.button")}
            </Button>
            <Button type="default" size="small" onClick={onAddTask}>
              + {t("onboarding.template.editor.add_task")}
            </Button>
          </div>
        )}
      </div>

      <TaskLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAdd={(task) => onAddLibraryTask(task)}
      />

      {checklist.tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <ClipboardList className="h-6 w-6 text-muted" />
          </div>
          <p className="text-sm font-medium text-ink">
            {t("onboarding.template.editor.step_tasks.no_tasks")}
          </p>
          <p className="text-xs text-muted">
            {t("onboarding.template.editor.step_tasks.no_tasks_hint")}
          </p>
        </div>
      ) : (
        <div className="space-y-3 p-5">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext
              items={checklist.tasks.map((tk) => tk.id)}
              strategy={verticalListSortingStrategy}>
              <Form.List name="tasks">
                {(fields) =>
                  fields.map((field, ti) => {
                    const task = checklist.tasks[ti];
                    if (!task) return null;
                    return (
                      <SortableTaskCard
                        key={task.id}
                        taskId={task.id}
                        field={field}
                        index={ti}
                        total={checklist.tasks.length}
                        onCloneTask={onCloneTask}
                        onRemoveTask={onRemoveTask}
                        readOnly={readOnly}
                        documents={documents}
                        isLoadingDocs={isLoadingDocs}
                        users={users}
                        isLoadingUsers={isLoadingUsers}
                      />
                    );
                  })
                }
              </Form.List>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </Form>
  );
});

// ── TasksPanel — exported component ──────────────────────────────────────────

export interface TasksPanelProps {
  checklist: ChecklistDraft;
  stageIndex: number;
  onUpdateStage: (updates: Partial<ChecklistDraft>) => void;
  onUpdateTask: (ti: number, updates: Partial<TaskDraft>) => void;
  onAddTask: () => void;
  onRemoveTask: (ti: number) => void;
  onCloneTask: (ti: number) => void;
  onReorderTask: (from: number, to: number) => void;
  onAddLibraryTask: (task: LibraryTask) => void;
  readOnly?: boolean;
}

export const TasksPanel = ({
  checklist,
  onUpdateStage,
  onUpdateTask,
  onAddTask,
  onRemoveTask,
  onCloneTask,
  onReorderTask,
  onAddLibraryTask,
  readOnly,
}: TasksPanelProps) => {
  const { t } = useLocale();
  const [stageForm] = Form.useForm<{ stageType: string }>();

  const stageOptions = STAGE_OPTIONS.map((o) => {
    const m = getStageMeta(o.value);
    return {
      value: o.value,
      label: `${m.code} · ${t(o.label)}`,
    };
  });

  // Sync form when switching stages
  useEffect(() => {
    stageForm.setFieldsValue({ stageType: checklist.stageType });
  }, [checklist.id, checklist.stageType, stageForm]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative border-b border-stroke bg-white">
        <div className="flex flex-col gap-2 px-5 py-3">
          <Form
            form={stageForm}
            layout="inline"
            className="flex flex-1 min-w-0 items-center gap-3"
            onValuesChange={(_, all) => {
              if (readOnly) return;
              const stageMeta = getStageMeta(all.stageType);
              onUpdateStage({
                name: t(stageMeta.defaultNameKey),
                stageType: all.stageType ?? checklist.stageType,
              });
            }}>
            <BaseSelect
              name="stageType"
              options={stageOptions}
              size="small"
              disabled={readOnly}
              style={{ minWidth: 180 }}
              formItemProps={{ className: "shrink-0" }}
            />
          </Form>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        <TaskForm
          checklist={checklist}
          onUpdateTask={onUpdateTask}
          onAddTask={onAddTask}
          onRemoveTask={onRemoveTask}
          onCloneTask={onCloneTask}
          onReorderTask={onReorderTask}
          onAddLibraryTask={onAddLibraryTask}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};

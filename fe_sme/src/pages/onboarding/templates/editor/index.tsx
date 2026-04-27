import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ChevronLeft,
  Check,
  Copy,
  Info,
  Loader2,
  Plus,
} from "lucide-react";
import { Input as AntInput, Modal, message, Spin } from "antd";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import type { OnboardingTemplate } from "@/shared/types";
import {
  apiCreateTemplate,
  apiGetTemplate,
  apiUpdateTemplate,
  apiCloneTemplate,
} from "@/api/onboarding/onboarding.api";
import { mapTemplate } from "@/utils/mappers/onboarding";

import { StageColumn } from "./StageColumn";
import { TaskEditDrawer, type DrawerState } from "./TaskEditDrawer";
import { StagePickerModal } from "./StagePicker";
import TaskLibraryDrawer from "./TaskLibraryDrawer";

import type { TaskDraft, ChecklistDraft, EditorForm } from "./constants";
import type { StageMeta, StageType } from "./constants";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SaveTemplatePayload {
  name: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  createdBy: string;
  templateKind?: string;
  departmentTypeCode?: string;
  checklists?: {
    name: string;
    stage: string;
    deadlineDays?: number;
    sortOrder?: number;
    tasks: {
      title: string;
      ownerType: string;
      ownerRefId: string | null;
      responsibleDepartmentId?: string;
      responsibleDepartmentIds?: string[];
      description: string;
      dueDaysOffset: number;
      requireAck: boolean;
      requireDoc: boolean;
      requiresManagerApproval: boolean;
      approverUserId?: string;
      requiredDocumentIds?: string[];
      sortOrder?: number;
    }[];
  }[];
  templateId?: string;
}

const VALID_STAGE_TYPES = [
  "PRE_BOARDING",
  "DAY_1",
  "DAY_7",
  "DAY_30",
  "DAY_60",
  "CUSTOM",
] as const;

type ValidStageType = (typeof VALID_STAGE_TYPES)[number];

const FALLBACK_STAGE_TYPE = (index: number): ValidStageType =>
  VALID_STAGE_TYPES[index] ?? "DAY_1";

const normalizeTemplateStatus = (
  status?: string,
): "ACTIVE" | "INACTIVE" | "DRAFT" => {
  const normalized = (status ?? "DRAFT").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "INACTIVE") return normalized;
  return "DRAFT";
};

const extractTemplateId = (res: unknown): string | null => {
  const raw = res as Record<string, unknown>;
  const data = raw?.data as Record<string, unknown> | undefined;
  if (typeof raw?.templateId === "string") return raw.templateId;
  if (typeof data?.templateId === "string") return data.templateId;
  return null;
};

const checklistFromMeta = (meta: StageMeta, name: string): ChecklistDraft => ({
  id: crypto.randomUUID(),
  name,
  stageType: meta.value,
  tasks: [],
});

const initialForm = (): EditorForm => ({
  name: "",
  description: "",
  checklists: [],
  events: [],
});

const templateToForm = (tmpl: OnboardingTemplate): EditorForm => ({
  name: tmpl.name ?? "",
  description: tmpl.description ?? "",
  checklists: tmpl.stages?.length
    ? tmpl.stages.map((s, i) => ({
        id: s.id,
        checklistTemplateId: s.id,
        name: s.name ?? "",
        stageType: VALID_STAGE_TYPES.includes(s.stageType as ValidStageType)
          ? (s.stageType as ValidStageType)
          : FALLBACK_STAGE_TYPE(i),
        deadlineDays: s.deadlineDays ?? undefined,
        tasks: s.tasks?.length
          ? s.tasks.map((task) => ({
              id: task.id,
              taskTemplateId: task.id,
              name: task.title ?? "",
              description: task.description ?? "",
              dueDaysOffset: parseInt(String(task.dueOffset ?? "0"), 10) || 0,
              requireAck: task.requireAck ?? task.required ?? false,
              requireDoc: task.requireDoc ?? false,
              requiresManagerApproval: task.requiresManagerApproval ?? false,
              approverUserId: task.approverUserId ?? undefined,
              requiredDocumentIds: task.requiredDocumentIds ?? undefined,
              assignee: (task.ownerRole ?? "EMPLOYEE") as TaskDraft["assignee"],
              ownerRefId: task.ownerRefId ?? null,
              responsibleDepartmentIds:
                task.responsibleDepartmentIds ?? undefined,
            }))
          : [],
      }))
    : [],
  events: [],
});

const mapAssigneeToOwner = (
  assignee: TaskDraft["assignee"] | undefined,
  ownerRefId?: string | null,
): {
  ownerType: string;
  ownerRefId: string | null;
  responsibleDepartmentId?: string;
} => {
  switch (assignee) {
    case "MANAGER":
      return { ownerType: "MANAGER", ownerRefId: null };
    case "IT":
      return { ownerType: "IT_STAFF", ownerRefId: null };
    case "HR":
      return { ownerType: "HR", ownerRefId: null };
    case "DEPARTMENT":
      return {
        ownerType: "DEPARTMENT",
        ownerRefId: ownerRefId ?? null,
        responsibleDepartmentId: ownerRefId ?? undefined,
      };
    case "EMPLOYEE":
    default:
      return { ownerType: "EMPLOYEE", ownerRefId: null };
  }
};

const buildPayload = (form: EditorForm, createdBy: string) => ({
  name: form.name,
  description: form.description ?? "",
  status: "ACTIVE" as const,
  createdBy,
  checklists: form.checklists.map((c, ci) => ({
    name: c.name,
    stage: c.stageType,
    deadlineDays: c.tasks.length
      ? Math.max(...c.tasks.map((t) => t.dueDaysOffset ?? 0))
      : 0,
    sortOrder: ci,
    tasks: c.tasks.map((task, ti) => {
      const { ownerType, ownerRefId, responsibleDepartmentId } =
        mapAssigneeToOwner(task.assignee, task.ownerRefId);
      return {
        title: task.name,
        ownerType,
        ownerRefId,
        ...(responsibleDepartmentId ? { responsibleDepartmentId } : {}),
        responsibleDepartmentIds: task.responsibleDepartmentIds?.length
          ? task.responsibleDepartmentIds
          : undefined,
        description: task.description,
        dueDaysOffset: task.dueDaysOffset,
        requireAck: task.requireAck,
        requireDoc: task.requireDoc,
        requiresManagerApproval: task.requiresManagerApproval,
        approverUserId: task.approverUserId,
        requiredDocumentIds: task.requiredDocumentIds,
        sortOrder: ti,
      };
    }),
  })),
});

const buildUpdatePayload = (
  form: EditorForm,
  templateId: string,
  status?: string,
) => ({
  templateId,
  name: form.name,
  description: form.description ?? "",
  ...(status !== undefined ? { status } : {}),
  checklists: form.checklists.map((c, ci) => ({
    checklistTemplateId: c.checklistTemplateId ?? null,
    name: c.name,
    stage: c.stageType,
    deadlineDays: c.tasks.length
      ? Math.max(...c.tasks.map((t) => t.dueDaysOffset ?? 0))
      : 0,
    sortOrder: ci,
    tasks: c.tasks.map((task, ti) => {
      const { ownerType, ownerRefId, responsibleDepartmentId } =
        mapAssigneeToOwner(task.assignee, task.ownerRefId);
      return {
        taskTemplateId: task.taskTemplateId ?? null,
        title: task.name,
        ownerType,
        ownerRefId,
        ...(responsibleDepartmentId ? { responsibleDepartmentId } : {}),
        responsibleDepartmentIds: task.responsibleDepartmentIds?.length
          ? task.responsibleDepartmentIds
          : undefined,
        description: task.description,
        dueDaysOffset: task.dueDaysOffset,
        requireAck: task.requireAck,
        requireDoc: task.requireDoc,
        requiresManagerApproval: task.requiresManagerApproval,
        approverUserId: task.approverUserId,
        requiredDocumentIds: task.requiredDocumentIds,
        sortOrder: ti,
      };
    }),
  })),
});

// ── Status badge styles ────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-100 text-emerald-700",
  DRAFT: "border-amber-200 bg-amber-100 text-amber-700",
  INACTIVE: "border-slate-200 bg-slate-100 text-slate-500",
};

// ── Mutations ──────────────────────────────────────────────────────────────────

const useSaveTemplate = () =>
  useMutation({
    mutationFn: (payload: SaveTemplatePayload) => apiCreateTemplate(payload),
  });

const useUpdateTemplate = () =>
  useMutation({
    mutationFn: (payload: ReturnType<typeof buildUpdatePayload>) =>
      apiUpdateTemplate(payload),
  });

// ── Main component ─────────────────────────────────────────────────────────────

const TemplateEditor = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currentUser = useUserStore((s) => s.currentUser);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const isCreate = !templateId || templateId === "new";
  const duplicateFrom = (
    location.state as { duplicateFrom?: OnboardingTemplate } | null
  )?.duplicateFrom;

  const { data: templateRes, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => apiGetTemplate(templateId!),
    enabled: !isCreate && !!templateId,
    staleTime: 0,
  });

  const saveTemplate = useSaveTemplate();
  const updateTemplate = useUpdateTemplate();

  const [form, setForm] = useState<EditorForm>(initialForm);
  const [stagePickerOpen, setStagePickerOpen] = useState(false);
  const [templateStatus, setTemplateStatus] = useState<string>("DRAFT");
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [isCloning, setIsCloning] = useState(false);

  // Task drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);

  // Library drawer state
  const [libraryDrawerOpen, setLibraryDrawerOpen] = useState(false);

  const normalizedTemplateStatus = normalizeTemplateStatus(templateStatus);
  const isReadOnly = !isCreate && normalizedTemplateStatus === "ACTIVE";

  const totalTasks = useMemo(
    () => form.checklists.reduce((n, c) => n + c.tasks.length, 0),
    [form.checklists],
  );
  const nameValid = form.name.trim().length > 0;

  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    for (const cl of form.checklists) {
      for (let i = 1; i < cl.tasks.length; i++) {
        const prev = cl.tasks[i - 1].dueDaysOffset ?? 0;
        const curr = cl.tasks[i].dueDaysOffset ?? 0;
        if (curr < prev) {
          warnings.push(
            `Giai đoạn "${cl.name}": thứ tự ngày tăng dần (task ${i} < task ${i - 1})`,
          );
          break;
        }
      }
      for (const task of cl.tasks) {
        if (task.requiresManagerApproval && !task.approverUserId) {
          warnings.push(
            `Task "${task.name || "(chưa đặt tên)"}": cần chọn người duyệt`,
          );
        }
      }
    }
    return warnings;
  }, [form.checklists]);

  const canSave = nameValid && !isReadOnly;

  // ── Init ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (duplicateFrom) {
      const base = templateToForm(duplicateFrom);
      setForm({ ...base, name: `Copy of ${base.name}` });
      return;
    }
    if (!isCreate && templateRes) {
      const raw =
        (templateRes as Record<string, unknown>)?.template ??
        (templateRes as Record<string, unknown>)?.data ??
        templateRes;
      const tmpl = mapTemplate(raw as Record<string, unknown>);
      const formData = templateToForm(tmpl);
      setTemplateStatus(
        normalizeTemplateStatus(
          String(
            (raw as Record<string, unknown>)?.status ?? tmpl.status ?? "DRAFT",
          ),
        ),
      );
      setForm(formData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duplicateFrom, templateRes]);

  // ── Form updaters ──────────────────────────────────────────────────────────────

  const updateForm = (updates: Partial<EditorForm>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const updateChecklist = (i: number, updates: Partial<ChecklistDraft>) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      list[i] = { ...list[i], ...updates };
      return { ...prev, checklists: list };
    });

  const updateTask = (ci: number, ti: number, updates: Partial<TaskDraft>) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      const tasks = [...list[ci].tasks];
      if (ti === -1) {
        // New task: append
        const newTask: TaskDraft = {
          id: crypto.randomUUID(),
          name: "",
          description: "",
          dueDaysOffset: 0,
          requireAck: false,
          requireDoc: false,
          requiresManagerApproval: false,
          assignee: "EMPLOYEE",
          ...updates,
        };
        list[ci] = { ...list[ci], tasks: [...tasks, newTask] };
      } else {
        tasks[ti] = { ...tasks[ti], ...updates };
        list[ci] = { ...list[ci], tasks };
      }
      return { ...prev, checklists: list };
    });

  const addChecklistFromMeta = (meta: StageMeta) => {
    const name = t(meta.defaultNameKey);
    setForm((prev) => ({
      ...prev,
      checklists: [...prev.checklists, checklistFromMeta(meta, name)],
    }));
    setStagePickerOpen(false);
  };

  const removeChecklist = (i: number) =>
    setForm((prev) => ({
      ...prev,
      checklists: prev.checklists.filter((_, idx) => idx !== i),
    }));

  const cloneChecklist = (i: number) =>
    setForm((prev) => {
      const source = prev.checklists[i];
      if (!source) return prev;
      const cloned: ChecklistDraft = {
        ...source,
        id: crypto.randomUUID(),
        checklistTemplateId: undefined,
        tasks: source.tasks.map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          taskTemplateId: undefined,
        })),
      };
      const list = [...prev.checklists];
      list.splice(i + 1, 0, cloned);
      return { ...prev, checklists: list };
    });

  const deleteTask = (ci: number, ti: number) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      const tasks = list[ci].tasks.filter((_, i) => i !== ti);
      list[ci] = { ...list[ci], tasks };
      return { ...prev, checklists: list };
    });

  const cloneTask = (ci: number, ti: number) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      const source = list[ci].tasks[ti];
      if (!source) return prev;
      const cloned: TaskDraft = {
        ...source,
        id: crypto.randomUUID(),
        taskTemplateId: undefined,
      };
      const tasks = [...list[ci].tasks];
      tasks.splice(ti + 1, 0, cloned);
      list[ci] = { ...list[ci], tasks };
      return { ...prev, checklists: list };
    });

  const reorderTasks = (ci: number, from: number, to: number) =>
    setForm((prev) => {
      const list = [...prev.checklists];
      const tasks = [...list[ci].tasks];
      const [moved] = tasks.splice(from, 1);
      tasks.splice(to, 0, moved);
      list[ci] = { ...list[ci], tasks };
      return { ...prev, checklists: list };
    });

  // ── Task drawer helpers ────────────────────────────────────────────────────────

  const openNewTaskDrawer = (ci: number) => {
    setDrawerState({ ci, ti: -1, task: undefined });
    setDrawerOpen(true);
  };

  const openEditTaskDrawer = (ci: number, ti: number) => {
    setDrawerState({ ci, ti, task: form.checklists[ci]?.tasks[ti] });
    setDrawerOpen(true);
  };

  const handleDrawerSave = (
    ci: number,
    ti: number,
    updates: Partial<TaskDraft>,
  ) => {
    updateTask(ci, ti, updates);
  };

  const handleDrawerDelete = (ci: number, ti: number) => {
    deleteTask(ci, ti);
  };

  const handleDrawerClone = (ci: number, ti: number) => {
    cloneTask(ci, ti);
  };

  // ── Add tasks from library ─────────────────────────────────────────────────────

  const handleAddFromLibrary = (
    checklistIndex: number,
    tasks: Omit<TaskDraft, "id">[],
  ) => {
    setForm((prev) => {
      const list = [...prev.checklists];
      const target = list[checklistIndex];
      if (!target) return prev;
      const newTasks: TaskDraft[] = tasks.map((t) => ({
        ...t,
        id: crypto.randomUUID(),
      }));
      list[checklistIndex] = {
        ...target,
        tasks: [...target.tasks, ...newTasks],
      };
      return { ...prev, checklists: list };
    });
    message.success(
      t("onboarding.template.library.drawer.add_success", {
        count: String(tasks.length),
      }) ?? `Đã thêm ${tasks.length} task vào giai đoạn`,
    );
  };

  // ── Clone template ─────────────────────────────────────────────────────────────

  const handleCloneTemplate = async () => {
    if (!templateId || !cloneName.trim()) return;
    setIsCloning(true);
    try {
      const res = await apiCloneTemplate({
        sourceTemplateId: templateId,
        name: cloneName.trim(),
      });
      const newId = extractTemplateId(res);
      message.success(
        t("onboarding.template.editor.toast.clone_success") ??
          "Đã tạo bản sao thành công",
      );
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setCloneModalOpen(false);
      if (newId) navigate(`/onboarding/templates/${newId}`);
      else navigate("/onboarding/templates");
    } catch {
      message.error(
        t("onboarding.template.editor.toast.clone_failed") ??
          "Tạo bản sao thất bại",
      );
    } finally {
      setIsCloning(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      message.warning(t("onboarding.template.editor.toast.name_required"));
      nameInputRef.current?.focus();
      return;
    }
    const createdBy = currentUser?.id ?? "";
    if (!createdBy) {
      message.warning(t("onboarding.template.editor.toast.login_required"));
      return;
    }
    try {
      if (isCreate) {
        const payload = buildPayload(form, createdBy);
        const res = await saveTemplate.mutateAsync(payload);
        const newTemplateId = extractTemplateId(res);
        message.success(t("onboarding.template.editor.toast.created"));
        queryClient.invalidateQueries({ queryKey: ["templates"] });
        if (newTemplateId) {
          navigate(`/onboarding/templates/${newTemplateId}`, { replace: true });
        } else {
          navigate("/onboarding/templates");
        }
        return;
      } else {
        const payload = buildUpdatePayload(form, templateId!);
        await updateTemplate.mutateAsync(payload);
        message.success(t("onboarding.template.editor.toast.updated"));
      }
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      navigate("/onboarding/templates");
    } catch {
      message.error(
        isCreate
          ? t("onboarding.template.editor.toast.create_failed")
          : t("onboarding.template.editor.toast.update_failed"),
      );
    }
  };

  const handleActivateTemplate = () => {
    if (isCreate || !templateId) return;
    if (!nameValid) {
      message.warning(t("onboarding.template.editor.toast.name_required"));
      nameInputRef.current?.focus();
      return;
    }
    if (form.checklists.length === 0 || totalTasks === 0) {
      message.warning(
        t("onboarding.template.editor.toast.activate_requires_tasks"),
      );
      return;
    }
    if (validationWarnings.length > 0) {
      message.warning(t("onboarding.template.editor.toast.resolve_warnings"));
      return;
    }

    const isDraft = normalizedTemplateStatus === "DRAFT";
    const copy = isDraft
      ? {
          title: t("onboarding.template.publish.title"),
          content: t("onboarding.template.publish.message", {
            name: form.name || t("onboarding.template.card.untitled"),
          }),
          okText: t("onboarding.template.publish.confirm"),
          successMessage: t("onboarding.template.toast.published"),
          errorMessage: t("onboarding.template.toast.publish_failed"),
        }
      : {
          title: t("onboarding.template.activate.title"),
          content: t("onboarding.template.activate.message", {
            name: form.name || t("onboarding.template.card.untitled"),
          }),
          okText: t("onboarding.template.activate.confirm"),
          successMessage: t("onboarding.template.toast.activated"),
          errorMessage: t("onboarding.template.toast.activate_failed"),
        };

    Modal.confirm({
      title: copy.title,
      content: copy.content,
      okText: copy.okText,
      cancelText: t("onboarding.template.editor.btn.cancel"),
      onOk: async () => {
        try {
          await updateTemplate.mutateAsync(
            buildUpdatePayload(form, templateId, "ACTIVE"),
          );
          setTemplateStatus("ACTIVE");
          queryClient.invalidateQueries({ queryKey: ["templates"] });
          queryClient.invalidateQueries({ queryKey: ["template", templateId] });
          message.success(copy.successMessage);
        } catch {
          message.error(copy.errorMessage);
        }
      },
    });
  };

  const isSaving = saveTemplate.isPending || updateTemplate.isPending;

  if (!isCreate && isLoadingTemplate) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col gap-5 pb-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Left: back + name + description */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/onboarding/templates")}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0" style={{ maxWidth: 520 }}>
            {/* Name row */}
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className={`group relative flex-1 min-w-0 border-b pb-0.5 transition-colors ${
                  isReadOnly
                    ? "border-transparent"
                    : !nameValid
                      ? "border-red-400"
                      : "border-transparent focus-within:border-brand/50"
                }`}
              >
                <input
                  ref={nameInputRef}
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  readOnly={isReadOnly}
                  placeholder={t(
                    "onboarding.template.editor.header.name_placeholder",
                  )}
                  className={`w-full bg-transparent text-xl font-bold text-ink placeholder:text-muted/30 focus:outline-none ${
                    isReadOnly ? "cursor-default opacity-80" : ""
                  }`}
                />
              </div>
              {!isCreate && templateStatus && (
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    STATUS_BADGE[templateStatus] ?? STATUS_BADGE["DRAFT"]
                  }`}
                >
                  {templateStatus}
                </span>
              )}
            </div>

            {/* Name validation */}
            {!nameValid && !isReadOnly && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                <span className="inline-block h-1 w-1 rounded-full bg-red-400" />
                {t("onboarding.template.editor.toast.name_required")}
              </p>
            )}

            {/* Description */}
            <textarea
              ref={descRef}
              value={form.description ?? ""}
              onChange={(e) => updateForm({ description: e.target.value })}
              readOnly={isReadOnly}
              placeholder={t(
                "onboarding.template.editor.header.desc_placeholder",
              )}
              rows={1}
              maxLength={500}
              className={`mt-2 w-full resize-none border-none bg-transparent text-sm leading-relaxed text-muted placeholder:text-muted/30 focus:outline-none ${
                isReadOnly ? "cursor-default" : ""
              }`}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
            />
          </div>
        </div>

        {/* Right: stats + actions */}
        <div className="flex shrink-0 items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
            <span>
              {form.checklists.length}{" "}
              {t("onboarding.template.review.stages")?.toLowerCase() ??
                "giai đoạn"}
            </span>
            <span className="text-slate-300">·</span>
            <span>
              {totalTasks}{" "}
              {t("onboarding.template.review.tasks")?.toLowerCase() ??
                "nhiệm vụ"}
            </span>
          </div>

          {/* Browse Library — always visible when not read-only */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setLibraryDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand/40 hover:text-brand"
            >
              <BookOpen className="h-3.5 w-3.5" />
              {t("onboarding.template.library.button") ?? "Thư viện"}
            </button>
          )}

          {!isCreate && (
            <button
              type="button"
              onClick={() => {
                setCloneName(`Copy of ${form.name}`);
                setCloneModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand/40 hover:text-brand"
            >
              <Copy className="h-3.5 w-3.5" />
              {t("onboarding.template.editor.btn.clone") ?? "Clone"}
            </button>
          )}

          {!isCreate && normalizedTemplateStatus !== "ACTIVE" && (
            <button
              type="button"
              onClick={handleActivateTemplate}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg border border-brand/20 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10 disabled:opacity-50"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              {normalizedTemplateStatus === "DRAFT"
                ? t("onboarding.template.action.publish")
                : t("onboarding.template.action.activate")}
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSave || isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {isCreate
                  ? t("onboarding.template.editor.btn.creating")
                  : t("onboarding.template.editor.btn.saving")}
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                {isCreate
                  ? t("onboarding.template.editor.btn.create_draft")
                  : t("onboarding.template.editor.btn.save")}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Inline validation warnings ── */}
      {validationWarnings.length > 0 && (
        <div className="flex flex-col gap-1">
          {validationWarnings.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5"
            >
              <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="text-xs text-amber-700">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Pipeline canvas ── */}
      <div className="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div
          className="flex items-start gap-2 overflow-x-auto pb-2"
          style={{ minHeight: 500 }}
        >
          {form.checklists.length === 0 && !isReadOnly ? (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-xl border border-dashed border-slate-300 bg-white py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand/5 ring-1 ring-brand/10">
                <Plus className="h-9 w-9 text-brand/40" />
              </div>
              <div>
                <p className="text-base font-semibold text-ink">
                  {t("onboarding.template.editor.empty.title")}
                </p>
                <p className="mt-1.5 text-sm text-muted">
                  {t("onboarding.template.editor.empty.hint")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStagePickerOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/5 px-6 py-3 text-sm font-semibold text-brand shadow-sm transition hover:bg-brand/10 hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                {t("onboarding.template.editor.add_stage")}
              </button>
            </div>
          ) : (
            <>
              {form.checklists.map((checklist, ci) => (
                <div key={checklist.id} className="flex shrink-0 items-start">
                  <StageColumn
                    checklist={checklist}
                    checklistIndex={ci}
                    readOnly={isReadOnly}
                    onAddTask={() => openNewTaskDrawer(ci)}
                    onEditTask={(ti) => openEditTaskDrawer(ci, ti)}
                    onCloneTask={(ti) => cloneTask(ci, ti)}
                    onDeleteTask={(ti) => deleteTask(ci, ti)}
                    onReorderTasks={(from, to) => reorderTasks(ci, from, to)}
                    onRenameStage={(name) => updateChecklist(ci, { name })}
                    onCloneStage={() => cloneChecklist(ci)}
                    onDeleteStage={() => removeChecklist(ci)}
                  />
                  {/* Connector */}
                  {ci < form.checklists.length - 1 && (
                    <div className="flex h-[58px] shrink-0 items-center px-1">
                      <div className="flex items-center gap-0.5 text-slate-300">
                        <div className="h-px w-4 bg-slate-300" />
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add stage button */}
              {!isReadOnly && (
                <div className="flex shrink-0 items-start">
                  {form.checklists.length > 0 && (
                    <div className="flex h-[58px] shrink-0 items-center px-1">
                      <div className="flex items-center gap-0.5 text-slate-200">
                        <div className="h-px w-4 bg-slate-200" />
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setStagePickerOpen(true)}
                    className="flex h-[58px] w-[220px] shrink-0 items-center justify-center gap-2 self-start rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 text-sm font-semibold text-muted transition hover:border-brand/50 hover:bg-brand/5 hover:text-brand"
                  >
                    <Plus className="h-4 w-4" />
                    {t("onboarding.template.editor.pipeline.add_stage")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals & drawers ── */}

      {/* Stage picker */}
      <StagePickerModal
        open={stagePickerOpen}
        usedStages={
          form.checklists
            .map((c) => c.stageType as StageType)
            .filter(Boolean) as StageType[]
        }
        onCancel={() => setStagePickerOpen(false)}
        onPick={addChecklistFromMeta}
      />

      {/* Clone modal */}
      <Modal
        open={cloneModalOpen}
        title={
          <span className="flex items-center gap-2">
            <Copy className="h-4 w-4" />{" "}
            {t("onboarding.template.editor.clone.modal_title") ??
              "Clone Template"}
          </span>
        }
        onCancel={() => setCloneModalOpen(false)}
        onOk={handleCloneTemplate}
        okText={t("onboarding.template.editor.clone.ok_text") ?? "Tạo bản sao"}
        confirmLoading={isCloning}
        okButtonProps={{ disabled: !cloneName.trim() }}
        destroyOnClose
      >
        <p className="mb-3 text-sm text-gray-600">
          {t("onboarding.template.editor.clone.name_hint") ??
            "Nhập tên cho bản sao:"}
        </p>
        <AntInput
          value={cloneName}
          onChange={(e) => setCloneName(e.target.value)}
          placeholder={
            t("onboarding.template.editor.clone.name_placeholder") ??
            "Tên template mới..."
          }
          autoFocus
          onPressEnter={handleCloneTemplate}
        />
      </Modal>

      {/* Task edit drawer */}
      <TaskEditDrawer
        open={drawerOpen}
        state={drawerState}
        readOnly={isReadOnly}
        onClose={() => setDrawerOpen(false)}
        onSave={handleDrawerSave}
        onDelete={handleDrawerDelete}
        onClone={handleDrawerClone}
      />

      {/* Task library drawer */}
      <TaskLibraryDrawer
        open={libraryDrawerOpen}
        checklists={form.checklists}
        onAddTasks={handleAddFromLibrary}
        onClose={() => setLibraryDrawerOpen(false)}
      />
    </div>
  );
};

export default TemplateEditor;

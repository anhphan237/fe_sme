import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Eye,
  FileText,
  Lock,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Tag,
  Typography,
  message,
} from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { useLocale } from "@/i18n";
import { useGlobalStore } from "@/stores/global.store";
import { useUserStore } from "@/stores/user.store";
import {
  apiListTemplates,
  apiGetTemplate,
  apiUpdateTemplate,
  apiGenerateTemplateWithAI,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapTemplate } from "@/utils/mappers/onboarding";
import type { OnboardingTemplate } from "@/shared/types";
import MyTable from "@/components/table";

// ── Types ─────────────────────────────────────────────────────────────────────

export type StatusFilter = "ACTIVE" | "INACTIVE" | "";

// ── Helper: extract full template from gateway response ───────────────────────

const extractTemplateFromRes = (res: unknown): OnboardingTemplate => {
  const r = res as Record<string, unknown>;
  const raw = r?.template ?? r?.data ?? r?.result ?? r?.payload ?? res;
  return mapTemplate(
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
  );
};

// ── StatusBadge ───────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status?: string }) => {
  const { t } = useLocale();
  const isActive = (status ?? "").toUpperCase() === "ACTIVE";
  return (
    <Tag
      color={isActive ? "success" : "default"}
      className="inline-flex items-center gap-1">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
      />
      {isActive
        ? t("onboarding.template.status.active")
        : t("onboarding.template.status.inactive")}
    </Tag>
  );
};

// ── Templates (page) ──────────────────────────────────────────────────────────

const Templates = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  useGlobalStore((s) => s.setBreadcrumbs);

  // ── Role detection ───────────────────────────────────────────────────────
  const currentUser = useUserStore((s) => s.currentUser);
  const userRoles = (currentUser?.roles ?? []) as string[];
  const isHR = userRoles.includes("HR");
  const isReadOnly = !isHR;

  // ── State ────────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [searchText, setSearchText] = useState<string>("");
  const [cloneSourceId, setCloneSourceId] = useState<string>();
  const [aiOpen, setAiOpen] = useState(false);
  const [viewTemplate, setViewTemplate] = useState<OnboardingTemplate | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OnboardingTemplate | null>(null);
  /** Tracks which row is showing a loading state (by templateId) */
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [aiForm] = Form.useForm<{
    industry: string;
    companySize: string;
    jobRole: string;
  }>();
  const [editForm] = Form.useForm<{
    name: string;
    description: string;
    status: string;
  }>();

  // ── List query (status-filtered; search is client-side) ──────────────────
  const {
    data: rawData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["templates", statusFilter],
    queryFn: () => apiListTemplates({ status: statusFilter }),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "templates",
        "items",
        "list",
      ).map(mapTemplate) as OnboardingTemplate[],
  });

  // Client-side name filter
  const data = useMemo(() => {
    if (!searchText.trim()) return rawData ?? [];
    const lower = searchText.toLowerCase();
    return (rawData ?? []).filter((tmpl) =>
      tmpl.name.toLowerCase().includes(lower),
    );
  }, [rawData, searchText]);

  // ── i18n option lists ────────────────────────────────────────────────────
  const industryOptions = useMemo(
    () => [
      {
        value: "technology",
        label: t("onboarding.template.ai.industry.technology"),
      },
      { value: "retail", label: t("onboarding.template.ai.industry.retail") },
      {
        value: "manufacturing",
        label: t("onboarding.template.ai.industry.manufacturing"),
      },
      {
        value: "services",
        label: t("onboarding.template.ai.industry.services"),
      },
      { value: "finance", label: t("onboarding.template.ai.industry.finance") },
      {
        value: "healthcare",
        label: t("onboarding.template.ai.industry.healthcare"),
      },
      {
        value: "education",
        label: t("onboarding.template.ai.industry.education"),
      },
      {
        value: "construction",
        label: t("onboarding.template.ai.industry.construction"),
      },
      {
        value: "logistics",
        label: t("onboarding.template.ai.industry.logistics"),
      },
      { value: "other", label: t("onboarding.template.ai.industry.other") },
    ],
    [t],
  );

  const companySizeOptions = useMemo(
    () => [
      { value: "STARTUP", label: t("onboarding.template.ai.size.startup") },
      { value: "SME", label: t("onboarding.template.ai.size.sme") },
      {
        value: "ENTERPRISE",
        label: t("onboarding.template.ai.size.enterprise"),
      },
    ],
    [t],
  );

  const statusOptions = [
    { value: "", label: t("onboarding.template.filter.all") },
    { value: "ACTIVE", label: t("onboarding.template.filter.active") },
    { value: "INACTIVE", label: t("onboarding.template.filter.inactive") },
  ];

  const statusEditOptions = [
    { value: "ACTIVE", label: t("onboarding.template.filter.active") },
    { value: "INACTIVE", label: t("onboarding.template.filter.inactive") },
  ];

  // ── Shared fetch helper ──────────────────────────────────────────────────
  const fetchFull = useCallback(
    async (id: string): Promise<OnboardingTemplate> => {
      const res = await apiGetTemplate(id);
      return extractTemplateFromRes(res);
    },
    [],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleNewTemplate = useCallback(
    () => navigate("/onboarding/templates/new"),
    [navigate],
  );

  /** Navigate to full template editor for editing */
  const handleEdit = useCallback(
    (tmpl: OnboardingTemplate) => {
      navigate(`/onboarding/templates/${tmpl.id}`);
    },
    [navigate],
  );

  /** Fetch full template (with stages/tasks) before navigating to wizard */
  const handleDuplicate = useCallback(
    async (tmpl: OnboardingTemplate) => {
      setLoadingId(tmpl.id);
      try {
        const full = await fetchFull(tmpl.id);
        navigate("/onboarding/templates/new", {
          state: { duplicateFrom: full },
        });
      } catch {
        message.error(t("onboarding.template.error.something_wrong"));
      } finally {
        setLoadingId(null);
      }
    },
    [fetchFull, navigate, t],
  );

  /** Fetch full template before opening view modal for managers */
  const handleViewDetails = useCallback(
    async (tmpl: OnboardingTemplate) => {
      setLoadingId(tmpl.id);
      try {
        const full = await fetchFull(tmpl.id);
        setViewTemplate(full);
      } catch {
        message.error(t("onboarding.template.error.something_wrong"));
      } finally {
        setLoadingId(null);
      }
    },
    [fetchFull, t],
  );

  // ── Edit mutation ────────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: (values: {
      name: string;
      description: string;
      status: string;
    }) => apiUpdateTemplate({ templateId: editTarget!.id, ...values }),
    onSuccess: () => {
      setEditOpen(false);
      setEditTarget(null);
      editForm.resetFields();
      refetch();
      message.success(t("onboarding.template.action.edit_success"));
    },
    onError: () => {
      message.error(t("onboarding.template.action.edit_failed"));
    },
  });

  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields();
      editMutation.mutate(values);
    } catch {
      /* antd validation error */
    }
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setEditTarget(null);
    editForm.resetFields();
  };

  // ── Clone picker ─────────────────────────────────────────────────────────
  const templateOptions = (rawData ?? []).map((tmpl) => ({
    value: tmpl.id,
    label: tmpl.name,
  }));

  const handleCloneFromPicker = async () => {
    if (!cloneSourceId) {
      message.warning(t("onboarding.template.clone.select_required"));
      return;
    }
    const source = (rawData ?? []).find((t) => t.id === cloneSourceId);
    if (!source) return;
    await handleDuplicate(source);
  };

  // ── AI generate mutation ─────────────────────────────────────────────────
  const aiGenerateMutation = useMutation({
    mutationFn: (values: {
      industry: string;
      companySize: string;
      jobRole: string;
    }) => apiGenerateTemplateWithAI(values),
    onSuccess: async (result: any) => {
      setAiOpen(false);
      aiForm.resetFields();
      if (result?.templateId) {
        try {
          // Fetch the AI-created template so user can review it in the wizard
          const full = await fetchFull(result.templateId);
          navigate("/onboarding/templates/new", {
            state: { duplicateFrom: full },
          });
          message.info(t("onboarding.template.ai.modal.review_hint"));
        } catch {
          // Fallback: just refresh the list
          refetch();
          message.success(
            t("onboarding.template.ai.modal.generated_detail", {
              name: result?.name ?? "",
              stages: result?.totalChecklists ?? 0,
              tasks: result?.totalTasks ?? 0,
            }),
          );
        }
      } else {
        refetch();
      }
    },
    onError: () => {
      message.error(t("onboarding.template.ai.modal.error"));
    },
  });

  const handleAIGenerate = async () => {
    try {
      const values = await aiForm.validateFields();
      aiGenerateMutation.mutate(values);
    } catch {
      /* validation failed */
    }
  };

  // ── Table columns ────────────────────────────────────────────────────────

  const nameColumn = {
    title: t("onboarding.template.col.name"),
    key: "name",
    render: (_: unknown, tmpl: OnboardingTemplate) => {
      const isActive = (tmpl.status ?? "ACTIVE").toUpperCase() === "ACTIVE";
      return (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              isActive ? "bg-brand/10" : "bg-slate-100"
            }`}>
            <FileText
              className={`h-4.5 w-4.5 ${isActive ? "text-brand" : "text-slate-400"}`}
            />
          </div>
          <span className="truncate text-sm font-semibold text-ink">
            {tmpl.name}
          </span>
        </div>
      );
    },
  };

  const statusColumn = {
    title: t("onboarding.template.col.status"),
    key: "status",
    width: 120,
    render: (_: unknown, tmpl: OnboardingTemplate) => (
      <StatusBadge status={tmpl.status} />
    ),
  };

  const actionsColumn: ColumnsType<OnboardingTemplate>[number] = {
    title: t("onboarding.template.col.actions"),
    key: "actions",
    width: isHR ? 200 : 140,
    render: (_: unknown, tmpl: OnboardingTemplate) => {
      const busy = loadingId === tmpl.id;
      return isHR ? (
        <div className="flex items-center justify-end gap-2">
          <Button size="small" loading={busy} onClick={() => handleEdit(tmpl)}>
            {t("onboarding.template.action.edit")}
          </Button>
          <Button
            size="small"
            disabled={busy}
            onClick={() => handleDuplicate(tmpl)}>
            {t("onboarding.template.action.duplicate")}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <Button
            size="small"
            loading={busy}
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => handleViewDetails(tmpl)}>
            {t("onboarding.template.action.view_details")}
          </Button>
        </div>
      );
    },
  };

  const columns: ColumnsType<OnboardingTemplate> = [
    nameColumn,
    statusColumn,
    actionsColumn,
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Read-only banner for non-HR roles */}
      {isReadOnly && (
        <Alert
          data-testid="readonly-banner"
          type="info"
          icon={<Lock className="h-4 w-4" />}
          showIcon
          title={
            <span className="font-medium text-sm">
              {t("onboarding.template.readonly.badge")}
            </span>
          }
          description={t("onboarding.template.readonly.hint")}
          className="rounded-xl"
        />
      )}

      {/* Command cards — HR only */}
      {isHR && (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            {/* New from scratch */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("onboarding.template.command.new_title")}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {t("onboarding.template.command.new_desc")}
              </p>
              <Button
                type="primary"
                className="mt-3"
                onClick={handleNewTemplate}>
                {t("onboarding.template.action.new")}
              </Button>
            </div>

            {/* Clone existing */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("onboarding.template.command.clone_title")}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {t("onboarding.template.command.clone_desc")}
              </p>
              <div className="mt-3 flex gap-2">
                <Select
                  placeholder={t("onboarding.template.clone.placeholder")}
                  value={cloneSourceId}
                  onChange={setCloneSourceId}
                  options={templateOptions}
                  className="min-w-0 flex-1"
                  showSearch
                  optionFilterProp="label"
                />
                <Button
                  loading={!!loadingId && loadingId === cloneSourceId}
                  onClick={handleCloneFromPicker}>
                  {t("onboarding.template.action.duplicate")}
                </Button>
              </div>
            </div>

            {/* AI generate */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                {t("onboarding.template.command.ai_title")}
              </p>
              <p className="mt-1 text-sm text-blue-800/80">
                {t("onboarding.template.command.ai_desc")}
              </p>
              <Button className="mt-3" onClick={() => setAiOpen(true)}>
                <WandSparkles className="mr-1 h-3.5 w-3.5" />
                {t("onboarding.template.ai.open")}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Typography.Text type="secondary">
              {t("onboarding.template.command.hint")}
            </Typography.Text>
            <div className="flex items-center gap-2">
              <Input.Search
                placeholder={t("onboarding.template.search.placeholder")}
                allowClear
                className="w-72"
                onSearch={(v) => setSearchText(v.trim())}
                onChange={(e) => {
                  if (!e.target.value) setSearchText("");
                }}
              />
              <Select<StatusFilter>
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="w-36"
              />
            </div>
          </div>
        </>
      )}

      {/* Search + filter row for read-only roles */}
      {isReadOnly && (
        <div className="flex justify-end items-center gap-2">
          <Input.Search
            placeholder={t("onboarding.template.search.placeholder")}
            allowClear
            className="w-72"
            onSearch={(v) => setSearchText(v.trim())}
            onChange={(e) => {
              if (!e.target.value) setSearchText("");
            }}
          />
          <Select<StatusFilter>
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="w-36"
          />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <p className="flex-1 text-sm text-red-700">
            {(error as Error)?.message ??
              t("onboarding.template.error.something_wrong")}
          </p>
          <Button size="small" onClick={() => refetch()}>
            {t("onboarding.template.error.retry")}
          </Button>
        </div>
      )}

      <MyTable<OnboardingTemplate>
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={isLoading}
        wrapClassName="!h-full w-full"
        pagination={false}
        locale={{
          emptyText: (
            <div className="flex flex-col items-center gap-4 py-8">
              <Empty
                description={
                  statusFilter === "INACTIVE"
                    ? t("onboarding.template.empty.inactive_title")
                    : t("onboarding.template.empty.active_title")
                }
              />
              {statusFilter !== "INACTIVE" && isHR && (
                <Button type="primary" onClick={handleNewTemplate}>
                  {t("onboarding.template.action.new")}
                </Button>
              )}
            </div>
          ),
        }}
      />

      {/* ── AI Generate modal ─────────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>{t("onboarding.template.ai.modal.generate_title")}</span>
          </div>
        }
        open={aiOpen}
        onCancel={() => {
          setAiOpen(false);
          aiForm.resetFields();
        }}
        footer={null}
        width={520}>
        <div className="pt-2">
          <Typography.Text type="secondary" className="text-xs block mb-4">
            {t("onboarding.template.ai.modal.generate_hint")}
          </Typography.Text>
          <Form form={aiForm} layout="vertical" requiredMark={false}>
            <Form.Item
              name="industry"
              label={t("onboarding.template.ai.modal.industry_label")}
              rules={[
                {
                  required: true,
                  message: t("onboarding.template.ai.modal.industry_required"),
                },
              ]}>
              <Select
                placeholder={t(
                  "onboarding.template.ai.modal.industry_placeholder",
                )}
                options={industryOptions}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item
              name="companySize"
              label={t("onboarding.template.ai.modal.size_label")}
              rules={[
                {
                  required: true,
                  message: t("onboarding.template.ai.modal.size_required"),
                },
              ]}>
              <Select
                placeholder={t("onboarding.template.ai.modal.size_placeholder")}
                options={companySizeOptions}
              />
            </Form.Item>
            <Form.Item
              name="jobRole"
              label={t("onboarding.template.ai.modal.role_label")}
              rules={[
                {
                  required: true,
                  message: t("onboarding.template.ai.modal.role_required"),
                },
              ]}>
              <Input
                placeholder={t("onboarding.template.ai.modal.role_placeholder")}
              />
            </Form.Item>
          </Form>
          <div className="flex items-center justify-end gap-2 mt-2">
            <Button
              onClick={() => {
                setAiOpen(false);
                aiForm.resetFields();
              }}>
              {t("onboarding.template.ai.modal.cancel")}
            </Button>
            <Button
              type="primary"
              loading={aiGenerateMutation.isPending}
              onClick={handleAIGenerate}
              icon={<WandSparkles className="h-3.5 w-3.5" />}>
              {aiGenerateMutation.isPending
                ? t("onboarding.template.ai.modal.generating")
                : t("onboarding.template.ai.modal.submit")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit template (metadata only) modal — HR only ─────────────────── */}
      <Modal
        title={t("onboarding.template.edit_modal.title")}
        open={editOpen}
        onCancel={handleCloseEdit}
        onOk={handleEditSave}
        okText={t("onboarding.template.edit_modal.save")}
        cancelText={t("onboarding.template.ai.modal.cancel")}
        confirmLoading={editMutation.isPending}
        width={480}
        destroyOnClose>
        <div className="py-2">
          <Form form={editForm} layout="vertical" requiredMark={false}>
            <Form.Item
              name="name"
              label={t("onboarding.template.editor.step_info.name_label")}
              rules={[
                {
                  required: true,
                  message: t("onboarding.template.editor.toast.name_required"),
                },
              ]}>
              <Input
                placeholder={t(
                  "onboarding.template.editor.step_info.name_placeholder",
                )}
              />
            </Form.Item>
            <Form.Item
              name="description"
              label={t("onboarding.template.editor.step_info.desc_label")}>
              <Input.TextArea
                rows={3}
                maxLength={500}
                showCount
                placeholder={t(
                  "onboarding.template.editor.step_info.desc_placeholder",
                )}
              />
            </Form.Item>
            <Form.Item
              name="status"
              label={t("onboarding.template.col.status")}>
              <Select options={statusEditOptions} />
            </Form.Item>
          </Form>
          <Typography.Text type="secondary" className="text-xs mt-1 block">
            {t("onboarding.template.edit_modal.structure_hint")}
          </Typography.Text>
        </div>
      </Modal>

      {/* ── Template detail modal — Manager read-only view ────────────────── */}
      <Modal
        title={t("onboarding.template.view_modal.title")}
        open={!!viewTemplate}
        onCancel={() => setViewTemplate(null)}
        footer={
          <Button onClick={() => setViewTemplate(null)}>
            {t("onboarding.template.view_modal.close")}
          </Button>
        }
        width={480}>
        {viewTemplate && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">
                {viewTemplate.name}
              </span>
              <StatusBadge status={viewTemplate.status} />
            </div>
            {viewTemplate.description && (
              <p className="text-sm text-muted">{viewTemplate.description}</p>
            )}
            <div className="space-y-2">
              {(viewTemplate.stages ?? []).length === 0 ? (
                <p className="text-sm text-muted italic">
                  {t("onboarding.template.view_modal.no_stages")}
                </p>
              ) : (
                viewTemplate.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">
                        {stage.name}
                      </span>
                      <span className="text-xs text-muted">
                        {t("onboarding.template.view_modal.tasks_count", {
                          count: stage.tasks?.length ?? 0,
                        })}
                      </span>
                    </div>
                    {(stage.tasks ?? []).length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {stage.tasks.map((task) => (
                          <li
                            key={task.id}
                            className="text-xs text-muted flex items-start gap-1.5">
                            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                            {task.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Templates;

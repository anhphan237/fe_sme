import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Eye, FileText, Info, Lock, Sparkles, WandSparkles } from "lucide-react";
import { Alert, Button, Empty, Form, Modal, Select, Tag, Typography, message } from "antd";
import Input from "antd/es/input";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { useLocale } from "@/i18n";
import { useGlobalStore } from "@/stores/global.store";
import { useUserStore } from "@/stores/user.store";
import { apiListTemplates, apiGenerateTemplateWithAI } from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapTemplate } from "@/utils/mappers/onboarding";
import type { OnboardingTemplate } from "@/shared/types";
import MyTable from "@/components/table";

// ── Types & constants ────────────────────────────────────────────────────────

export type StatusFilter = "ACTIVE" | "INACTIVE" | "";

// ── StatusBadge ──────────────────────────────────────────────────────────────

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

// ── Templates (page) ─────────────────────────────────────────────────────────

const Templates = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const setBreadcrumbs = useGlobalStore((s) => s.setBreadcrumbs);

  // ── Role detection ──────────────────────────────────────────────────────
  const currentUser = useUserStore((s) => s.currentUser);
  const userRoles = (currentUser?.roles ?? []) as string[];
  const isHR = userRoles.includes("HR");
  const isReadOnly = !isHR;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [searchText, setSearchText] = useState<string>("");
  const [cloneSourceId, setCloneSourceId] = useState<string>();
  const [aiOpen, setAiOpen] = useState(false);
  const [viewTemplate, setViewTemplate] = useState<OnboardingTemplate | null>(null);
  const [aiForm] = Form.useForm<{ industry: string; companySize: string; jobRole: string }>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["templates", statusFilter, searchText],
    queryFn: () =>
      apiListTemplates({
        status: statusFilter,
        search: searchText || undefined,
      }),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "templates",
        "items",
        "list",
      ).map(mapTemplate) as OnboardingTemplate[],
  });

  // ── i18n-driven option lists ────────────────────────────────────────────
  const industryOptions = useMemo(
    () => [
      { value: "technology", label: t("onboarding.template.ai.industry.technology") },
      { value: "retail", label: t("onboarding.template.ai.industry.retail") },
      { value: "manufacturing", label: t("onboarding.template.ai.industry.manufacturing") },
      { value: "services", label: t("onboarding.template.ai.industry.services") },
      { value: "finance", label: t("onboarding.template.ai.industry.finance") },
      { value: "healthcare", label: t("onboarding.template.ai.industry.healthcare") },
      { value: "education", label: t("onboarding.template.ai.industry.education") },
      { value: "construction", label: t("onboarding.template.ai.industry.construction") },
      { value: "logistics", label: t("onboarding.template.ai.industry.logistics") },
      { value: "other", label: t("onboarding.template.ai.industry.other") },
    ],
    [t],
  );

  const companySizeOptions = useMemo(
    () => [
      { value: "STARTUP", label: t("onboarding.template.ai.size.startup") },
      { value: "SME", label: t("onboarding.template.ai.size.sme") },
      { value: "ENTERPRISE", label: t("onboarding.template.ai.size.enterprise") },
    ],
    [t],
  );

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleEdit = useCallback(
    (tmpl: OnboardingTemplate) => {
      setBreadcrumbs({ [tmpl.id]: tmpl.name });
      navigate(`/onboarding/templates/${tmpl.id}`);
    },
    [navigate, setBreadcrumbs],
  );

  const handleNewTemplate = useCallback(
    () => navigate("/onboarding/templates/new"),
    [navigate],
  );

  const handleDuplicate = useCallback(
    (tmpl: OnboardingTemplate) => {
      navigate("/onboarding/templates/new", {
        state: { duplicateFrom: tmpl },
      });
    },
    [navigate],
  );

  const aiGenerateMutation = useMutation({
    mutationFn: (values: { industry: string; companySize: string; jobRole: string }) =>
      apiGenerateTemplateWithAI(values),
    onSuccess: (result: any) => {
      setAiOpen(false);
      aiForm.resetFields();
      refetch();
      message.success(
        t("onboarding.template.ai.modal.generated_detail", {
          name: result?.name ?? "",
          stages: result?.totalChecklists ?? 0,
          tasks: result?.totalTasks ?? 0,
        }),
      );
    },
    onError: () => {
      message.error(t("onboarding.template.ai.modal.error"));
    },
  });

  const templateOptions = (data ?? []).map((tmpl) => ({
    value: tmpl.id,
    label: tmpl.name,
  }));

  const selectedTemplateToClone = (data ?? []).find(
    (tmpl) => tmpl.id === cloneSourceId,
  );

  const handleCloneFromPicker = () => {
    if (!selectedTemplateToClone) {
      message.warning(t("onboarding.template.clone.select_required"));
      return;
    }
    handleDuplicate(selectedTemplateToClone);
  };

  const handleAIGenerate = async () => {
    try {
      const values = await aiForm.validateFields();
      aiGenerateMutation.mutate(values);
    } catch {
      /* validation failed */
    }
  };

  const statusOptions = [
    { value: "", label: t("onboarding.template.filter.all") },
    { value: "ACTIVE", label: t("onboarding.template.filter.active") },
    { value: "INACTIVE", label: t("onboarding.template.filter.inactive") },
  ];

  // ── Columns (role-aware) ────────────────────────────────────────────────

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
          <div className="min-w-0">
            {isHR ? (
              <button
                type="button"
                onClick={() => handleEdit(tmpl)}
                className="truncate text-sm font-semibold text-ink hover:text-brand hover:underline cursor-pointer">
                {tmpl.name}
              </button>
            ) : (
              <span className="truncate text-sm font-semibold text-ink">
                {tmpl.name}
              </span>
            )}
            {tmpl.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                {tmpl.description}
              </p>
            ) : (
              <p className="mt-0.5 text-xs italic text-muted/40">—</p>
            )}
          </div>
        </div>
      );
    },
  };

  const stagesColumn = {
    title: t("onboarding.template.col.stages"),
    key: "stages",
    responsive: ["sm", "md", "lg", "xl", "xxl"] as any,
    render: (_: unknown, tmpl: OnboardingTemplate) => {
      const stagesCount = tmpl.stages?.length ?? 0;
      return (
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-muted">
          {stagesCount > 0
            ? t("onboarding.template.stages_count", { count: stagesCount })
            : t("onboarding.template.no_stages")}
        </span>
      );
    },
  };

  const statusColumn = {
    title: t("onboarding.template.col.status"),
    key: "status",
    responsive: ["sm", "md", "lg", "xl", "xxl"] as any,
    render: (_: unknown, tmpl: OnboardingTemplate) => (
      <StatusBadge status={tmpl.status} />
    ),
  };

  const updatedAtColumn = {
    title: t("onboarding.template.col.updated_at"),
    key: "updatedAt",
    responsive: ["lg", "xl", "xxl"] as any,
    render: (_: unknown, tmpl: OnboardingTemplate) => {
      const formattedDate = tmpl.updatedAt
        ? new Date(tmpl.updatedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "—";
      return <span className="text-sm text-muted">{formattedDate}</span>;
    },
  };

  // HR gets full CRUD actions; MANAGER/others get read-only "View details"
  const actionsColumn = {
    title: t("onboarding.template.col.actions"),
    key: "actions",
    width: isHR ? 220 : 140,
    render: (_: unknown, tmpl: OnboardingTemplate) =>
      isHR ? (
        <div className="flex items-center justify-end gap-2">
          <Button size="small" onClick={() => handleEdit(tmpl)}>
            {t("onboarding.template.action.edit")}
          </Button>
          <Button size="small" onClick={() => handleDuplicate(tmpl)}>
            {t("onboarding.template.action.duplicate")}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-end">
          <Button
            size="small"
            icon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setViewTemplate(tmpl)}>
            {t("onboarding.template.action.view_details")}
          </Button>
        </div>
      ),
  };

  const columns: ColumnsType<OnboardingTemplate> = [
    nameColumn,
    stagesColumn,
    statusColumn,
    updatedAtColumn,
    actionsColumn,
  ];

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
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("onboarding.template.command.new_title")}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {t("onboarding.template.command.new_desc")}
              </p>
              <Button type="primary" className="mt-3" onClick={handleNewTemplate}>
                {t("onboarding.template.action.new")}
              </Button>
            </div>

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
                <Button onClick={handleCloneFromPicker}>
                  {t("onboarding.template.action.duplicate")}
                </Button>
              </div>
            </div>

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

          <div className="flex justify-between items-center gap-2">
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

      {/* Search + filter row for MANAGER (no command cards) */}
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
              {/* Only HR sees the "create" CTA in empty state */}
              {statusFilter !== "INACTIVE" && isHR && (
                <Button type="primary" onClick={handleNewTemplate}>
                  {t("onboarding.template.action.new")}
                </Button>
              )}
            </div>
          ),
        }}
      />

      {/* AI Generate modal — HR only */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span>{t("onboarding.template.ai.modal.generate_title")}</span>
          </div>
        }
        open={aiOpen}
        onCancel={() => { setAiOpen(false); aiForm.resetFields(); }}
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
              rules={[{ required: true, message: t("onboarding.template.ai.modal.industry_required") }]}>
              <Select
                placeholder={t("onboarding.template.ai.modal.industry_placeholder")}
                options={industryOptions}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Form.Item
              name="companySize"
              label={t("onboarding.template.ai.modal.size_label")}
              rules={[{ required: true, message: t("onboarding.template.ai.modal.size_required") }]}>
              <Select
                placeholder={t("onboarding.template.ai.modal.size_placeholder")}
                options={companySizeOptions}
              />
            </Form.Item>
            <Form.Item
              name="jobRole"
              label={t("onboarding.template.ai.modal.role_label")}
              rules={[{ required: true, message: t("onboarding.template.ai.modal.role_required") }]}>
              <Input placeholder={t("onboarding.template.ai.modal.role_placeholder")} />
            </Form.Item>
          </Form>
          <div className="flex items-center justify-end gap-2 mt-2">
            <Button onClick={() => { setAiOpen(false); aiForm.resetFields(); }}>
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

      {/* Template detail modal — MANAGER read-only view */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500" />
            <span>{t("onboarding.template.view_modal.title")}</span>
          </div>
        }
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
              <span className="text-sm font-semibold text-ink">{viewTemplate.name}</span>
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

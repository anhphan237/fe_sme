import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileText, Sparkles, WandSparkles } from "lucide-react";
import { Button, Empty, Modal, Select, Tag, Typography, message } from "antd";
import Input from "antd/es/input";
import TextArea from "antd/es/input/TextArea";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { useLocale } from "@/i18n";
import { useGlobalStore } from "@/stores/global.store";
import { apiListTemplates } from "@/api/onboarding/onboarding.api";
import { apiChatbotAsk } from "@/api/chatbot/chatbot.api";
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

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [searchText, setSearchText] = useState<string>("");
  const [cloneSourceId, setCloneSourceId] = useState<string>();
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDraft, setAiDraft] = useState("");

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

  const handleEdit = useCallback(
    (tmpl: OnboardingTemplate) => {
      setBreadcrumbs({ [tmpl.id]: tmpl.name });
      navigate(`/onboarding/hr/templates/${tmpl.id}`);
    },
    [navigate, setBreadcrumbs],
  );

  const handleNewTemplate = useCallback(
    () => navigate("/onboarding/hr/templates/new"),
    [navigate],
  );

  const handleDuplicate = useCallback(
    (tmpl: OnboardingTemplate) => {
      navigate("/onboarding/hr/templates/new", {
        state: { duplicateFrom: tmpl },
      });
    },
    [navigate],
  );

  const aiSuggestMutation = useMutation({
    mutationFn: (prompt: string) => apiChatbotAsk({ query: prompt }),
    onSuccess: (result) => {
      setAiDraft(result.answer ?? "");
      message.success(t("onboarding.template.ai.toast.generated"));
    },
    onError: () => {
      message.error(t("onboarding.template.ai.toast.failed"));
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

  const handleAskAi = () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      message.warning(t("onboarding.template.ai.prompt_required"));
      return;
    }
    aiSuggestMutation.mutate(prompt);
  };

  const handleCreateFromAi = () => {
    if (!aiDraft.trim()) {
      message.warning(t("onboarding.template.ai.no_result"));
      return;
    }
    navigate("/onboarding/hr/templates/new", {
      state: {
        aiSuggestion: aiDraft,
      },
    });
  };

  const statusOptions = [
    { value: "", label: t("onboarding.template.filter.all") },
    { value: "ACTIVE", label: t("onboarding.template.filter.active") },
    { value: "INACTIVE", label: t("onboarding.template.filter.inactive") },
  ];

  const columns: ColumnsType<OnboardingTemplate> = [
    {
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
              <button
                type="button"
                onClick={() => handleEdit(tmpl)}
                className="truncate text-sm font-semibold text-ink hover:text-brand hover:underline cursor-pointer">
                {tmpl.name}
              </button>
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
    },
    {
      title: t("onboarding.template.col.stages"),
      key: "stages",
      responsive: ["sm", "md", "lg", "xl", "xxl"],
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
    },
    {
      title: t("onboarding.template.col.status"),
      key: "status",
      responsive: ["sm", "md", "lg", "xl", "xxl"],
      render: (_: unknown, tmpl: OnboardingTemplate) => (
        <StatusBadge status={tmpl.status} />
      ),
    },
    {
      title: t("onboarding.template.col.updated_at"),
      key: "updatedAt",
      responsive: ["lg", "xl", "xxl"],
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
    },
    {
      title: t("onboarding.template.col.actions"),
      key: "actions",
      width: 220,
      render: (_: unknown, tmpl: OnboardingTemplate) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="small" onClick={() => handleEdit(tmpl)}>
            {t("onboarding.template.action.edit")}
          </Button>
          <Button size="small" onClick={() => handleDuplicate(tmpl)}>
            {t("onboarding.template.action.duplicate")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col gap-4">
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
              {statusFilter !== "INACTIVE" && (
                <Button type="primary" onClick={handleNewTemplate}>
                  {t("onboarding.template.action.new")}
                </Button>
              )}
            </div>
          ),
        }}
      />

      <Modal
        title={t("onboarding.template.ai.modal_title")}
        open={aiOpen}
        onCancel={() => setAiOpen(false)}
        footer={null}
        width={760}>
        <div className="space-y-3">
          <TextArea
            rows={4}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={t("onboarding.template.ai.prompt_placeholder")}
          />
          <div className="flex items-center justify-between gap-2">
            <Typography.Text type="secondary" className="text-xs">
              {t("onboarding.template.ai.flow_hint")}
            </Typography.Text>
            <Button
              type="primary"
              loading={aiSuggestMutation.isPending}
              onClick={handleAskAi}>
              {t("onboarding.template.ai.generate")}
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Typography.Text className="text-xs font-semibold text-slate-600">
              {t("onboarding.template.ai.result_title")}
            </Typography.Text>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-white p-3 text-xs text-slate-700">
              {aiDraft || t("onboarding.template.ai.result_empty")}
            </pre>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={() => setAiOpen(false)}>
              {t("onboarding.template.ai.close")}
            </Button>
            <Button type="primary" onClick={handleCreateFromAi}>
              {t("onboarding.template.ai.create_from_result")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Templates;

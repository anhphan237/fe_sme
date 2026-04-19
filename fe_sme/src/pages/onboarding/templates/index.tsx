import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronDown,
  Copy,
  Eye,
  FileText,
  LayoutGrid,
  List as ListIcon,
  Lock,
  Pencil,
  Plus,
  Power,
  Search as SearchIcon,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import {
  Alert,
  Button,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { MenuProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { StageChip } from "./editor/StagePicker";
import { STAGE_ACCENTS, getStageMeta } from "./editor/constants";

// ── Types ─────────────────────────────────────────────────────────────────────

export type StatusFilter = "ACTIVE" | "INACTIVE" | "";
type ViewMode = "grid" | "list";

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
      className="inline-flex items-center gap-1 !m-0">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-slate-400"
        }`}
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [searchText, setSearchText] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
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

  const {
    data: rawData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["templates", "all"],
    queryFn: () => apiListTemplates({ status: "" }),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "templates",
        "items",
        "list",
      ).map(mapTemplate) as OnboardingTemplate[],
  });

  // Derived: stats
  const stats = useMemo(() => {
    const list = rawData ?? [];
    const active = list.filter(
      (tmpl) => (tmpl.status ?? "").toUpperCase() === "ACTIVE",
    ).length;
    return {
      total: list.length,
      active,
      inactive: list.length - active,
    };
  }, [rawData]);

  // Derived: filtered list (status + search)
  const data = useMemo(() => {
    let list = rawData ?? [];
    if (statusFilter) {
      list = list.filter(
        (tmpl) => (tmpl.status ?? "").toUpperCase() === statusFilter,
      );
    }
    const q = searchText.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (tmpl) =>
          tmpl.name.toLowerCase().includes(q) ||
          (tmpl.description ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [rawData, statusFilter, searchText]);

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

  /** Navigate to full template editor for editing structure */
  const handleEditStructure = useCallback(
    (tmpl: OnboardingTemplate) => {
      navigate(`/onboarding/templates/${tmpl.id}`);
    },
    [navigate],
  );

  /** Open the quick-edit modal for metadata-only changes */
  const handleQuickEdit = useCallback(
    async (tmpl: OnboardingTemplate) => {
      setLoadingId(tmpl.id);
      try {
        // Refresh metadata from the server so description is always current.
        const full = await fetchFull(tmpl.id);
        setEditTarget(full);
        editForm.setFieldsValue({
          name: full.name ?? "",
          description: full.description ?? "",
          status: (full.status ?? "ACTIVE").toUpperCase(),
        });
        setEditOpen(true);
      } catch {
        message.error(t("onboarding.template.error.something_wrong"));
      } finally {
        setLoadingId(null);
      }
    },
    [editForm, fetchFull, t],
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

  /** Fetch full template before opening view modal */
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

  // ── Edit mutation (metadata only — BE ignores checklists on update) ──────
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

  // ── Toggle status (activate / deactivate) ────────────────────────────────
  const toggleStatusMutation = useMutation({
    mutationFn: ({
      templateId,
      status,
    }: {
      templateId: string;
      status: string;
    }) => apiUpdateTemplate({ templateId, status }),
    onSuccess: (_, { status }) => {
      refetch();
      message.success(
        status === "INACTIVE"
          ? t("onboarding.template.toast.deactivated")
          : t("onboarding.template.toast.activated"),
      );
    },
    onError: (_, { status }) => {
      message.error(
        status === "INACTIVE"
          ? t("onboarding.template.toast.deactivate_failed")
          : t("onboarding.template.toast.activate_failed"),
      );
    },
  });

  const handleToggleStatus = useCallback(
    (tmpl: OnboardingTemplate) => {
      const isActive = (tmpl.status ?? "ACTIVE").toUpperCase() === "ACTIVE";
      const newStatus = isActive ? "INACTIVE" : "ACTIVE";
      Modal.confirm({
        title: isActive
          ? t("onboarding.template.deactivate.title")
          : t("onboarding.template.activate.title"),
        content: isActive
          ? t("onboarding.template.deactivate.message", { name: tmpl.name })
          : t("onboarding.template.activate.message", { name: tmpl.name }),
        okText: isActive
          ? t("onboarding.template.deactivate.confirm")
          : t("onboarding.template.activate.confirm"),
        cancelText: t("onboarding.template.ai.modal.cancel"),
        okButtonProps: { danger: isActive },
        onOk: async () => {
          setLoadingId(tmpl.id);
          try {
            await toggleStatusMutation.mutateAsync({
              templateId: tmpl.id,
              status: newStatus,
            });
          } finally {
            setLoadingId(null);
          }
        },
      });
    },
    [t, toggleStatusMutation],
  );

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
          const full = await fetchFull(result.templateId);
          navigate("/onboarding/templates/new", {
            state: { duplicateFrom: full },
          });
          message.info(t("onboarding.template.ai.modal.review_hint"));
        } catch {
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

  // ── Card actions menu (HR, used in grid view) ────────────────────────────
  const buildActionMenu = (tmpl: OnboardingTemplate): MenuProps["items"] => {
    const isActive = (tmpl.status ?? "ACTIVE").toUpperCase() === "ACTIVE";
    return [
      {
        key: "quick-edit",
        label: t("onboarding.template.action.quick_edit"),
        icon: <Pencil className="h-3.5 w-3.5" />,
        onClick: () => handleQuickEdit(tmpl),
      },
      {
        key: "edit-structure",
        label: t("onboarding.template.action.edit_structure"),
        icon: <FileText className="h-3.5 w-3.5" />,
        onClick: () => handleEditStructure(tmpl),
      },
      {
        key: "duplicate",
        label: t("onboarding.template.action.duplicate"),
        icon: <Copy className="h-3.5 w-3.5" />,
        onClick: () => handleDuplicate(tmpl),
      },
      { type: "divider" as const },
      {
        key: "view",
        label: t("onboarding.template.action.view_details"),
        icon: <Eye className="h-3.5 w-3.5" />,
        onClick: () => handleViewDetails(tmpl),
      },
      { type: "divider" as const },
      {
        key: "toggle-status",
        label: isActive
          ? t("onboarding.template.action.deactivate")
          : t("onboarding.template.action.activate"),
        icon: <Power className="h-3.5 w-3.5" />,
        danger: isActive,
        onClick: () => handleToggleStatus(tmpl),
      },
    ];
  };

  // ── Table columns (list view) ────────────────────────────────────────────

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
    width: 140,
    render: (_: unknown, tmpl: OnboardingTemplate) => (
      <StatusBadge status={tmpl.status} />
    ),
  };

  const actionsColumn: ColumnsType<OnboardingTemplate>[number] = {
    title: t("onboarding.template.col.actions"),
    key: "actions",
    width: isHR ? 300 : 160,
    render: (_: unknown, tmpl: OnboardingTemplate) => {
      const busy = loadingId === tmpl.id;
      const isActive = (tmpl.status ?? "ACTIVE").toUpperCase() === "ACTIVE";
      return isHR ? (
        <div className="flex items-center justify-end gap-2">
          <Tooltip title={t("onboarding.template.action.quick_edit")}>
            <Button
              size="small"
              icon={<Pencil className="h-3.5 w-3.5" />}
              loading={busy}
              onClick={() => handleQuickEdit(tmpl)}
            />
          </Tooltip>
          <Button size="small" onClick={() => handleEditStructure(tmpl)}>
            {t("onboarding.template.action.edit_structure")}
          </Button>
          <Tooltip title={t("onboarding.template.action.duplicate")}>
            <Button
              size="small"
              icon={<Copy className="h-3.5 w-3.5" />}
              disabled={busy}
              onClick={() => handleDuplicate(tmpl)}
            />
          </Tooltip>
          <Tooltip title={t("onboarding.template.action.view_details")}>
            <Button
              size="small"
              icon={<Eye className="h-3.5 w-3.5" />}
              loading={busy}
              onClick={() => handleViewDetails(tmpl)}
            />
          </Tooltip>
          <Tooltip
            title={
              isActive
                ? t("onboarding.template.action.deactivate")
                : t("onboarding.template.action.activate")
            }>
            <Button
              size="small"
              danger={isActive}
              icon={<Power className="h-3.5 w-3.5" />}
              loading={busy}
              onClick={() => handleToggleStatus(tmpl)}
            />
          </Tooltip>
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

  // ── Render helpers ───────────────────────────────────────────────────────

  const renderStatCard = (
    label: string,
    value: number,
    tone: "ink" | "brand" | "muted",
  ) => (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-semibold leading-tight ${
          tone === "brand"
            ? "text-brand"
            : tone === "muted"
              ? "text-slate-400"
              : "text-ink"
        }`}>
        {value}
      </p>
    </div>
  );

  const renderCard = (tmpl: OnboardingTemplate) => {
    const isActive = (tmpl.status ?? "ACTIVE").toUpperCase() === "ACTIVE";
    const busy = loadingId === tmpl.id;
    const primaryAction = isHR ? (
      <Button
        size="small"
        type="primary"
        ghost
        icon={<Pencil className="h-3.5 w-3.5" />}
        loading={busy}
        onClick={() => handleQuickEdit(tmpl)}>
        {t("onboarding.template.action.quick_edit")}
      </Button>
    ) : (
      <Button
        size="small"
        type="primary"
        ghost
        icon={<Eye className="h-3.5 w-3.5" />}
        loading={busy}
        onClick={() => handleViewDetails(tmpl)}>
        {t("onboarding.template.action.view_details")}
      </Button>
    );

    return (
      <div
        key={tmpl.id}
        className={`group relative flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
          isActive ? "border-slate-200" : "border-slate-200 opacity-90"
        }`}>
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isActive ? "bg-brand/10" : "bg-slate-100"
            }`}>
            <FileText
              className={`h-5 w-5 ${isActive ? "text-brand" : "text-slate-400"}`}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {tmpl.name || t("onboarding.template.card.untitled")}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={tmpl.status} />
            </div>
          </div>
          {isHR && (
            <Dropdown
              trigger={["click"]}
              menu={{ items: buildActionMenu(tmpl) }}
              placement="bottomRight">
              <Button
                size="small"
                type="text"
                icon={<ChevronDown className="h-3.5 w-3.5" />}
                aria-label="actions"
              />
            </Dropdown>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="font-mono">#{tmpl.id.slice(0, 6)}</span>
          </div>
          <div className="flex items-center gap-2">
            {isHR && (
              <Tooltip title={t("onboarding.template.action.duplicate")}>
                <Button
                  size="small"
                  icon={<Copy className="h-3.5 w-3.5" />}
                  disabled={busy}
                  onClick={() => handleDuplicate(tmpl)}
                />
              </Tooltip>
            )}
            <Tooltip title={t("onboarding.template.action.view_details")}>
              <Button
                size="small"
                icon={<Eye className="h-3.5 w-3.5" />}
                loading={busy}
                onClick={() => handleViewDetails(tmpl)}
              />
            </Tooltip>
            {primaryAction}
          </div>
        </div>
      </div>
    );
  };

  const renderGrid = () => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {data.map(renderCard)}
    </div>
  );

  const renderLoadingGrid = () => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 bg-white p-4">
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-16">
      <Empty
        description={
          statusFilter === "INACTIVE"
            ? t("onboarding.template.empty.inactive_title")
            : t("onboarding.template.empty.active_title")
        }
      />
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Read-only banner for non-HR roles */}
      {isReadOnly && (
        <Alert
          data-testid="readonly-banner"
          type="info"
          icon={<Lock className="h-4 w-4" />}
          showIcon
          message={
            <span className="font-medium text-sm">
              {t("onboarding.template.readonly.badge")}
            </span>
          }
          description={t("onboarding.template.readonly.hint")}
          className="rounded-xl"
        />
      )}

      {/* Hero header — title + primary actions */}
      {isHR && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="primary"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={handleNewTemplate}>
            {t("onboarding.template.action.new")}
          </Button>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {renderStatCard(
          t("onboarding.template.stats.total"),
          stats.total,
          "ink",
        )}
        {renderStatCard(
          t("onboarding.template.stats.active"),
          stats.active,
          "brand",
        )}
        {renderStatCard(
          t("onboarding.template.stats.inactive"),
          stats.inactive,
          "muted",
        )}
      </div>

      {/* Search + filter + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            prefix={<SearchIcon className="h-3.5 w-3.5 text-slate-400" />}
            placeholder={t("onboarding.template.search.placeholder")}
            allowClear
            className="w-72"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select<StatusFilter>
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              viewMode === "grid"
                ? "bg-brand/10 text-brand"
                : "text-slate-500 hover:bg-slate-50"
            }`}>
            <LayoutGrid className="h-3.5 w-3.5" />
            {t("onboarding.template.view.grid")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
              viewMode === "list"
                ? "bg-brand/10 text-brand"
                : "text-slate-500 hover:bg-slate-50"
            }`}>
            <ListIcon className="h-3.5 w-3.5" />
            {t("onboarding.template.view.list")}
          </button>
        </div>
      </div>

      {/* Error banner */}
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

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          renderLoadingGrid()
        ) : data.length === 0 ? (
          renderEmpty()
        ) : viewMode === "grid" ? (
          renderGrid()
        ) : (
          <MyTable<OnboardingTemplate>
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={isLoading}
            wrapClassName="!h-full w-full"
            pagination={false}
          />
        )}
      </div>
      <Modal
        title={t("onboarding.template.edit_modal.title")}
        open={editOpen}
        onCancel={handleCloseEdit}
        onOk={handleEditSave}
        okText={t("onboarding.template.edit_modal.save")}
        cancelText={t("onboarding.template.ai.modal.cancel")}
        confirmLoading={editMutation.isPending}
        width={520}
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
          <Alert
            type="info"
            showIcon
            message={t("onboarding.template.edit_modal.structure_hint")}
            className="rounded-lg"
          />
        </div>
      </Modal>

      <Modal
        title={t("onboarding.template.view_modal.title")}
        open={!!viewTemplate}
        onCancel={() => setViewTemplate(null)}
        footer={
          <Button onClick={() => setViewTemplate(null)}>
            {t("onboarding.template.view_modal.close")}
          </Button>
        }
        width={560}>
        {viewTemplate && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {viewTemplate.name}
                </p>
                {viewTemplate.description && (
                  <p className="mt-1 text-sm text-muted">
                    {viewTemplate.description}
                  </p>
                )}
              </div>
              <StatusBadge status={viewTemplate.status} />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {t("onboarding.template.view_modal.stages_count", {
                  count: viewTemplate.stages.length,
                })}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                {t("onboarding.template.view_modal.tasks_count", {
                  count: viewTemplate.stages.reduce(
                    (sum, s) => sum + (s.tasks?.length ?? 0),
                    0,
                  ),
                })}
              </span>
            </div>

            <div className="max-h-[55vh] overflow-y-auto pr-1">
              {(viewTemplate.stages ?? []).length === 0 ? (
                <p className="text-sm text-muted italic">
                  {t("onboarding.template.view_modal.no_stages")}
                </p>
              ) : (
                <ol className="relative space-y-2.5 border-l border-slate-200 pl-4">
                  {viewTemplate.stages.map((stage) => {
                    const meta = getStageMeta(stage.stageType);
                    const accent = STAGE_ACCENTS[meta.accent];
                    return (
                      <li key={stage.id} className="relative">
                        <span
                          className={`absolute -left-[20px] top-2 h-2 w-2 rounded-full ring-2 ring-white ${accent.dot}`}
                        />
                        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-3 py-2">
                            <StageChip stage={stage.stageType} size="xs" />
                            <span className="text-xs font-semibold text-ink">
                              {stage.name ||
                                t(
                                  "onboarding.template.editor.step_tasks.stage_fallback",
                                )}
                            </span>
                            <span
                              className={`text-[10px] font-semibold uppercase tracking-wider ${accent.text}`}>
                              {t(meta.phaseKey)}
                            </span>
                            <span className="ml-auto text-[11px] text-muted">
                              {t("onboarding.template.view_modal.tasks_count", {
                                count: stage.tasks?.length ?? 0,
                              })}
                            </span>
                          </div>
                          {(stage.tasks ?? []).length > 0 && (
                            <ul className="divide-y divide-slate-100">
                              {stage.tasks.map((task) => (
                                <li
                                  key={task.id}
                                  className="flex items-start gap-2 px-3 py-1.5 text-xs text-slate-700">
                                  <span
                                    className={`mt-1 h-1 w-1 shrink-0 rounded-full ${accent.dot}`}
                                  />
                                  {task.title}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Templates;

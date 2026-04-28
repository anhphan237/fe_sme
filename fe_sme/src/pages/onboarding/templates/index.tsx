import { useState, useCallback, useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search as SearchIcon,
  XCircle,
} from "lucide-react";
import {
  Button,
  Dropdown,
  Empty,
  Input,
  Modal,
  Select,
  Skeleton,
  Tag,
  Tooltip,
  message,
} from "antd";
import type { MenuProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import {
  apiListTemplates,
  apiUpdateTemplate,
  apiCloneTemplate,
} from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import { mapTemplate } from "@/utils/mappers/onboarding";
import type { OnboardingTemplate } from "@/shared/types";
import MyTable from "@/components/table";

// ── Types ─────────────────────────────────────────────────────────────────────

export type StatusFilter = "ACTIVE" | "INACTIVE" | "DRAFT" | "";
type ViewMode = "grid" | "list";


const normalizeTemplateStatus = (
  status?: string,
): "ACTIVE" | "INACTIVE" | "DRAFT" => {
  const normalized = (status ?? "DRAFT").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "INACTIVE") return normalized;
  return "DRAFT";
};

// ── StatusBadge ───────────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status?: string }) => {
  const { t } = useLocale();
  const normalizedStatus = normalizeTemplateStatus(status);
  const colorMap = {
    ACTIVE: "success",
    DRAFT: "warning",
    INACTIVE: "default",
  } as const;
  const dotMap = {
    ACTIVE: "bg-emerald-500",
    DRAFT: "bg-amber-500",
    INACTIVE: "bg-slate-400",
  } as const;
  const labelMap = {
    ACTIVE: t("onboarding.template.status.active"),
    DRAFT: t("onboarding.template.status.draft"),
    INACTIVE: t("onboarding.template.status.inactive"),
  } as const;

  return (
    <Tag
      color={colorMap[normalizedStatus]}
      className="inline-flex items-center gap-1 !m-0"
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${dotMap[normalizedStatus]}`}
      />
      {labelMap[normalizedStatus]}
    </Tag>
  );
};

// ── Templates (page) ──────────────────────────────────────────────────────────

const Templates = () => {
  const navigate = useNavigate();
  const { t } = useLocale();

  const currentUser = useUserStore((s) => s.currentUser);
  const userRoles = (currentUser?.roles ?? []) as string[];
  const isHR = userRoles.includes("HR");

  // ── State ────────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [searchText, setSearchText] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [loadingId, setLoadingId] = useState<string | null>(null);

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
      (tmpl) => normalizeTemplateStatus(tmpl.status) === "ACTIVE",
    ).length;
    const draft = list.filter(
      (tmpl) => normalizeTemplateStatus(tmpl.status) === "DRAFT",
    ).length;
    return {
      total: list.length,
      active,
      draft,
      inactive: list.length - active - draft,
    };
  }, [rawData]);

  // Derived: filtered list (status + search)
  const data = useMemo(() => {
    let list = rawData ?? [];
    if (statusFilter) {
      list = list.filter(
        (tmpl) => normalizeTemplateStatus(tmpl.status) === statusFilter,
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

  const statusOptions = [
    { value: "", label: t("onboarding.template.filter.all") },
    { value: "DRAFT", label: t("onboarding.template.filter.draft") },
    { value: "ACTIVE", label: t("onboarding.template.filter.active") },
    { value: "INACTIVE", label: t("onboarding.template.filter.inactive") },
  ];

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

  /** Clone template via API — shows confirmation with editable name */
  const handleDuplicate = useCallback(
    (tmpl: OnboardingTemplate) => {
      const defaultName = `Copy of ${tmpl.name}`;
      Modal.confirm({
        title: t("onboarding.template.action.duplicate"),
        content: (
          <Input
            id="clone-name-input"
            defaultValue={defaultName}
            onPressEnter={() => {
              // Allow pressing enter to confirm via the input
              const el = document.getElementById(
                "clone-name-input",
              ) as HTMLInputElement | null;
              if (el) el.blur();
            }}
          />
        ),
        okText: t("onboarding.template.action.duplicate_confirm") ?? "Sao chép",
        cancelText: t("global.cancel") ?? "Huỷ",
        onOk: async () => {
          const el = document.getElementById(
            "clone-name-input",
          ) as HTMLInputElement | null;
          const name = el?.value?.trim() || defaultName;
          setLoadingId(tmpl.id);
          try {
            await apiCloneTemplate({ sourceTemplateId: tmpl.id, name });
            refetch();
            message.success(
              t("onboarding.template.action.duplicate_success") ??
                "Đã sao chép template",
            );
          } catch (err) {
            message.error(
              err instanceof Error
                ? err.message
                : (t("onboarding.template.error.something_wrong") ??
                    "Đã xảy ra lỗi"),
            );
          } finally {
            setLoadingId(null);
          }
        },
      });
    },
    [refetch, t],
  );

  // ── Toggle status (activate / deactivate) ────────────────────────────────
  const toggleStatusMutation = useMutation({
    mutationFn: ({
      templateId,
      status,
    }: {
      templateId: string;
      status: string;
    }) => apiUpdateTemplate({ templateId, status }),
  });

  const getStatusAction = useCallback(
    (tmpl: OnboardingTemplate) => {
      const status = normalizeTemplateStatus(tmpl.status);
      if (status === "ACTIVE") {
        return {
          nextStatus: "INACTIVE",
          title: t("onboarding.template.deactivate.title"),
          content: t("onboarding.template.deactivate.message", {
            name: tmpl.name,
          }),
          okText: t("onboarding.template.deactivate.confirm"),
          successMessage: t("onboarding.template.toast.deactivated"),
          errorMessage: t("onboarding.template.toast.deactivate_failed"),
          danger: true,
          label: t("onboarding.template.action.deactivate"),
        };
      }

      if (status === "DRAFT") {
        return {
          nextStatus: "ACTIVE",
          title: t("onboarding.template.publish.title"),
          content: t("onboarding.template.publish.message", {
            name: tmpl.name,
          }),
          okText: t("onboarding.template.publish.confirm"),
          successMessage: t("onboarding.template.toast.published"),
          errorMessage: t("onboarding.template.toast.publish_failed"),
          danger: false,
          label: t("onboarding.template.action.publish"),
        };
      }

      return {
        nextStatus: "ACTIVE",
        title: t("onboarding.template.activate.title"),
        content: t("onboarding.template.activate.message", {
          name: tmpl.name,
        }),
        okText: t("onboarding.template.activate.confirm"),
        successMessage: t("onboarding.template.toast.activated"),
        errorMessage: t("onboarding.template.toast.activate_failed"),
        danger: false,
        label: t("onboarding.template.action.activate"),
      };
    },
    [t],
  );

  const handleToggleStatus = useCallback(
    (tmpl: OnboardingTemplate) => {
      const action = getStatusAction(tmpl);
      Modal.confirm({
        title: action.title,
        content: action.content,
        okText: action.okText,
        cancelText: t("onboarding.template.ai.modal.cancel"),
        okButtonProps: { danger: action.danger },
        onOk: async () => {
          setLoadingId(tmpl.id);
          try {
            await toggleStatusMutation.mutateAsync({
              templateId: tmpl.id,
              status: action.nextStatus,
            });
            refetch();
            message.success(action.successMessage);
          } catch {
            message.error(action.errorMessage);
          } finally {
            setLoadingId(null);
          }
        },
      });
    },
    [getStatusAction, refetch, t, toggleStatusMutation],
  );

  // ── Card overflow menu (HR — less common actions) ───────────────────────
  const buildOverflowMenu = (tmpl: OnboardingTemplate): MenuProps["items"] => {
    const action = getStatusAction(tmpl);
    return [
      {
        key: "duplicate",
        label: t("onboarding.template.action.duplicate"),
        icon: <Copy className="h-3.5 w-3.5" />,
        onClick: () => handleDuplicate(tmpl),
      },
      { type: "divider" as const },
      {
        key: "toggle-status",
        label: action.label,
        icon: <Power className="h-3.5 w-3.5" />,
        danger: action.danger,
        onClick: () => handleToggleStatus(tmpl),
      },
    ];
  };

  // ── Table columns (list view) ────────────────────────────────────────────

  const nameColumn = {
    title: t("onboarding.template.col.name"),
    key: "name",
    render: (_: unknown, tmpl: OnboardingTemplate) => {
      const isActive = normalizeTemplateStatus(tmpl.status) === "ACTIVE";
      const busy = loadingId === tmpl.id;
      const handleClick = () => {
        handleEditStructure(tmpl);
      };
      return (
        <button
          type="button"
          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity disabled:opacity-50"
          onClick={handleClick}
          disabled={busy}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              isActive ? "bg-brand/10" : "bg-slate-100"
            }`}
          >
            <FileText
              className={`h-4.5 w-4.5 ${isActive ? "text-brand" : "text-slate-400"}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-ink hover:text-brand transition-colors">
              {tmpl.name}
            </span>
            {tmpl.level === "PLATFORM" && (
              <Tag color="purple" className="!m-0 !text-[10px]">
                PLATFORM
              </Tag>
            )}
          </div>
        </button>
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
    width: isHR ? 200 : 140,
    render: (_: unknown, tmpl: OnboardingTemplate) => {
      return (
        <div className="flex items-center justify-end gap-1.5">
          <Dropdown
            trigger={["click"]}
            menu={{ items: buildOverflowMenu(tmpl) }}
            placement="bottomRight"
          >
            <Button
              size="small"
              icon={<MoreHorizontal className="h-3.5 w-3.5" />}
              aria-label="more actions"
            />
          </Dropdown>
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
    icon: ReactNode,
  ) => (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          tone === "brand" ? "bg-brand/10" : "bg-slate-100"
        }`}
      >
        <span
          className={
            tone === "brand"
              ? "text-brand"
              : tone === "muted"
                ? "text-slate-400"
                : "text-slate-600"
          }
        >
          {icon}
        </span>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p
          className={`mt-0.5 text-2xl font-semibold leading-tight ${
            tone === "brand"
              ? "text-brand"
              : tone === "muted"
                ? "text-slate-400"
                : "text-ink"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );

  const renderCard = (tmpl: OnboardingTemplate) => {
    const status = normalizeTemplateStatus(tmpl.status);
    const isActive = status === "ACTIVE";
    const isDraft = status === "DRAFT";
    const isInactive = status === "INACTIVE";
    const busy = loadingId === tmpl.id;

    const handleCardClick = () => {
      handleEditStructure(tmpl);
    };

    const accentBorder = isDraft
      ? "border-amber-300/60"
      : isActive
        ? "border-brand/20"
        : "border-slate-200";

    const accentBar = isDraft
      ? "bg-amber-400"
      : isActive
        ? "bg-brand"
        : "bg-slate-300";

    const iconBg = isActive
      ? "bg-brand/10"
      : isDraft
        ? "bg-amber-50"
        : "bg-slate-100";

    const iconColor = isActive
      ? "text-brand"
      : isDraft
        ? "text-amber-500"
        : "text-slate-400";

    return (
      <div
        key={tmpl.id}
        className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${accentBorder} ${isInactive ? "opacity-70" : ""}`}
      >
        {/* Top accent bar */}
        <div
          className={`h-0.5 w-full ${accentBar} transition-all duration-200 group-hover:h-[3px]`}
        />
        {/* Card body — fully clickable */}
        <button
          type="button"
          className="flex flex-1 flex-col gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-inset"
          onClick={handleCardClick}
          disabled={busy}
        >
          {/* Header row: icon + title + action buttons */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/[0.04] transition-transform duration-200 group-hover:scale-105 ${iconBg}`}
            >
              {busy ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50" />
              ) : (
                <FileText className={`h-5 w-5 ${iconColor}`} />
              )}
            </div>

            {/* Title + badges */}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="truncate text-[13.5px] font-semibold leading-snug text-ink transition-colors duration-150 group-hover:text-brand">
                {tmpl.name || t("onboarding.template.card.untitled")}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <StatusBadge status={tmpl.status} />
                {tmpl.level === "PLATFORM" && (
                  <Tag
                    color="purple"
                    className="!m-0 !text-[10px] !leading-none"
                  >
                    PLATFORM
                  </Tag>
                )}
              </div>
            </div>
            <div
              className="flex shrink-0 items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              {isHR ? (
                <Dropdown
                  trigger={["click"]}
                  menu={{ items: buildOverflowMenu(tmpl) }}
                  placement="bottomRight"
                >
                  <Button
                    type="text"
                    size="small"
                    className="!text-slate-300 hover:!text-slate-600"
                    icon={<MoreHorizontal className="h-3.5 w-3.5" />}
                    aria-label="more actions"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              ) : (
                <Tooltip title={t("onboarding.template.action.view_details")}>
                  <Button
                    type="text"
                    size="small"
                    className="!text-slate-300 hover:!text-brand"
                    icon={<Eye className="h-3.5 w-3.5" />}
                    loading={busy}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                </Tooltip>
              )}
            </div>
          </div>

          {/* Description */}
          {tmpl.description ? (
            <p className="line-clamp-2 text-[11.5px] leading-relaxed text-slate-500">
              {tmpl.description}
            </p>
          ) : (
            <p className="text-[11.5px] italic text-slate-300">
              {t("onboarding.template.card.no_description")}
            </p>
          )}
        </button>
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
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
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
            : statusFilter === "DRAFT"
              ? t("onboarding.template.empty.draft_title")
              : t("onboarding.template.empty.active_title")
        }
      />
      {isHR && !statusFilter && (
        <div className="flex items-center gap-2">
          <Button
            icon={<Plus className="h-3.5 w-3.5" />}
            type="primary"
            onClick={handleNewTemplate}
          >
            {t("onboarding.template.action.new")}
          </Button>
        </div>
      )}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Page header — title + primary actions */}
      <div className="flex items-start justify-end  gap-4">
        {isHR && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="primary"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={handleNewTemplate}
            >
              {t("onboarding.template.action.new")}
            </Button>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {renderStatCard(
          t("onboarding.template.stats.total"),
          stats.total,
          "ink",
          <FileText className="h-4.5 w-4.5" />,
        )}
        {renderStatCard(
          t("onboarding.template.stats.active"),
          stats.active,
          "brand",
          <CheckCircle2 className="h-4.5 w-4.5" />,
        )}
        {renderStatCard(
          t("onboarding.template.stats.draft"),
          stats.draft,
          "ink",
          <Pencil className="h-4.5 w-4.5" />,
        )}
        {renderStatCard(
          t("onboarding.template.stats.inactive"),
          stats.inactive,
          "muted",
          <XCircle className="h-4.5 w-4.5" />,
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
            }`}
          >
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
            }`}
          >
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
    </div>
  );
};

export default Templates;

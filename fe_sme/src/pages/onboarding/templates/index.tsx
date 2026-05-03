import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Clock3,
  Copy,
  Eye,
  FileText,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Sparkles,
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
import { apiCloneTemplate, apiListTemplates, apiUpdateTemplate } from "@/api/onboarding/onboarding.api";
import { extractList } from "@/api/core/types";
import MyTable from "@/components/table";
import { useLocale } from "@/i18n";
import type { OnboardingTemplate } from "@/shared/types";
import { useUserStore } from "@/stores/user.store";
import { formatDate } from "@/utils/format-datetime";
import { mapTemplate } from "@/utils/mappers/onboarding";

export type StatusFilter = "ACTIVE" | "INACTIVE" | "DRAFT" | "";
type TemplateStatus = Exclude<StatusFilter, "">;
type ViewMode = "grid" | "list";
type SourceView = "TENANT" | "PLATFORM";

const TENANT_LEVEL = "TENANT" as const;
const PLATFORM_LEVEL = "PLATFORM" as const;
const TENANT_LIST_STATUSES: TemplateStatus[] = ["ACTIVE", "DRAFT", "INACTIVE"];

type TemplateLevel = typeof TENANT_LEVEL | typeof PLATFORM_LEVEL;

const extractTemplatesByLevel = (res: unknown, level: TemplateLevel) =>
  extractList(res as Record<string, unknown>, "templates", "items", "list")
    .map(mapTemplate)
    .filter((template) => (template.level ?? level) === level);

const dedupeTemplates = (templates: OnboardingTemplate[]): OnboardingTemplate[] => {
  const byId = new Map<string, OnboardingTemplate>();
  const withoutId: OnboardingTemplate[] = [];

  templates.forEach((template) => {
    if (template.id) {
      byId.set(template.id, template);
      return;
    }
    withoutId.push(template);
  });

  return [...byId.values(), ...withoutId];
};

const matchesTemplateSearch = (template: OnboardingTemplate, query: string) => {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;

  return (
    template.name.toLowerCase().includes(keyword) ||
    (template.description ?? "").toLowerCase().includes(keyword) ||
    (template.templateKind ?? "").toLowerCase().includes(keyword)
  );
};

const normalizeTemplateStatus = (status?: string): TemplateStatus => {
  const normalized = (status ?? "DRAFT").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "INACTIVE") return normalized;
  return "DRAFT";
};

const getStageCount = (template: OnboardingTemplate): number | undefined =>
  template.checklistCount ?? (template.stages.length > 0 ? template.stages.length : undefined);

const getTaskCount = (template: OnboardingTemplate): number | undefined =>
  template.taskCount ??
  (template.stages.length > 0
    ? template.stages.reduce((sum, stage) => sum + (stage.tasks?.length ?? 0), 0)
    : undefined);

const formatMetric = (value?: number) => (typeof value === "number" ? value : "--");

const getTemplateKindLabel = (templateKind?: string): string => {
  if (!templateKind) return "ONBOARDING";
  return templateKind.replaceAll("_", " ");
};

const StatusBadge = ({ status }: { status?: string }) => {
  const { t } = useLocale();
  const normalizedStatus = normalizeTemplateStatus(status);
  const colorMap: Record<TemplateStatus, "success" | "warning" | "default"> = {
    ACTIVE: "success",
    DRAFT: "warning",
    INACTIVE: "default",
  };
  const dotMap: Record<TemplateStatus, string> = {
    ACTIVE: "bg-emerald-500",
    DRAFT: "bg-amber-500",
    INACTIVE: "bg-slate-400",
  };
  const labelMap: Record<TemplateStatus, string> = {
    ACTIVE: t("onboarding.template.status.active"),
    DRAFT: t("onboarding.template.status.draft"),
    INACTIVE: t("onboarding.template.status.inactive"),
  };

  return (
    <Tag
      color={colorMap[normalizedStatus]}
      className="!m-0 inline-flex items-center gap-1.5 !rounded-md"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotMap[normalizedStatus]}`} />
      {labelMap[normalizedStatus]}
    </Tag>
  );
};

const Templates = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const currentUser = useUserStore((state) => state.currentUser);
  const userRoles = (currentUser?.roles ?? []) as string[];
  const isHR = userRoles.includes("HR");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sourceView, setSourceView] = useState<SourceView>(TENANT_LEVEL);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const {
    data: tenantTemplates = [],
    isLoading: isTenantLoading,
    isError: isTenantError,
    error: tenantError,
    refetch: refetchTenantTemplates,
  } = useQuery({
    queryKey: ["templates", TENANT_LEVEL, "all-statuses"],
    queryFn: async () => {
      const responses = await Promise.all(
        TENANT_LIST_STATUSES.map((status) =>
          apiListTemplates({ status, level: TENANT_LEVEL }),
        ),
      );
      return dedupeTemplates(
        responses.flatMap((res) => extractTemplatesByLevel(res, TENANT_LEVEL)),
      );
    },
  });

  const {
    data: platformTemplates = [],
    isLoading: isPlatformLoading,
    isError: isPlatformError,
    error: platformError,
    refetch: refetchPlatformTemplates,
  } = useQuery({
    queryKey: ["templates", PLATFORM_LEVEL, "active"],
    queryFn: () => apiListTemplates({ status: "ACTIVE", level: PLATFORM_LEVEL }),
    select: (res: unknown) => extractTemplatesByLevel(res, PLATFORM_LEVEL),
  });

  const tenantData = useMemo(() => {
    return tenantTemplates.filter((template) => {
      const matchesStatus =
        !statusFilter || normalizeTemplateStatus(template.status) === statusFilter;
      if (!matchesStatus) return false;
      return matchesTemplateSearch(template, searchText);
    });
  }, [tenantTemplates, searchText, statusFilter]);

  const platformData = useMemo(
    () => platformTemplates.filter((template) => matchesTemplateSearch(template, searchText)),
    [platformTemplates, searchText],
  );

  const isTenantView = sourceView === TENANT_LEVEL;
  const visibleCount = isTenantView ? tenantData.length : platformData.length;
  const totalCount = isTenantView ? tenantTemplates.length : platformTemplates.length;

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("onboarding.template.filter.all") },
      { value: "ACTIVE", label: t("onboarding.template.filter.active") },
      { value: "DRAFT", label: t("onboarding.template.filter.draft") },
      { value: "INACTIVE", label: t("onboarding.template.filter.inactive") },
    ],
    [t],
  );

  const handleNewTemplate = useCallback(() => {
    navigate("/onboarding/templates/new");
  }, [navigate]);

  const openTemplate = useCallback(
    (template: OnboardingTemplate) => {
      navigate(`/onboarding/templates/${template.id}`);
    },
    [navigate],
  );

  const duplicateTemplate = useCallback(
    (template: OnboardingTemplate) => {
      const defaultName = `Copy of ${template.name}`;
      let nextName = defaultName;

      Modal.confirm({
        title: t("onboarding.template.action.duplicate"),
        content: (
          <Input
            autoFocus
            defaultValue={defaultName}
            onChange={(event) => {
              nextName = event.target.value;
            }}
          />
        ),
        okText: t("onboarding.template.action.duplicate_confirm"),
        cancelText: t("global.cancel"),
        onOk: async () => {
          setLoadingId(template.id);
          try {
            await apiCloneTemplate({
              sourceTemplateId: template.id,
              level: template.level ?? TENANT_LEVEL,
              name: nextName.trim() || defaultName,
            });
            await refetchTenantTemplates();
            message.success(t("onboarding.template.action.duplicate_success"));
          } catch (err) {
            message.error(
              err instanceof Error
                ? err.message
                : t("onboarding.template.error.something_wrong"),
            );
          } finally {
            setLoadingId(null);
          }
        },
      });
    },
    [refetchTenantTemplates, t],
  );

  const clonePlatformSample = useCallback(
    (template: OnboardingTemplate) => {
      const defaultName = template.name;
      let nextName = defaultName;

      Modal.confirm({
        title: t("onboarding.template.platform.clone.title"),
        content: (
          <Input
            autoFocus
            defaultValue={defaultName}
            placeholder={t("onboarding.template.platform.clone.name_placeholder")}
            onChange={(event) => {
              nextName = event.target.value;
            }}
          />
        ),
        okText: t("onboarding.template.platform.clone.confirm"),
        cancelText: t("global.cancel"),
        onOk: async () => {
          setLoadingId(template.id);
          try {
            const result = await apiCloneTemplate({
              sourceTemplateId: template.id,
              level: PLATFORM_LEVEL,
              name: nextName.trim() || defaultName,
            });
            await refetchTenantTemplates();
            message.success(t("onboarding.template.action.duplicate_success"));
            if (result.templateId) {
              navigate(`/onboarding/templates/${result.templateId}`);
            }
          } catch (err) {
            message.error(
              err instanceof Error
                ? err.message
                : t("onboarding.template.error.something_wrong"),
            );
          } finally {
            setLoadingId(null);
          }
        },
      });
    },
    [navigate, refetchTenantTemplates, t],
  );

  const toggleStatusMutation = useMutation({
    mutationFn: ({
      templateId,
      status,
    }: {
      templateId: string;
      status: TemplateStatus;
    }) => apiUpdateTemplate({ templateId, status }),
  });

  const getStatusAction = useCallback(
    (template: OnboardingTemplate) => {
      const status = normalizeTemplateStatus(template.status);
      if (status === "ACTIVE") {
        return {
          nextStatus: "INACTIVE" as const,
          title: t("onboarding.template.deactivate.title"),
          content: t("onboarding.template.deactivate.message", {
            name: template.name,
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
          nextStatus: "ACTIVE" as const,
          title: t("onboarding.template.publish.title"),
          content: t("onboarding.template.publish.message", {
            name: template.name,
          }),
          okText: t("onboarding.template.publish.confirm"),
          successMessage: t("onboarding.template.toast.published"),
          errorMessage: t("onboarding.template.toast.publish_failed"),
          danger: false,
          label: t("onboarding.template.action.publish"),
        };
      }

      return {
        nextStatus: "ACTIVE" as const,
        title: t("onboarding.template.activate.title"),
        content: t("onboarding.template.activate.message", {
          name: template.name,
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

  const toggleTemplateStatus = useCallback(
    (template: OnboardingTemplate) => {
      const action = getStatusAction(template);
      Modal.confirm({
        title: action.title,
        content: action.content,
        okText: action.okText,
        cancelText: t("global.cancel"),
        okButtonProps: { danger: action.danger },
        onOk: async () => {
          setLoadingId(template.id);
          try {
            await toggleStatusMutation.mutateAsync({
              templateId: template.id,
              status: action.nextStatus,
            });
            await refetchTenantTemplates();
            message.success(action.successMessage);
          } catch {
            message.error(action.errorMessage);
          } finally {
            setLoadingId(null);
          }
        },
      });
    },
    [getStatusAction, refetchTenantTemplates, t, toggleStatusMutation],
  );

  const buildOverflowMenu = useCallback(
    (template: OnboardingTemplate): MenuProps["items"] => {
      const action = getStatusAction(template);
      return [
        {
          key: "duplicate",
          label: t("onboarding.template.action.duplicate"),
          icon: <Copy className="h-3.5 w-3.5" />,
          onClick: () => duplicateTemplate(template),
        },
        { type: "divider" as const },
        {
          key: "toggle-status",
          label: action.label,
          icon: <Power className="h-3.5 w-3.5" />,
          danger: action.danger,
          onClick: () => toggleTemplateStatus(template),
        },
      ];
    },
    [duplicateTemplate, getStatusAction, t, toggleTemplateStatus],
  );

  const renderTemplateActions = useCallback((template: OnboardingTemplate) => {
    const busy = loadingId === template.id;
    if (!isHR) {
      return (
        <Tooltip title={t("onboarding.template.action.view_details")}>
          <Button
            size="small"
            icon={<Eye className="h-3.5 w-3.5" />}
            loading={busy}
            aria-label={t("onboarding.template.action.view_details")}
            onClick={() => openTemplate(template)}
          />
        </Tooltip>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <Tooltip title={t("onboarding.template.action.edit")}>
          <Button
            size="small"
            icon={<Pencil className="h-3.5 w-3.5" />}
            loading={busy}
            aria-label={t("onboarding.template.action.edit")}
            onClick={() => openTemplate(template)}
          />
        </Tooltip>
        <Dropdown
          trigger={["click"]}
          menu={{ items: buildOverflowMenu(template) }}
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
  }, [buildOverflowMenu, isHR, loadingId, openTemplate, t]);

  const columns: ColumnsType<OnboardingTemplate> = useMemo(
    () => [
      {
        title: t("onboarding.template.col.name"),
        key: "name",
        render: (_: unknown, template) => (
          <button
            type="button"
            className="flex max-w-md items-start gap-3 text-left transition hover:text-brand"
            onClick={() => openTemplate(template)}
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <FileText className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">
                {template.name || t("onboarding.template.card.untitled")}
              </span>
              <span className="mt-1 block line-clamp-1 text-xs text-slate-500">
                {template.description || t("onboarding.template.card.no_description")}
              </span>
            </span>
          </button>
        ),
      },
      {
        title: t("onboarding.template.col.status"),
        key: "status",
        width: 140,
        render: (_: unknown, template) => <StatusBadge status={template.status} />,
      },
      {
        title: t("onboarding.template.col.structure"),
        key: "structure",
        width: 180,
        render: (_: unknown, template) => (
          <div className="text-xs text-slate-600">
            <div className="font-medium text-ink">
              {formatMetric(getStageCount(template))}{" "}
              {t("onboarding.template.meta.stages_label")}
            </div>
            <div>
              {formatMetric(getTaskCount(template))}{" "}
              {t("onboarding.template.meta.tasks_label")}
            </div>
          </div>
        ),
      },
      {
        title: t("onboarding.template.col.updated_at"),
        key: "updatedAt",
        width: 150,
        render: (_: unknown, template) => (
          <span className="text-xs text-slate-600">{formatDate(template.updatedAt)}</span>
        ),
      },
      {
        title: t("onboarding.template.col.actions"),
        key: "actions",
        width: 130,
        align: "right",
        render: (_: unknown, template) => renderTemplateActions(template),
      },
    ],
    [openTemplate, renderTemplateActions, t],
  );

  const renderCard = (template: OnboardingTemplate) => {
    const status = normalizeTemplateStatus(template.status);
    const isInactive = status === "INACTIVE";
    const busy = loadingId === template.id;
    const stageCount = formatMetric(getStageCount(template));
    const taskCount = formatMetric(getTaskCount(template));

    return (
      <article
        key={template.id}
        className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 ${
          isInactive ? "opacity-70" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
            onClick={() => openTemplate(template)}
            disabled={busy}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              {busy ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
              ) : (
                <FileText className="h-4.5 w-4.5" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">
                {template.name || t("onboarding.template.card.untitled")}
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusBadge status={template.status} />
                <span className="text-xs text-slate-500">
                  {getTemplateKindLabel(template.templateKind)}
                </span>
              </span>
            </span>
          </button>
          <div className="shrink-0">{renderTemplateActions(template)}</div>
        </div>

        <button type="button" className="mt-4 w-full text-left" onClick={() => openTemplate(template)} disabled={busy}>
          <p className="line-clamp-2 min-h-[38px] text-sm leading-5 text-slate-600">
            {template.description || t("onboarding.template.card.no_description")}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="flex items-center gap-4">
              <span>
                <strong className="text-ink">{stageCount}</strong>{" "}
                {t("onboarding.template.meta.stages_label")}
              </span>
              <span>
                <strong className="text-ink">{taskCount}</strong>{" "}
                {t("onboarding.template.meta.tasks_label")}
              </span>
            </span>
            {template.updatedAt && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDate(template.updatedAt)}
              </span>
            )}
          </div>
        </button>
      </article>
    );
  };

  const renderPlatformSampleCard = (template: OnboardingTemplate) => {
    const busy = loadingId === template.id;
    const stageCount = formatMetric(getStageCount(template));
    const taskCount = formatMetric(getTaskCount(template));

    return (
      <article
        key={template.id}
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
      >
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-3 text-left"
            onClick={() => openTemplate(template)}
            disabled={busy}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              {busy ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
              ) : (
                <Sparkles className="h-4.5 w-4.5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-ink">
                {template.name || t("onboarding.template.card.untitled")}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Tag className="!m-0 !rounded-md" color="default">
                  {t("onboarding.template.scope.platform_samples")}
                </Tag>
                <span className="text-xs text-slate-500">
                  {getTemplateKindLabel(template.templateKind)}
                </span>
              </div>
            </div>
          </button>
          <div className="shrink-0">
            {isHR && (
              <Button
                size="small"
                type="primary"
                icon={<Copy className="h-3.5 w-3.5" />}
                loading={busy}
                onClick={() => clonePlatformSample(template)}
              >
                {t("onboarding.template.platform.action.use")}
              </Button>
            )}
          </div>
        </div>

        <button type="button" className="mt-4 w-full text-left" onClick={() => openTemplate(template)} disabled={busy}>
          <p className="line-clamp-2 min-h-[38px] text-sm leading-5 text-slate-600">
            {template.description || t("onboarding.template.card.no_description")}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>
              <strong className="text-ink">{stageCount}</strong>{" "}
              {t("onboarding.template.meta.stages_label")}
            </span>
            <span>
              <strong className="text-ink">{taskCount}</strong>{" "}
              {t("onboarding.template.meta.tasks_label")}
            </span>
            {template.updatedAt && (
              <span className="ml-auto inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {formatDate(template.updatedAt)}
              </span>
            )}
          </div>
        </button>
      </article>
    );
  };

  const renderLoadingGrid = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      ))}
    </div>
  );

  const renderTenantEmpty = () => (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
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
        <Button
          className="mt-3"
          icon={<Plus className="h-3.5 w-3.5" />}
          type="primary"
          onClick={handleNewTemplate}
        >
          {t("onboarding.template.action.new")}
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-1">
            {[
              {
                key: TENANT_LEVEL,
                label: t("onboarding.template.scope.tenant_only"),
                count: tenantTemplates.length,
                icon: FileText,
              },
              {
                key: PLATFORM_LEVEL,
                label: t("onboarding.template.scope.platform_samples"),
                count: platformTemplates.length,
                icon: Sparkles,
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = sourceView === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSourceView(item.key)}
                  className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                    active
                      ? "bg-white text-ink shadow-sm"
                      : "text-slate-500 hover:bg-white hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-end">
            <Input
              prefix={<Search className="h-3.5 w-3.5 text-slate-400" />}
              placeholder={t("onboarding.template.search.placeholder")}
              allowClear
              className="lg:w-72"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
            {isTenantView && (
              <Select<StatusFilter>
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="lg:w-44"
              />
            )}
            {isTenantView && (
              <div className="flex w-fit items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <Tooltip title={t("onboarding.template.view.grid")}>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                      viewMode === "grid"
                        ? "bg-white text-brand shadow-sm"
                        : "text-slate-500 hover:bg-white"
                    }`}
                    aria-label={t("onboarding.template.view.grid")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip title={t("onboarding.template.view.list")}>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                      viewMode === "list"
                        ? "bg-white text-brand shadow-sm"
                        : "text-slate-500 hover:bg-white"
                    }`}
                    aria-label={t("onboarding.template.view.list")}
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
            )}
            {isHR && isTenantView && (
              <Button
                type="primary"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={handleNewTemplate}
              >
                {t("onboarding.template.action.new")}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          {t("onboarding.template.result_count", {
            count: visibleCount,
            total: totalCount,
          })}
          {!isHR && (
            <Tag color="default" className="!ml-2 !rounded-md" data-testid="readonly-banner">
              {t("onboarding.template.readonly.badge")}
            </Tag>
          )}
        </div>
      </section>

      {isTenantView && isTenantError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="flex-1 text-sm text-red-700">
            {(tenantError as Error)?.message ?? t("onboarding.template.error.something_wrong")}
          </p>
          <Button size="small" onClick={() => refetchTenantTemplates()}>
            {t("onboarding.template.error.retry")}
          </Button>
        </div>
      )}

      {!isTenantView && isPlatformError && (
        <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="flex-1 text-sm text-red-700">
            {(platformError as Error)?.message ??
              t("onboarding.template.error.something_wrong")}
          </p>
          <Button size="small" onClick={() => refetchPlatformTemplates()}>
            {t("onboarding.template.error.retry")}
          </Button>
        </div>
      )}

      <section className="min-h-0 flex-1">
        {isTenantView ? (
          isTenantLoading ? (
            renderLoadingGrid()
          ) : tenantData.length === 0 ? (
            renderTenantEmpty()
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tenantData.map(renderCard)}
            </div>
          ) : (
            <MyTable<OnboardingTemplate>
              columns={columns}
              dataSource={tenantData}
              rowKey="id"
              loading={isTenantLoading}
              wrapClassName="!h-full w-full"
              pagination={{ pageSize: 12, hideOnSinglePage: true }}
            />
          )
        ) : isPlatformLoading ? (
          renderLoadingGrid()
        ) : platformData.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Empty description={t("onboarding.template.platform.empty")} />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platformData.map(renderPlatformSampleCard)}
          </div>
        )}
      </section>
    </div>
  );
};

export default Templates;

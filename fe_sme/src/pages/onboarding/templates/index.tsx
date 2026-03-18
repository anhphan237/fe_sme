import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, FileText } from "lucide-react";
import { Button, Empty, Select, Tag } from "antd";
import Input from "antd/es/input";
import { useQuery } from "@tanstack/react-query";
import type { ColumnsType } from "antd/es/table";
import { useLocale } from "@/i18n";
import { useGlobalStore } from "@/stores/global.store";
import { apiListTemplates } from "@/api/onboarding/onboarding.api";
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

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["templates", statusFilter, searchText],
    queryFn: () =>
      apiListTemplates({ status: statusFilter, search: searchText || undefined }),
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
      navigate(`/onboarding/templates/${tmpl.id}`);
    },
    [navigate, setBreadcrumbs],
  );

  const handleNewTemplate = useCallback(
    () => navigate("/onboarding/templates/new"),
    [navigate],
  );

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
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center gap-2">
        <Button type="primary" onClick={handleNewTemplate}>
          {t("onboarding.template.action.new")}
        </Button>

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
    </div>
  );
};

export default Templates;

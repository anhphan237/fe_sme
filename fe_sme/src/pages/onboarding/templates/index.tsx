import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useLocale } from "@/i18n";
import { useAppStore } from "@/store/useAppStore";
import type { OnboardingTemplate } from "@/shared/types";
import {
  useTemplatesQuery,
  useDeactivateTemplate,
  STATUS_TAB_VALUES,
  STATUS_TAB_KEYS,
  type StatusFilter,
} from "./hooks";
import { TemplateRow } from "./components/TemplateRow";
import { DeactivateModal } from "./components/DeactivateModal";

function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLocale();
  const setBreadcrumbs = useAppStore((s) => s.setBreadcrumbs);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [actionTarget, setActionTarget] = useState<OnboardingTemplate | null>(
    null,
  );

  const { data, isLoading, isError, error, refetch } =
    useTemplatesQuery(statusFilter);
  const deactivateTemplate = useDeactivateTemplate();

  const isActive =
    (actionTarget?.status ?? "ACTIVE").toUpperCase() === "ACTIVE";

  const handleConfirm = async () => {
    if (!actionTarget) return;
    const newStatus = isActive ? "INACTIVE" : "ACTIVE";
    try {
      await deactivateTemplate.mutateAsync({
        templateId: actionTarget.id,
        status: newStatus,
      });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast(
        t(
          isActive
            ? "onboarding.template.toast.deactivated"
            : "onboarding.template.toast.activated",
        ),
      );
      setActionTarget(null);
    } catch (e) {
      toast(
        e instanceof Error
          ? e.message
          : t(
              isActive
                ? "onboarding.template.toast.deactivate_failed"
                : "onboarding.template.toast.activate_failed",
            ),
      );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("onboarding.template.title")}
        subtitle={t("onboarding.template.subtitle")}
        actionLabel={t("onboarding.template.action.new")}
        onAction={() => navigate("/onboarding/templates/new")}
      />

      {/* Filter tabs + summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-0.5 rounded-xl bg-slate-100 p-1">
          {STATUS_TAB_VALUES.map((value, i) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                statusFilter === value
                  ? "bg-white text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}>
              {t(STATUS_TAB_KEYS[i])}
              {!isLoading && data && statusFilter === value && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    statusFilter === value
                      ? "bg-brand/10 text-brand"
                      : "bg-slate-200 text-muted"
                  }`}>
                  {data.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="p-0">
        {isLoading ? (
          <table className="w-full border-collapse text-sm">
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-stroke first:border-t-0">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 sm:table-cell">
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </td>
                  <td className="hidden px-4 py-4 sm:table-cell">
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </td>
                  <td className="hidden px-4 py-4 lg:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm font-medium text-ink">
              {error != null && typeof (error as Error).message === "string"
                ? (error as Error).message
                : t("onboarding.template.error.something_wrong")}
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              {t("onboarding.template.error.retry")}
            </Button>
          </div>
        ) : !data?.length ? (
          <div className="p-12">
            <EmptyState
              title={
                statusFilter === "INACTIVE"
                  ? t("onboarding.template.empty.inactive_title")
                  : t("onboarding.template.empty.active_title")
              }
              description={
                statusFilter === "INACTIVE"
                  ? t("onboarding.template.empty.inactive_desc")
                  : t("onboarding.template.empty.active_desc")
              }
              actionLabel={
                statusFilter !== "INACTIVE"
                  ? t("onboarding.template.action.new")
                  : undefined
              }
              onAction={
                statusFilter !== "INACTIVE"
                  ? () => navigate("/onboarding/templates/new")
                  : undefined
              }
            />
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">
                  {t("onboarding.template.col.name")}
                </th>
                <th className="hidden px-4 py-3 sm:table-cell">
                  {t("onboarding.template.col.stages")}
                </th>
                <th className="hidden px-4 py-3 sm:table-cell">
                  {t("onboarding.template.col.status")}
                </th>
                <th className="hidden px-4 py-3 lg:table-cell">
                  {t("onboarding.template.col.updated_at")}
                </th>
                <th className="px-4 py-3 text-right">
                  {t("onboarding.template.col.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  onEdit={(tmpl) => {
                    setBreadcrumbs({ [tmpl.id]: tmpl.name });
                    navigate(`/onboarding/templates/${tmpl.id}`);
                  }}
                  onDuplicate={(tmpl) =>
                    navigate("/onboarding/templates/new", {
                      state: { duplicateFrom: tmpl },
                    })
                  }
                  onToggleStatus={setActionTarget}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <DeactivateModal
        target={actionTarget}
        loading={deactivateTemplate.isPending}
        onClose={() => setActionTarget(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

export default Templates;

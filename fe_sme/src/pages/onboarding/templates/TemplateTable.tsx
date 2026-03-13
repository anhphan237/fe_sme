import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Empty, Skeleton } from "antd";
import { useLocale } from "@/i18n";
import type { OnboardingTemplate } from "@/shared/types";
import type { StatusFilter } from ".";
import { TemplateRow } from "./TemplateRow";

// Hoist static skeleton rows outside component
const SKELETON_ROWS = Array.from({ length: 5 }, (_, i) => (
  <tr key={i} className="border-t border-stroke first:border-t-0">
    <td className="px-4 py-4">
      <div className="flex items-center gap-3">
        <Skeleton.Avatar active shape="square" size={36} />
        <div className="flex-1 space-y-2">
          <Skeleton.Input active size="small" style={{ width: 192 }} />
          <Skeleton.Input active size="small" style={{ width: 256 }} />
        </div>
      </div>
    </td>
    <td className="hidden px-4 py-4 sm:table-cell">
      <Skeleton.Button active size="small" style={{ width: 64 }} />
    </td>
    <td className="hidden px-4 py-4 sm:table-cell">
      <Skeleton.Button active size="small" style={{ width: 80 }} />
    </td>
    <td className="hidden px-4 py-4 lg:table-cell">
      <Skeleton.Input active size="small" style={{ width: 96 }} />
    </td>
    <td className="px-4 py-4">
      <Skeleton.Button
        active
        size="small"
        style={{ width: 64, marginLeft: "auto" }}
      />
    </td>
  </tr>
));

interface TemplateTableProps {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: OnboardingTemplate[] | undefined;
  statusFilter: StatusFilter;
  onEdit: (template: OnboardingTemplate) => void;
  onDuplicate: (template: OnboardingTemplate) => void;
  onToggleStatus: (template: OnboardingTemplate) => void;
  onRetry: () => void;
  onNewTemplate: () => void;
}

export const TemplateTable = memo(function TemplateTable({
  isLoading,
  isError,
  error,
  data,
  statusFilter,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onRetry,
  onNewTemplate,
}: TemplateTableProps) {
  const { t } = useLocale();

  if (isLoading) {
    return (
      <table className="w-full border-collapse text-sm">
        <tbody>{SKELETON_ROWS}</tbody>
      </table>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <p className="text-sm font-medium text-ink">
          {error?.message ?? t("onboarding.template.error.something_wrong")}
        </p>
        <Button onClick={onRetry}>
          {t("onboarding.template.error.retry")}
        </Button>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="p-12 flex flex-col items-center gap-4">
        <Empty
          description={
            statusFilter === "INACTIVE"
              ? t("onboarding.template.empty.inactive_title")
              : t("onboarding.template.empty.active_title")
          }
        />
        {statusFilter !== "INACTIVE" && (
          <Button type="primary" onClick={onNewTemplate}>
            {t("onboarding.template.action.new")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-muted">
        <tr>
          <th className="px-4 py-3">{t("onboarding.template.col.name")}</th>
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
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </tbody>
    </table>
  );
});

import { FileText, Pencil, Copy, XCircle, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/i18n";
import type { OnboardingTemplate } from "@/shared/types";
import { StatusBadge } from "./StatusBadge";

export interface TemplateRowProps {
  template: OnboardingTemplate;
  onEdit: (t: OnboardingTemplate) => void;
  onDuplicate: (t: OnboardingTemplate) => void;
  onToggleStatus: (t: OnboardingTemplate) => void;
}

export function TemplateRow({
  template,
  onEdit,
  onDuplicate,
  onToggleStatus,
}: TemplateRowProps) {
  const { t } = useLocale();
  const isActive = (template.status ?? "ACTIVE").toUpperCase() === "ACTIVE";

  const formattedDate = template.updatedAt
    ? new Date(template.updatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const stagesCount = template.stages?.length ?? 0;

  return (
    <tr className="group border-t border-stroke hover:bg-slate-50">
      {/* Name + Icon */}
      <td className="px-4 py-3">
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
            <p className="truncate text-sm font-semibold text-ink">
              {template.name}
            </p>
            {template.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                {template.description}
              </p>
            ) : (
              <p className="mt-0.5 text-xs italic text-muted/40">—</p>
            )}
          </div>
        </div>
      </td>

      {/* Stages count */}
      <td className="hidden px-4 py-3 sm:table-cell">
        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-muted">
          {stagesCount > 0
            ? t("onboarding.template.stages_count", { count: stagesCount })
            : t("onboarding.template.no_stages")}
        </span>
      </td>

      {/* Status */}
      <td className="hidden px-4 py-3 sm:table-cell">
        <StatusBadge status={template.status} />
      </td>

      {/* Updated at */}
      <td className="hidden px-4 py-3 text-sm text-muted lg:table-cell">
        {formattedDate}
      </td>

      {/* Actions — visible on hover */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title={t("onboarding.template.action.edit")}
            onClick={() => onEdit(template)}
            className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-ink">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={t("onboarding.template.action.duplicate")}
            onClick={() => onDuplicate(template)}
            className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-ink">
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={
              isActive
                ? t("onboarding.template.action.deactivate")
                : t("onboarding.template.action.activate")
            }
            onClick={() => onToggleStatus(template)}
            className={`rounded-lg p-1.5 transition ${
              isActive
                ? "text-muted hover:bg-red-50 hover:text-red-500"
                : "text-muted hover:bg-emerald-50 hover:text-emerald-600"
            }`}>
            {isActive ? (
              <XCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

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
    ? new Date(template.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const stagesCount = (template as any).stages?.length ?? 0;

  return (
    <tr className="group border-t border-stroke hover:bg-slate-50">
      {/* Name + Icon */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              isActive ? "bg-brand/10" : "bg-slate-100"
            }`}>
            <svg
              className={`h-4.5 w-4.5 ${isActive ? "text-brand" : "text-slate-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
              />
            </svg>
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
            ? t("onboarding.template.stages_count").replace(
                "{count}",
                String(stagesCount),
              )
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
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
              />
            </svg>
          </button>
          <button
            type="button"
            title={t("onboarding.template.action.duplicate")}
            onClick={() => onDuplicate(template)}
            className="rounded-lg p-1.5 text-muted hover:bg-slate-100 hover:text-ink">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
              />
            </svg>
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
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

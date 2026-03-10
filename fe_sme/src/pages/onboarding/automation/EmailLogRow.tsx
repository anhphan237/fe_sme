import { useLocale } from "@/i18n";
import type { EmailLogResponse } from "@/interface/onboarding";

interface Props {
  log: EmailLogResponse;
}

export function EmailLogRow({ log }: Props) {
  const { t } = useLocale();

  const statusCls =
    log.status === "Sent"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-red-50 text-red-600";

  return (
    <tr className="border-b border-stroke last:border-0 hover:bg-slate-50/60">
      <td className="py-3 pr-4 text-sm text-ink">{log.subject}</td>
      <td className="py-3 pr-4 text-sm text-muted">
        {log.recipientEmail ?? "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-muted">
        {log.sentAt ? log.sentAt.slice(0, 16).replace("T", " ") : "—"}
      </td>
      <td className="py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCls}`}>
          {t(`onboarding.automation.log.status.${log.status.toLowerCase()}`)}
        </span>
      </td>
    </tr>
  );
}

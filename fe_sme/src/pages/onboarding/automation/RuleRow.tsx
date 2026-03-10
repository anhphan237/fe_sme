import { Mail, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { useLocale } from "@/i18n";
import { TRIGGER_LABELS, CHANNEL_LABELS } from "../constants";
import type { AutomationRuleResponse } from "@/interface/onboarding";

interface Props {
  rule: AutomationRuleResponse;
  onToggle: (ruleId: string, currentEnabled: boolean) => void;
  isToggling: boolean;
}

export function RuleRow({ rule, onToggle, isToggling }: Props) {
  const { t } = useLocale();
  const channelCls =
    rule.channel === "email"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";

  const triggerLabel = TRIGGER_LABELS[rule.trigger] ?? rule.trigger;
  const channelLabel = CHANNEL_LABELS[rule.channel] ?? rule.channel;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-stroke bg-white px-5 py-4 transition hover:shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
        {rule.channel === "email" ? (
          <Mail className="h-4 w-4 text-slate-500" />
        ) : (
          <Zap className="h-4 w-4 text-slate-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{rule.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {t("onboarding.automation.rule.trigger_label")}: {triggerLabel}
        </p>
      </div>

      <Pill className={channelCls}>{channelLabel}</Pill>

      <button
        type="button"
        onClick={() => onToggle(rule.ruleId, rule.enabled)}
        disabled={isToggling}
        aria-label={
          rule.enabled
            ? t("onboarding.automation.rule.disable")
            : t("onboarding.automation.rule.enable")
        }
        className="shrink-0 text-muted transition hover:text-brand disabled:opacity-50">
        {rule.enabled ? (
          <ToggleRight className="h-7 w-7 text-emerald-500" />
        ) : (
          <ToggleLeft className="h-7 w-7" />
        )}
      </button>
    </div>
  );
}

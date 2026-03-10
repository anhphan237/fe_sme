import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/i18n";

interface Props {
  message: string;
  onRetry: () => void;
}

export function InlineError({ message, onRetry }: Props) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-400" />
      </div>
      <p className="text-sm font-medium text-ink">{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        {t("onboarding.template.error.retry")}
      </Button>
    </div>
  );
}

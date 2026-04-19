import { useLocale } from "@/i18n";
import { Tag } from "antd";

type TaskLibraryStatus = "ACTIVE" | "DRAFT" | "INACTIVE" | string;

const STATUS_CONFIG: Record<
  string,
  { color: "success" | "processing" | "default"; dot?: string }
> = {
  ACTIVE: { color: "success", dot: "bg-emerald-500" },
  DRAFT: { color: "processing" },
  INACTIVE: { color: "default", dot: "bg-slate-400" },
};

const TaskLibraryStatusTag = ({
  status,
  className,
}: {
  status?: TaskLibraryStatus;
  className?: string;
}) => {
  const { t } = useLocale();
  const upper = (status ?? "").toUpperCase();
  const config = STATUS_CONFIG[upper] ?? STATUS_CONFIG["INACTIVE"];

  return (
    <Tag
      color={config.color}
      className={`inline-flex items-center gap-1 !m-0 ${className ?? ""}`}>
      {config.dot && (
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot}`}
        />
      )}
      {t(`onboarding.task_library.status.${upper.toLowerCase()}`)}
    </Tag>
  );
};

export default TaskLibraryStatusTag;

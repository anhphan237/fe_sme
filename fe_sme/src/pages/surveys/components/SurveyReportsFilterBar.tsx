import BaseSelect from "@core/components/Select/BaseSelect";
import { useLocale } from "@/i18n";

type Props = {
  templateOptions: { value: string; label: string }[];
  templateId: string;
  onTemplateChange: (value?: string) => void;
};

const SurveyReportsFilterBar = ({
  templateOptions,
  templateId,
  onTemplateChange,
}: Props) => {
  const { t } = useLocale();

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-[#223A59]">
          {t("survey.reports.title")}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {t("survey.reports.subtitle")}
        </p>
      </div>

      <div className="w-56">
        <BaseSelect
          name="templateFilter"
          options={templateOptions}
          value={templateId}
          placeholder={t("survey.reports.filter.all_templates")}
          onChange={(v) => onTemplateChange((v as string) ?? "")}
          allowClear
        />
      </div>
    </div>
  );
};

export default SurveyReportsFilterBar;
import BaseSelect from "@core/components/Select/BaseSelect";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useLocale } from "@/i18n";

type Props = {
  templateOptions: { value: string; label: string }[];
  templateId: string;
  startDate: string;
  endDate: string;
  onTemplateChange: (value?: string) => void;
  onDateRangeChange: (startDate?: string, endDate?: string) => void;
};

const SurveyReportsFilterBar = ({
  templateOptions,
  templateId,
  startDate,
  endDate,
  onTemplateChange,
  onDateRangeChange,
}: Props) => {
  const { t } = useLocale();

  const handleRangeChange = (
    dates: null | [Dayjs | null, Dayjs | null],
  ) => {
    const start = dates?.[0] ? dates[0].format("YYYY-MM-DD") : "";
    const end = dates?.[1] ? dates[1].format("YYYY-MM-DD") : "";

    onDateRangeChange(start, end);
  };

  const rangeValue: [Dayjs | null, Dayjs | null] = [
    startDate ? dayjs(startDate) : null,
    endDate ? dayjs(endDate) : null,
  ];

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

      <div className="flex flex-wrap items-center gap-3">
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

        <DatePicker.RangePicker
          value={rangeValue}
          format="YYYY-MM-DD"
          onChange={handleRangeChange}
          allowClear
          className="min-w-[280px]"
        />
      </div>
    </div>
  );
};

export default SurveyReportsFilterBar;
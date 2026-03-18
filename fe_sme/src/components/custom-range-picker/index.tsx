import { useLocale } from "@/i18n";
import { DatePicker, Select } from "antd";
import dayjs, { Dayjs } from "dayjs";
import React, { useState } from "react";

const { RangePicker } = DatePicker;

interface DateRange {
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
}

interface Props {
  onChange: (range: DateRange) => void;
  isDashboard?: boolean;
  defaultValue?:
    | "today"
    | "yesterday"
    | "thisMonth"
    | "lastMonth"
    | "thisYear"
    | "lastYear";
}

const predefinedRanges: Record<string, [Dayjs, Dayjs]> = {
  today: [dayjs().startOf("day"), dayjs().endOf("day")],
  yesterday: [
    dayjs().subtract(1, "day").startOf("day"),
    dayjs().subtract(1, "day").endOf("day"),
  ],
  thisMonth: [
    dayjs().startOf("month").startOf("day"),
    dayjs().endOf("month").startOf("day"),
  ],
  lastMonth: [
    dayjs().subtract(1, "month").startOf("month").startOf("day"),
    dayjs().subtract(1, "month").endOf("month").startOf("day"),
  ],
  thisYear: [
    dayjs().startOf("year").startOf("day"),
    dayjs().endOf("year").startOf("day"),
  ],
  lastYear: [
    dayjs().subtract(1, "year").startOf("year").startOf("day"),
    dayjs().subtract(1, "year").endOf("year").startOf("day"),
  ],
};

const DateRangeFilter: React.FC<Props> = ({
  onChange,
  isDashboard = false,
  defaultValue,
}) => {
  const { t } = useLocale();

  const initialValue = isDashboard ? "today" : defaultValue;
  const initialRange =
    initialValue && initialValue in predefinedRanges
      ? predefinedRanges[initialValue]
      : [null, null];

  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    initialValue,
  );
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>(
    initialRange as [Dayjs | null, Dayjs | null],
  );

  const quickOptions = [
    { label: t("dashboard.overview.time_range.today"), value: "today" },
    { label: t("dashboard.overview.time_range.yesterday"), value: "yesterday" },
    { label: t("finance_accounting.this_month"), value: "thisMonth" },
    { label: t("finance_accounting.last_month"), value: "lastMonth" },
    { label: t("finance_accounting.this_year"), value: "thisYear" },
    { label: t("finance_accounting.last_year"), value: "lastYear" },
    { label: t("dashboard.overview.time_range.custom"), value: "custom" },
  ];

  const handleSelectChange = (value: string) => {
    setSelectedOption(value);
    if (value in predefinedRanges) {
      const newRange = predefinedRanges[value];
      setRange(newRange);
      onChange({ fromDate: newRange[0], toDate: newRange[1] });
    } else {
      setRange([null, null]);
      onChange({ fromDate: null, toDate: null });
    }
  };

  const handleRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null,
    _dateStrings: [string, string],
  ) => {
    if (dates && dates[0] && dates[1]) {
      setRange(dates);
      setSelectedOption("custom");
      onChange({ fromDate: dates[0], toDate: dates[1].endOf("day") });
    } else {
      setRange([null, null]);
      onChange({ fromDate: null, toDate: null });
    }
  };

  const shouldDisableClear = isDashboard || !!defaultValue;

  return (
    <>
      <RangePicker
        className="w-full max-w-md"
        value={range}
        onChange={handleRangeChange}
        format="DD/MM/YYYY"
        allowEmpty={[!shouldDisableClear, !shouldDisableClear]}
        allowClear={!shouldDisableClear}
      />
      <Select
        className="w-36 min-w-36"
        placeholder={t("finance_accounting.quick_option")}
        defaultValue={initialValue ?? "custom"}
        value={selectedOption}
        onChange={handleSelectChange}
        options={quickOptions}
        allowClear={!shouldDisableClear}
      />
    </>
  );
};

export default DateRangeFilter;

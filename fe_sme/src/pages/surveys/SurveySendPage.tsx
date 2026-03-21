import { useState } from "react";
import { DatePicker, Empty, Select, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { CalendarClock, Plus } from "lucide-react";

import BaseButton from "@/components/button";
import { useLocale } from "@/i18n";
import SurveySendDrawer from "./components/SurveySendDrawer";
import { InstanceStatusTag } from "./components/SurveyStatusTag";
import { useSurveySendPage } from "./hooks/useSurveySendPage";
import type { SurveyInstanceItem } from "./types/survey-send.types";
import {
  formatDateTime,
  getSurveySendStatusOptions,
} from "./utils/survey-send.utils";

const SurveySendPage = () => {
  const { t } = useLocale();
  const [openSendDrawer, setOpenSendDrawer] = useState(false);

  const {
    filters,
    rows,
    totalCount,
    isLoading,
    templateOptions,
    setTemplateId,
    setStatus,
    setDateRange,
    setPagination,
    clearFilters,
  } = useSurveySendPage();

  const statusOptions = getSurveySendStatusOptions();

  const columns: ColumnsType<SurveyInstanceItem> = [
    {
      title: t("survey.send.table.template") || "Survey template",
      dataIndex: "templateName",
      key: "templateName",
      render: (value: string) => value || "—",
    },
    {
      title: t("survey.send.table.scheduled_at") || "Scheduled at",
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      render: (value) => formatDateTime(value),
    },
    {
      title: t("survey.send.table.status") || "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value: string) => <InstanceStatusTag status={value} />,
    },
    {
      title: t("survey.send.table.created_at") || "Created at",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => formatDateTime(value),
    },
  ];

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPagination(pagination.current ?? 1, pagination.pageSize ?? 10);
  };

  const handleDateRangeChange = (
    _dates: unknown,
    dateStrings: [string, string] | string[],
  ) => {
    setDateRange(dateStrings?.[0] || undefined, dateStrings?.[1] || undefined);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[#223A59]">
            {t("survey.send.page_title") || "Send Surveys"}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {t("survey.send.page_subtitle") ||
              "Schedule onboarding surveys for employees and track outgoing survey sends."}
          </p>
        </div>

        <BaseButton
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          label="survey.send.schedule"
          onClick={() => setOpenSendDrawer(true)}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("survey.send.filter.template") || "Survey template"}
            </label>
            <Select
              className="w-full"
              allowClear
              value={filters.templateId}
              options={templateOptions}
              placeholder={t("global.select") || "Select"}
              onChange={setTemplateId}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("survey.send.filter.status") || "Status"}
            </label>
            <Select
              className="w-full"
              allowClear
              value={filters.status}
              options={statusOptions}
              placeholder={t("global.select") || "Select"}
              onChange={setStatus}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {t("survey.send.filter.date_range") || "Scheduled date range"}
            </label>
            <DatePicker.RangePicker
              className="w-full"
              onChange={handleDateRangeChange}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            {totalCount > 0
              ? `${totalCount} ${
                  t("survey.send.total_items") || "scheduled survey(s)"
                }`
              : t("survey.send.empty_count") || "No outgoing surveys yet"}
          </div>

          <BaseButton
            label="global.clear_filter"
            onClick={clearFilters}
          />
        </div>

        {rows.length === 0 && !isLoading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14">
            <Empty
              image={<CalendarClock className="mx-auto h-10 w-10 text-slate-300" />}
              description={
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-700">
                    {t("survey.send.empty_title") || "No scheduled surveys yet"}
                  </div>
                  <div className="text-sm text-slate-500">
                    {t("survey.send.empty_desc") ||
                      "Create a new survey send to assign a survey template to an employee immediately or schedule it for later."}
                  </div>
                </div>
              }
            >
              <BaseButton
                type="primary"
                icon={<Plus className="h-4 w-4" />}
                label="survey.send.schedule"
                onClick={() => setOpenSendDrawer(true)}
              />
            </Empty>
          </div>
        ) : (
          <Table<SurveyInstanceItem>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={rows}
            pagination={{
              current: filters.page,
              pageSize: filters.pageSize,
              total: totalCount,
              showSizeChanger: true,
            }}
            onChange={handleTableChange}
          />
        )}
      </div>

      <SurveySendDrawer
        open={openSendDrawer}
        onClose={() => setOpenSendDrawer(false)}
      />
    </div>
  );
};

export default SurveySendPage;
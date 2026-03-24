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
import { formatDateTime } from "./utils/survey-send.utils";

const statusOptions = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PENDING", label: "Pending" },
  { value: "SENT", label: "Sent" },
  { value: "COMPLETED", label: "Completed" },
  { value: "EXPIRED", label: "Expired" },
];

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

  const tt = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const columns: ColumnsType<SurveyInstanceItem> = [
    {
      title: tt("survey.send.table.employee", "Employee"),
      dataIndex: "employeeName",
      key: "employeeName",
      width: 260,
      render: (_: unknown, record) => (
        <div>
          <div className="font-medium text-slate-800">
            {record.employeeName || (
              <span className="text-xs italic text-slate-400">
                Chưa có thông tin
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">{record.email || "—"}</div>
        </div>
      ),
    },
    {
      title: tt("survey.send.table.template", "Survey template"),
      dataIndex: "templateName",
      key: "templateName",
      render: (value: string | null | undefined) => value || "—",
    },
    {
      title: tt("survey.send.table.scheduled_at", "Scheduled at"),
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      render: (value: string | null | undefined) => formatDateTime(value),
    },
    {
      title: tt("survey.send.table.status", "Status"),
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (value: string | null | undefined) =>
        value ? <InstanceStatusTag status={value} /> : "—",
    },
    {
      title: tt("survey.send.table.created_at", "Created at"),
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string | null | undefined) => formatDateTime(value),
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
            {tt("survey.send.page_title", "Send Surveys")}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {tt(
              "survey.send.page_subtitle",
              "Schedule onboarding surveys for employees and track outgoing survey sends.",
            )}
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
              {tt("survey.send.filter.template", "Survey template")}
            </label>
            <Select
              className="w-full"
              allowClear
              value={filters.templateId}
              options={templateOptions}
              placeholder={tt("global.select", "Chọn...")}
              onChange={(value) => setTemplateId(value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {tt("survey.send.filter.status", "Status")}
            </label>
            <Select
              className="w-full"
              allowClear
              value={filters.status}
              options={statusOptions}
              placeholder={tt("global.select", "Chọn...")}
              onChange={(value) => setStatus(value)}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {tt("survey.send.filter.date_range", "Scheduled date range")}
            </label>
            <DatePicker.RangePicker
              className="w-full"
              format="DD-MM-YYYY"
              onChange={handleDateRangeChange}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            {totalCount > 0
              ? `${totalCount} ${tt("survey.send.total_items", "Total items")}`
              : tt("survey.send.empty_count", "Chưa có dữ liệu")}
          </div>

          <BaseButton label="global.clear_filter" onClick={clearFilters} />
        </div>

        {rows.length === 0 && !isLoading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14">
            <Empty
              image={
                <CalendarClock className="mx-auto h-10 w-10 text-slate-300" />
              }
              description={
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-700">
                    {tt("survey.send.empty_title", "No scheduled surveys yet")}
                  </div>
                  <div className="text-sm text-slate-500">
                    {tt(
                      "survey.send.empty_desc",
                      "Create a new survey send to assign a survey template to an employee immediately or schedule it for later.",
                    )}
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
            rowKey={(record) => record.id || record.instanceId || ""}
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
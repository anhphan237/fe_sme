import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Send } from "lucide-react";
import MyTable from "@/components/table";
import BaseButton from "@/components/button";
import BaseSelect from "@core/components/Select/BaseSelect";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/i18n";
import { apiGetSurveyInstances } from "@/api/survey/survey.api";
import { extractList } from "@/api/core/types";
import type { SurveyInstanceSummary } from "@/interface/survey";
import { useUserStore } from "@/stores/user.store";
import { isOnboardingEmployee } from "@/shared/rbac";
import { InstanceStatusTag } from "./components/SurveyStatusTag";
import SurveySendDrawer from "./components/SurveySendDrawer";

const SurveyInbox = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const currentUser = useUserStore((state) => state.currentUser);
  const roles = currentUser?.roles ?? [];
  const employeeOnlyView = isOnboardingEmployee(roles);
  const canSendSurvey = roles.includes("HR");
  const [statusFilter, setStatusFilter] = useState("");
  const [sendOpen, setSendOpen] = useState(false);

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("survey.inbox.filter.all") },
      { value: "PENDING", label: t("survey.inbox.status.pending") },
      { value: "SENT", label: t("survey.inbox.status.sent") },
      { value: "COMPLETED", label: t("survey.inbox.status.completed") },
      { value: "EXPIRED", label: t("survey.inbox.status.expired") },
    ],
    [t],
  );

  const {
    data: instancesRaw,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "survey-instances",
      statusFilter || "ALL",
      employeeOnlyView ? currentUser?.id : "ALL",
    ],
    queryFn: () =>
      apiGetSurveyInstances({
        status: statusFilter || undefined,
        employeeId: employeeOnlyView ? currentUser?.id : undefined,
      }),
  });
  const instances = extractList<SurveyInstanceSummary>(
    instancesRaw,
    "items",
    "instances",
  );

  const filtered = useMemo(() => instances, [instances]);

  const columns: ColumnsType<SurveyInstanceSummary> = [
    {
      title: t("survey.inbox.col.survey"),
      dataIndex: "templateName",
      key: "templateName",
      render: (name: string, row) => (
        <button
          type="button"
          className="text-left font-medium text-[#223A59] hover:text-[#3684DB] hover:underline"
          onClick={() => navigate(`/surveys/inbox/${row.instanceId}`)}>
          {name}
        </button>
      ),
    },
    {
      title: t("survey.inbox.col.employee"),
      dataIndex: "employeeId",
      key: "employeeId",
      render: (id: string) => (
        <span className="font-mono text-xs text-slate-500">{id}</span>
      ),
    },
    {
      title: t("survey.inbox.col.scheduled"),
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      width: 140,
      render: (date: string | null) =>
        date ? (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500 ring-1 ring-inset ring-slate-200">
            {new Date(date).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      title: t("survey.inbox.col.status"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => <InstanceStatusTag status={status} />,
    },
    {
      title: t("global.action"),
      key: "actions",
      width: 140,
      render: (_, row) =>
        row.status === "PENDING" ? (
          <BaseButton
            size="small"
            type="primary"
            label="survey.inbox.take"
            onClick={() => navigate(`/surveys/inbox/${row.instanceId}`)}
          />
        ) : (
          <BaseButton
            size="small"
            label="survey.inbox.open"
            onClick={() => navigate(`/surveys/inbox/${row.instanceId}`)}
          />
        ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[#223A59]">
            {t("survey.inbox.title")}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {t("survey.inbox.subtitle")}
          </p>
        </div>
        {canSendSurvey ? (
          <BaseButton
            type="primary"
            icon={<Send className="h-4 w-4" />}
            label="survey.inbox.goto_send"
            onClick={() => setSendOpen(true)}
          />
        ) : null}
      </div>

      {/* ── Filter toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="w-44">
          <BaseSelect
            name="statusFilter"
            options={statusOptions}
            placeholder={t("survey.inbox.col.status")}
            onChange={(v) => setStatusFilter((v as string) ?? "")}
            allowClear
          />
        </div>
        <div className="ml-auto text-xs text-slate-400">
          {filtered.length} {filtered.length === 1 ? "survey" : "surveys"}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <MyTable
          columns={columns}
          dataSource={isError ? [] : filtered}
          rowKey="instanceId"
          wrapClassName="w-full"
          loading={isLoading}
          pagination={{ showSizeChanger: true }}
          locale={{
            emptyText: <Empty description={t("survey.inbox.empty.title")} />,
          }}
        />
      </div>

      {canSendSurvey ? (
        <SurveySendDrawer open={sendOpen} onClose={() => setSendOpen(false)} />
      ) : null}
    </div>
  );
};

export default SurveyInbox;

import { Empty, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Star } from "lucide-react";
import MyTable from "@/components/table";
import { useLocale } from "@/i18n";
import type { SurveyResponseSummary } from "../types/survey-report.types";
import { InstanceStatusTag, StageTag } from "./SurveyStatusTag";

type Props = {
  responses: SurveyResponseSummary[];
  loading?: boolean;
};

type SurveyResponseSummaryExt = SurveyResponseSummary & {
  stage?: string | null;
  surveyStage?: string | null;
  templateStage?: string | null;

  targetRole?: string | null;
  responderRole?: string | null;
  role?: string | null;

  status?: string | null;
  instanceStatus?: string | null;
  surveyStatus?: string | null;

  closedAt?: string | null;
  dueAt?: string | null;
  dueDate?: string | null;
  deadline?: string | null;

  submittedAt?: string | null;

  departmentName?: string | null;
  managerName?: string | null;
};

const getValue = (
  row: SurveyResponseSummaryExt,
  keys: Array<keyof SurveyResponseSummaryExt>,
) => {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

const formatScore = (value?: number | string | null) => {
  if (value == null) return "—";

  const n = typeof value === "number" ? value : Number(value);

  return Number.isNaN(n) ? "—" : n.toFixed(2);
};

const formatDate = (value?: string | null) => {
  if (!value) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return undefined;

  return date.toLocaleDateString();
};

const MissingData = ({ label }: { label?: string }) => (
  <Tooltip title={label || "Backend chưa trả field này"}>
    <Tag color="default" className="cursor-help">
      —
    </Tag>
  </Tooltip>
);

const TextCell = ({
  value,
  fallback,
  maxWidth = 220,
}: {
  value?: string | null;
  fallback?: string;
  maxWidth?: number;
}) => {
  const display = value || fallback || "—";

  return (
    <Tooltip title={display}>
      <span className="block truncate text-slate-700" style={{ maxWidth }}>
        {display}
      </span>
    </Tooltip>
  );
};

const SurveyResponsesTable = ({ responses, loading }: Props) => {
  const { t } = useLocale();

  const tr = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const columns: ColumnsType<SurveyResponseSummary> = [
    {
      title: t("survey.reports.col.template"),
      dataIndex: "templateName",
      key: "templateName",
      width: 240,
      fixed: "left",
      render: (value?: string) => <TextCell value={value} maxWidth={220} />,
    },
    {
      title: tr("survey.reports.col.stage", "Giai đoạn"),
      key: "stage",
      width: 130,
      render: (row: SurveyResponseSummaryExt) => {
        const stage = getValue(row, ["stage", "surveyStage", "templateStage"]);

        return stage ? (
          <StageTag stage={stage} />
        ) : (
          <MissingData label="Thiếu stage/templateStage trong response API" />
        );
      },
    },
    {
      title: t("survey.reports.col.employee"),
      dataIndex: "employeeName",
      key: "employeeName",
      width: 220,
      render: (value?: string, row?: SurveyResponseSummaryExt) => (
        <div className="min-w-0">
          <TextCell value={value} maxWidth={190} />
          {row?.departmentName ? (
            <Tooltip title={row.departmentName}>
              <div className="mt-0.5 max-w-[190px] truncate text-xs text-slate-400">
                {row.departmentName}
              </div>
            </Tooltip>
          ) : null}
        </div>
      ),
    },
    {
      title: tr("survey.reports.col.target_role", "Đối tượng"),
      key: "targetRole",
      width: 140,
      render: (row: SurveyResponseSummaryExt) => {
        const targetRole = getValue(row, [
          "targetRole",
          "responderRole",
          "role",
        ]);

        return targetRole ? (
          <Tag
            color={targetRole.toUpperCase() === "MANAGER" ? "purple" : "blue"}
          >
            {targetRole}
          </Tag>
        ) : (
          <MissingData label="Thiếu targetRole/responderRole trong response API" />
        );
      },
    },
    {
      title: tr("survey.reports.col.status", "Trạng thái"),
      key: "status",
      width: 140,
      render: (row: SurveyResponseSummaryExt) => {
        const status = getValue(row, [
          "status",
          "instanceStatus",
          "surveyStatus",
        ]);

        return status ? (
          <InstanceStatusTag status={status} />
        ) : (
          <MissingData label="Thiếu status/instanceStatus trong response API" />
        );
      },
    },
    {
      title: t("survey.reports.col.score"),
      dataIndex: "overallScore",
      key: "overallScore",
      width: 110,
      render: (value) => {
        const score = formatScore(value);

        return score === "—" ? (
          <MissingData label="Không có điểm tổng" />
        ) : (
          <Tooltip
            title={`${tr("survey.reports.avg_score", "Điểm trung bình")}: ${score}`}
          >
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500">
              <Star className="h-3.5 w-3.5" />
              {score}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: t("survey.reports.col.submitted"),
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 140,
      render: (date?: string | null) => {
        const formatted = formatDate(date);

        return formatted ? (
          <Tooltip title={date}>
            <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500 ring-1 ring-inset ring-slate-200">
              {formatted}
            </span>
          </Tooltip>
        ) : (
          <MissingData label="Thiếu submittedAt" />
        );
      },
    },
    {
      title: tr("survey.reports.col.due_at", "Hạn phản hồi"),
      key: "closedAt",
      width: 150,
      render: (row: SurveyResponseSummaryExt) => {
        const dueAt = getValue(row, [
          "closedAt",
          "dueAt",
          "dueDate",
          "deadline",
        ]);

        const formatted = formatDate(dueAt);

        return formatted ? (
          <Tooltip title={dueAt}>
            <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-xs text-slate-500 ring-1 ring-inset ring-slate-200">
              {formatted}
            </span>
          </Tooltip>
        ) : (
          <MissingData label="Thiếu closedAt/dueAt trong response API" />
        );
      },
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#223A59]">
          {t("survey.reports.responses")}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {tr(
            "survey.reports.responses_desc",
            "Danh sách phản hồi khảo sát đã nộp. Di chuột vào ô bị rút gọn để xem đầy đủ.",
          )}
        </p>
      </div>

      <MyTable
        rowKey={(row) =>
          row.surveyResponseId ||
          row.surveyInstanceId ||
          `${row.templateName}-${row.employeeName}-${row.submittedAt}`
        }
        columns={columns}
        dataSource={Array.isArray(responses) ? responses : []}
        loading={loading}
        pagination={{ pageSize: 10 }}
        wrapClassName="w-full survey-response-table"
        scroll={{ x: 1420 }}
        locale={{
          emptyText: <Empty description={t("survey.reports.no_data")} />,
        }}
        rowClassName="transition-colors hover:bg-blue-50/40"
      />
    </div>
  );
};

export default SurveyResponsesTable;

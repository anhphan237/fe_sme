import { useMemo, useState } from "react";
import {
  Card,
  Descriptions,
  Drawer,
  Empty,
  Progress,
  Space,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  MessageSquareText,
  Star,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";

import { useLocale } from "@/i18n";

type DimensionScore = {
  dimensionCode?: string;
  averageScore?: number | null;
  answerCount?: number | null;
  level?: "GOOD" | "NORMAL" | "LOW" | "RISK" | "NO_SCORE" | string;
};

type TextFeedback = {
  surveyResponseId?: string;
  surveyInstanceId?: string;
  templateName?: string;
  questionId?: string;
  questionText?: string;
  dimensionCode?: string;
  answer?: string;
  submittedAt?: string;
};

type AnswerDetail = {
  surveyResponseId?: string;
  surveyInstanceId?: string;
  questionId?: string;
  questionText?: string;
  questionType?: string;
  dimensionCode?: string;
  valueRating?: number | null;
  valueText?: string | null;
  valueChoice?: string | null;
  valueChoices?: string[];
};

type ResponseSummary = {
  surveyResponseId?: string;
  surveyInstanceId?: string;
  surveyTemplateId?: string;
  templateName?: string;
  onboardingId?: string;
  stage?: string;

  employeeId?: string;
  employeeUserId?: string;
  employeeName?: string;
  employeeEmail?: string;
  jobTitle?: string | null;
  departmentName?: string | null;

  managerUserId?: string;
  managerName?: string;

  overallScore?: number | null;
  submittedAt?: string;

  dimensionScores?: DimensionScore[];
  answerDetails?: AnswerDetail[];
  textFeedbacks?: TextFeedback[];
};

type EmployeeInsight = {
  employeeKey?: string;

  employeeId?: string;
  employeeUserId?: string;
  employeeName?: string;
  employeeEmail?: string;
  jobTitle?: string | null;
  departmentName?: string | null;

  managerUserId?: string;
  managerName?: string;

  responseCount?: number;
  validScoreCount?: number;

  averageScore?: number | null;
  latestScore?: number | null;
  highestScore?: number | null;
  lowestScore?: number | null;
  scoreSpread?: number | null;

  latestTemplateName?: string;
  lowestTemplateName?: string;
  highestTemplateName?: string;
  latestSubmittedAt?: string;

  trend?: "IMPROVING" | "DECLINING" | "STABLE" | "SINGLE" | "NO_SCORE" | string;
  riskLevel?: "POSITIVE" | "STABLE" | "NEED_FOLLOW_UP" | "RISK" | "NO_SCORE" | string;

  dimensionScores?: DimensionScore[];
  weakDimensions?: DimensionScore[];
  strongDimensions?: DimensionScore[];

  textFeedbacks?: TextFeedback[];
  responses?: ResponseSummary[];

  summary?: string;
  recommendation?: string;
};

type SurveyAnalyticsLike = {
  employeeInsights?: EmployeeInsight[];
  responseSummaries?: ResponseSummary[];
};

type Props = {
  analytics?: SurveyAnalyticsLike | null;
  loading?: boolean;
};

const tr = (t: (key: string) => string, key: string, fallback: string) => {
  const value = t(key);
  return value === key ? fallback : value;
};

const toNumber = (value?: number | string | null) => {
  if (value == null || value === "") return 0;

  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatScore = (value?: number | string | null) => {
  const n = toNumber(value);
  return n > 0 ? n.toFixed(2) : "—";
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";

  const d = dayjs(value);
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : value;
};

const getScorePercent = (score?: number | string | null) =>
  Math.min((toNumber(score) / 5) * 100, 100);

const normalizeStage = (stage?: string) => {
  const value = String(stage ?? "").trim().toUpperCase();

  if (value === "DAY_7") return "D7";
  if (value === "DAY_30") return "D30";
  if (value === "DAY_60") return "D60";

  return value || "—";
};

const getRiskOrder = (riskLevel?: string) => {
  const value = String(riskLevel ?? "").toUpperCase();

  if (value === "RISK") return 1;
  if (value === "NEED_FOLLOW_UP") return 2;
  if (value === "STABLE") return 3;
  if (value === "POSITIVE") return 4;
  if (value === "NO_SCORE") return 5;

  return 99;
};

const normalizeEmployeeInsights = (
  analytics?: SurveyAnalyticsLike | null,
): EmployeeInsight[] => {
  const list = analytics?.employeeInsights;

  if (!Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    const riskCompare = getRiskOrder(a.riskLevel) - getRiskOrder(b.riskLevel);
    if (riskCompare !== 0) return riskCompare;

    return toNumber(a.averageScore) - toNumber(b.averageScore);
  });
};

const getRiskMeta = (t: (key: string) => string, riskLevel?: string) => {
  const value = String(riskLevel ?? "NO_SCORE").toUpperCase();

  if (value === "POSITIVE") {
    return {
      color: "success",
      label: tr(t, "survey.reports.employee.level.positive", "Tích cực"),
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    };
  }

  if (value === "STABLE") {
    return {
      color: "blue",
      label: tr(t, "survey.reports.employee.level.stable", "Ổn định"),
      icon: <TrendingUp className="h-3.5 w-3.5" />,
    };
  }

  if (value === "NEED_FOLLOW_UP") {
    return {
      color: "warning",
      label: tr(t, "survey.reports.employee.level.follow_up", "Cần theo dõi"),
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    };
  }

  if (value === "RISK") {
    return {
      color: "error",
      label: tr(t, "survey.reports.employee.level.risk", "Rủi ro"),
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    };
  }

  return {
    color: "default",
    label: tr(t, "survey.reports.employee.level.no_score", "Chưa đủ điểm"),
    icon: <Clock3 className="h-3.5 w-3.5" />,
  };
};

const getTrendMeta = (t: (key: string) => string, trend?: string) => {
  const value = String(trend ?? "NO_SCORE").toUpperCase();

  if (value === "IMPROVING") {
    return {
      color: "success",
      label: tr(t, "survey.reports.employee.trend.improving", "Đang cải thiện"),
    };
  }

  if (value === "DECLINING") {
    return {
      color: "error",
      label: tr(t, "survey.reports.employee.trend.declining", "Có dấu hiệu giảm"),
    };
  }

  if (value === "STABLE") {
    return {
      color: "blue",
      label: tr(t, "survey.reports.employee.trend.stable", "Ổn định"),
    };
  }

  if (value === "SINGLE") {
    return {
      color: "default",
      label: tr(t, "survey.reports.employee.trend.single", "Chỉ có 1 phản hồi"),
    };
  }

  return {
    color: "default",
    label: tr(t, "survey.reports.employee.trend.no_score", "Chưa đủ điểm"),
  };
};

const getDimensionLevelColor = (level?: string) => {
  const value = String(level ?? "").toUpperCase();

  if (value === "GOOD") return "green";
  if (value === "NORMAL") return "blue";
  if (value === "LOW") return "gold";
  if (value === "RISK") return "red";

  return "default";
};

const formatDimensionLabel = (t: (key: string) => string, code?: string) => {
  const normalized = String(code ?? "").toUpperCase();

  const map: Record<string, string> = {
    GENERAL: tr(t, "survey.dimension.general", "Tổng quan"),
    ROLE_FIT: tr(t, "survey.dimension.roleFit", "Phù hợp vai trò"),
    ONBOARDING_CLARITY: tr(
      t,
      "survey.dimension.onboardingClarity",
      "Kế hoạch onboarding",
    ),
    TRAINING: tr(t, "survey.dimension.training", "Đào tạo"),
    MANAGER_SUPPORT: tr(
      t,
      "survey.dimension.managerSupport",
      "Hỗ trợ từ quản lý",
    ),
    TEAM_SUPPORT: tr(t, "survey.dimension.teamSupport", "Hòa nhập đội nhóm"),
    TOOLS_ACCESS: tr(t, "survey.dimension.toolsAccess", "Công cụ làm việc"),
    CULTURE: tr(t, "survey.dimension.culture", "Văn hóa"),
  };

  return map[normalized] || normalized || "—";
};

const getQuestionTypeLabel = (t: (key: string) => string, type?: string) => {
  const value = String(type ?? "").toUpperCase();

  if (value === "RATING") {
    return tr(t, "survey.question.type.rating", "Chấm điểm");
  }

  if (value === "TEXT") {
    return tr(t, "survey.question.type.text", "Văn bản");
  }

  if (value === "SINGLE_CHOICE") {
    return tr(t, "survey.question.type.singleChoice", "Một lựa chọn");
  }

  if (value === "MULTIPLE_CHOICE") {
    return tr(t, "survey.question.type.multipleChoice", "Nhiều lựa chọn");
  }

  return value || "—";
};

const formatAnswerValue = (answer: AnswerDetail) => {
  const type = String(answer.questionType ?? "").toUpperCase();

  if (type === "RATING") {
    return answer.valueRating != null ? `${answer.valueRating}/5` : "—";
  }

  if (type === "TEXT") {
    return answer.valueText || "—";
  }

  if (type === "SINGLE_CHOICE") {
    return answer.valueChoice || "—";
  }

  if (type === "MULTIPLE_CHOICE") {
    const choices = Array.isArray(answer.valueChoices) ? answer.valueChoices : [];
    if (choices.length > 0) return choices.join(", ");

    return answer.valueText || "—";
  }

  return answer.valueText || answer.valueChoice || "—";
};

const getAttentionTag = (t: (key: string) => string, row: EmployeeInsight) => {
  const riskLevel = String(row.riskLevel ?? "").toUpperCase();
  const trend = String(row.trend ?? "").toUpperCase();

  if (riskLevel === "RISK") {
    return (
      <Tag color="red">
        {tr(t, "survey.reports.employee.attention.risk", "Cần HR can thiệp sớm")}
      </Tag>
    );
  }

  if (riskLevel === "NEED_FOLLOW_UP") {
    return (
      <Tag color="gold">
        {tr(t, "survey.reports.employee.attention.follow_up", "Nên follow-up")}
      </Tag>
    );
  }

  if (trend === "DECLINING") {
    return (
      <Tag color="orange">
        {tr(t, "survey.reports.employee.attention.declining", "Điểm đang giảm")}
      </Tag>
    );
  }

  if (toNumber(row.scoreSpread) >= 1.5) {
    return (
      <Tag color="purple">
        {tr(t, "survey.reports.employee.attention.unstable", "Điểm dao động")}
      </Tag>
    );
  }

  if (riskLevel === "POSITIVE") {
    return (
      <Tag color="green">
        {tr(t, "survey.reports.employee.attention.good", "Thích nghi tốt")}
      </Tag>
    );
  }

  return (
    <Tag color="blue">
      {tr(t, "survey.reports.employee.attention.normal", "Đang ổn định")}
    </Tag>
  );
};

const renderDimensionList = (
  t: (key: string) => string,
  dimensions?: DimensionScore[],
  max = 3,
) => {
  const list = dimensions ?? [];

  if (list.length === 0) return "—";

  return (
    <Space size={4} wrap>
      {list.slice(0, max).map((item) => (
        <Tag
          key={`${item.dimensionCode}-${item.averageScore}`}
          color={getDimensionLevelColor(item.level)}
        >
          {formatDimensionLabel(t, item.dimensionCode)}:{" "}
          {formatScore(item.averageScore)}
        </Tag>
      ))}
    </Space>
  );
};

const SurveyEmployeeInsightCard = ({ analytics, loading }: Props) => {
  const { t } = useLocale();

  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeInsight | null>(null);

  const employeeInsights = useMemo(
    () => normalizeEmployeeInsights(analytics),
    [analytics],
  );

  const totalEmployees = employeeInsights.length;
  const riskCount = employeeInsights.filter(
    (item) => String(item.riskLevel ?? "").toUpperCase() === "RISK",
  ).length;
  const followUpCount = employeeInsights.filter(
    (item) => String(item.riskLevel ?? "").toUpperCase() === "NEED_FOLLOW_UP",
  ).length;

  const columns: ColumnsType<EmployeeInsight> = [
    {
      title: tr(t, "survey.reports.employee.table.employee", "Nhân viên"),
      key: "employee",
      fixed: "left",
      width: 250,
      render: (_, row) => (
        <button
          type="button"
          className="text-left"
          onClick={() => setSelectedEmployee(row)}
        >
          <div className="font-semibold text-slate-900 hover:text-blue-600">
            {row.employeeName || "—"}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {row.employeeEmail || "—"}
          </div>

          <div className="mt-1 text-xs text-slate-400">
            {[row.jobTitle, row.departmentName].filter(Boolean).join(" • ") ||
              "—"}
          </div>
        </button>
      ),
    },
    {
      title: tr(t, "survey.reports.employee.table.manager", "Quản lý"),
      key: "managerName",
      width: 160,
      render: (_, row) => (
        <span className="text-sm text-slate-700">{row.managerName || "—"}</span>
      ),
    },
    {
      title: tr(t, "survey.reports.employee.table.response_count", "Số phản hồi"),
      key: "responseCount",
      width: 130,
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900">
            {row.responseCount ?? 0}
          </div>
          <div className="text-xs text-slate-500">
            {row.validScoreCount ?? 0}{" "}
            {tr(t, "survey.reports.employee.table.valid_scores", "có điểm")}
          </div>
        </div>
      ),
    },
    {
      title: tr(t, "survey.reports.employee.table.average_score", "Điểm TB"),
      key: "averageScore",
      width: 140,
      sorter: (a, b) => toNumber(a.averageScore) - toNumber(b.averageScore),
      render: (_, row) => (
        <div className="min-w-[100px]">
          <div className="font-semibold text-slate-900">
            {formatScore(row.averageScore)}/5
          </div>
          <Progress
            percent={getScorePercent(row.averageScore)}
            showInfo={false}
            size="small"
          />
        </div>
      ),
    },
    {
      title: tr(t, "survey.reports.employee.table.assessment", "Nhận định"),
      key: "riskLevel",
      width: 150,
      render: (_, row) => {
        const meta = getRiskMeta(t, row.riskLevel);

        return (
          <Tag color={meta.color} className="inline-flex items-center gap-1">
            {meta.icon}
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: tr(t, "survey.reports.employee.table.trend", "Xu hướng"),
      key: "trend",
      width: 150,
      render: (_, row) => {
        const meta = getTrendMeta(t, row.trend);

        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: tr(t, "survey.reports.employee.table.attention", "Điểm cần chú ý"),
      key: "attention",
      width: 180,
      render: (_, row) => getAttentionTag(t, row),
    },
    {
      title: tr(t, "survey.reports.employee.table.weak_dimensions", "Nhóm yếu"),
      key: "weakDimensions",
      width: 280,
      render: (_, row) => renderDimensionList(t, row.weakDimensions),
    },
    {
      title: tr(
        t,
        "survey.reports.employee.table.latest_response",
        "Phản hồi gần nhất",
      ),
      key: "latestSubmittedAt",
      width: 170,
      render: (_, row) => (
        <span className="text-sm text-slate-600">
          {formatDateTime(row.latestSubmittedAt)}
        </span>
      ),
    },
    {
      title: tr(t, "global.action", "Thao tác"),
      key: "action",
      width: 110,
      fixed: "right",
      render: (_, row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedEmployee(row);
          }}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600"
        >
          <Eye className="h-3.5 w-3.5" />
          {tr(t, "survey.reports.employee.view_detail", "Chi tiết")}
        </button>
      ),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <UserRoundCheck className="h-4 w-4" />
          </div>

          <div>
            <h3 className="text-base font-semibold text-[#223A59]">
              {tr(
                t,
                "survey.reports.employee.title",
                "Chi tiết theo từng nhân viên",
              )}
            </h3>

            <p className="mt-0.5 text-sm text-slate-500">
              {tr(
                t,
                "survey.reports.employee.subtitle",
                "Theo dõi điểm khảo sát, nhóm điểm yếu, phản hồi văn bản và đề xuất hỗ trợ cho từng nhân viên.",
              )}
            </p>
          </div>
        </div>

        <Space size={8} wrap>
          <Tag color="blue">
            {totalEmployees}{" "}
            {tr(t, "survey.reports.employee.count_label", "nhân viên")}
          </Tag>

          {followUpCount > 0 && (
            <Tag color="gold">
              {followUpCount}{" "}
              {tr(t, "survey.reports.employee.need_follow_up", "cần theo dõi")}
            </Tag>
          )}

          {riskCount > 0 && (
            <Tag color="red">
              {riskCount} {tr(t, "survey.reports.employee.risk", "rủi ro")}
            </Tag>
          )}
        </Space>
      </div>

      <Table<EmployeeInsight>
        rowKey={(row) =>
          row.employeeKey ||
          row.employeeUserId ||
          row.employeeId ||
          row.employeeName ||
          "UNKNOWN"
        }
        columns={columns}
        dataSource={employeeInsights}
        loading={loading}
        scroll={{ x: 1570 }}
        pagination={{ pageSize: 6 }}
        locale={{
          emptyText: (
            <Empty
              description={tr(
                t,
                "survey.reports.employee.empty",
                "Chưa có dữ liệu phản hồi theo nhân viên",
              )}
            />
          ),
        }}
        onRow={(record) => ({
          onClick: () => setSelectedEmployee(record),
          className: "cursor-pointer",
        })}
      />

      <Drawer
        open={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployee(null)}
        width={860}
        title={tr(
          t,
          "survey.reports.employee.drawer_title",
          "Chi tiết khảo sát của nhân viên",
        )}
      >
        {selectedEmployee && (
          <div className="space-y-5">
            <Card className="border border-slate-200">
              <Descriptions column={1} size="small">
                <Descriptions.Item
                  label={tr(
                    t,
                    "survey.reports.employee.field.employee",
                    "Nhân viên",
                  )}
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {selectedEmployee.employeeName || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedEmployee.employeeEmail || "—"}
                    </div>
                  </div>
                </Descriptions.Item>

                <Descriptions.Item
                  label={tr(
                    t,
                    "survey.reports.employee.field.position",
                    "Vị trí / Phòng ban",
                  )}
                >
                  {[selectedEmployee.jobTitle, selectedEmployee.departmentName]
                    .filter(Boolean)
                    .join(" • ") || "—"}
                </Descriptions.Item>

                <Descriptions.Item
                  label={tr(
                    t,
                    "survey.reports.employee.field.manager",
                    "Quản lý trực tiếp",
                  )}
                >
                  {selectedEmployee.managerName || "—"}
                </Descriptions.Item>

                <Descriptions.Item
                  label={tr(
                    t,
                    "survey.reports.employee.field.response_count",
                    "Số phản hồi",
                  )}
                >
                  {selectedEmployee.responseCount ?? 0} /{" "}
                  {selectedEmployee.validScoreCount ?? 0}{" "}
                  {tr(t, "survey.reports.employee.table.valid_scores", "có điểm")}
                </Descriptions.Item>

                <Descriptions.Item
                  label={tr(
                    t,
                    "survey.reports.employee.field.latest_response",
                    "Phản hồi gần nhất",
                  )}
                >
                  {formatDateTime(selectedEmployee.latestSubmittedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="border border-slate-200">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">
                    {tr(
                      t,
                      "survey.reports.employee.overall_assessment",
                      "Nhận định tổng quan",
                    )}
                  </p>

                  <div className="mt-1">
                    {(() => {
                      const meta = getRiskMeta(t, selectedEmployee.riskLevel);

                      return (
                        <Tag
                          color={meta.color}
                          className="inline-flex items-center gap-1"
                        >
                          {meta.icon}
                          {meta.label}
                        </Tag>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    {tr(
                      t,
                      "survey.reports.employee.average_score",
                      "Điểm trung bình",
                    )}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatScore(selectedEmployee.averageScore)}/5
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Star className="h-4 w-4 text-amber-500" />
                  {tr(t, "survey.reports.employee.summary_title", "Tóm tắt")}
                </div>

                <p className="text-sm leading-6 text-slate-700">
                  {selectedEmployee.summary ||
                    tr(
                      t,
                      "survey.reports.employee.summary.empty",
                      "Chưa có nhận định chi tiết cho nhân viên này.",
                    )}
                </p>
              </div>

              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <AlertTriangle className="h-4 w-4" />
                  {tr(
                    t,
                    "survey.reports.employee.recommendation_title",
                    "Đề xuất cho HR",
                  )}
                </div>

                <p className="text-sm leading-6 text-blue-700">
                  {selectedEmployee.recommendation ||
                    tr(
                      t,
                      "survey.reports.employee.recommendation.empty",
                      "Chưa có đề xuất cụ thể cho nhân viên này.",
                    )}
                </p>
              </div>
            </Card>

            <Card className="border border-slate-200">
              <h3 className="mb-4 font-semibold text-slate-900">
                {tr(
                  t,
                  "survey.reports.employee.score_analysis",
                  "Phân tích điểm khảo sát",
                )}
              </h3>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    {tr(
                      t,
                      "survey.reports.employee.latest_score",
                      "Điểm mới nhất",
                    )}
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {formatScore(selectedEmployee.latestScore)}/5
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedEmployee.latestTemplateName || "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    {tr(
                      t,
                      "survey.reports.employee.lowest_score",
                      "Điểm thấp nhất",
                    )}
                  </p>
                  <p className="mt-1 text-xl font-bold text-red-600">
                    {formatScore(selectedEmployee.lowestScore)}/5
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedEmployee.lowestTemplateName || "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    {tr(
                      t,
                      "survey.reports.employee.highest_score",
                      "Điểm cao nhất",
                    )}
                  </p>
                  <p className="mt-1 text-xl font-bold text-green-600">
                    {formatScore(selectedEmployee.highestScore)}/5
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedEmployee.highestTemplateName || "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">
                    {tr(t, "survey.reports.employee.trend_label", "Xu hướng")}
                  </p>

                  <div className="mt-2">
                    {(() => {
                      const meta = getTrendMeta(t, selectedEmployee.trend);

                      return <Tag color={meta.color}>{meta.label}</Tag>;
                    })()}
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {tr(
                      t,
                      "survey.reports.employee.score_spread",
                      "Dao động điểm",
                    )}
                    : {formatScore(selectedEmployee.scoreSpread)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200">
              <h3 className="mb-4 font-semibold text-slate-900">
                {tr(
                  t,
                  "survey.reports.employee.dimension_analysis",
                  "Phân tích theo nhóm đánh giá",
                )}
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-3 text-sm font-semibold text-red-600">
                    {tr(
                      t,
                      "survey.reports.employee.weak_dimensions",
                      "Nhóm cần cải thiện",
                    )}
                  </p>

                  {(selectedEmployee.weakDimensions ?? []).length === 0 ? (
                    <Empty
                      description={tr(
                        t,
                        "survey.reports.employee.no_weak_dimensions",
                        "Chưa có dữ liệu nhóm cần cải thiện",
                      )}
                    />
                  ) : (
                    <Space direction="vertical" className="w-full" size={10}>
                      {(selectedEmployee.weakDimensions ?? []).map((item) => (
                        <div
                          key={`${item.dimensionCode}-${item.averageScore}`}
                          className="rounded-xl border border-red-100 bg-red-50 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-slate-800">
                              {formatDimensionLabel(t, item.dimensionCode)}
                            </span>
                            <Tag color={getDimensionLevelColor(item.level)}>
                              {formatScore(item.averageScore)}/5
                            </Tag>
                          </div>

                          <Progress
                            className="mt-2"
                            percent={getScorePercent(item.averageScore)}
                            showInfo={false}
                            size="small"
                          />
                        </div>
                      ))}
                    </Space>
                  )}
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-green-600">
                    {tr(
                      t,
                      "survey.reports.employee.strong_dimensions",
                      "Nhóm thể hiện tốt",
                    )}
                  </p>

                  {(selectedEmployee.strongDimensions ?? []).length === 0 ? (
                    <Empty
                      description={tr(
                        t,
                        "survey.reports.employee.no_strong_dimensions",
                        "Chưa có dữ liệu nhóm thể hiện tốt",
                      )}
                    />
                  ) : (
                    <Space direction="vertical" className="w-full" size={10}>
                      {(selectedEmployee.strongDimensions ?? []).map((item) => (
                        <div
                          key={`${item.dimensionCode}-${item.averageScore}`}
                          className="rounded-xl border border-green-100 bg-green-50 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-slate-800">
                              {formatDimensionLabel(t, item.dimensionCode)}
                            </span>
                            <Tag color={getDimensionLevelColor(item.level)}>
                              {formatScore(item.averageScore)}/5
                            </Tag>
                          </div>

                          <Progress
                            className="mt-2"
                            percent={getScorePercent(item.averageScore)}
                            showInfo={false}
                            size="small"
                          />
                        </div>
                      ))}
                    </Space>
                  )}
                </div>
              </div>
            </Card>

            <Card className="border border-slate-200">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900">
                  {tr(
                    t,
                    "survey.reports.employee.text_feedbacks",
                    "Phản hồi dạng văn bản",
                  )}
                </h3>
              </div>

              {(selectedEmployee.textFeedbacks ?? []).length === 0 ? (
                <Empty
                  description={tr(
                    t,
                    "survey.reports.employee.no_text_feedbacks",
                    "Chưa có phản hồi văn bản",
                  )}
                />
              ) : (
                <Space direction="vertical" className="w-full" size={10}>
                  {(selectedEmployee.textFeedbacks ?? []).map((item, index) => (
                    <div
                      key={`${item.surveyResponseId}-${item.questionId}-${index}`}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase text-slate-400">
                          {item.templateName || "—"}
                        </p>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(item.submittedAt)}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-slate-800">
                        {item.questionText || "—"}
                      </p>

                      <p className="mt-2 rounded-lg bg-white p-2 text-sm leading-6 text-slate-700">
                        {item.answer || "—"}
                      </p>
                    </div>
                  ))}
                </Space>
              )}
            </Card>

            <Card className="border border-slate-200">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900">
                  {tr(
                    t,
                    "survey.reports.employee.response_history",
                    "Lịch sử phản hồi khảo sát",
                  )}
                </h3>
              </div>

              <Table<ResponseSummary>
                rowKey={(row) =>
                  row.surveyResponseId ||
                  row.surveyInstanceId ||
                  `${row.templateName}-${row.submittedAt}`
                }
                dataSource={selectedEmployee.responses ?? []}
                pagination={false}
                size="small"
                expandable={{
                  rowExpandable: (row) => (row.answerDetails ?? []).length > 0,
                  expandedRowRender: (row) => (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <Table<AnswerDetail>
                        rowKey={(answer) =>
                          `${answer.surveyResponseId}-${answer.questionId}`
                        }
                        dataSource={row.answerDetails ?? []}
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: tr(
                              t,
                              "survey.reports.employee.answer_table.question",
                              "Câu hỏi",
                            ),
                            key: "questionText",
                            render: (_, answer) => (
                              <div>
                                <div className="text-sm font-medium text-slate-800">
                                  {answer.questionText || "—"}
                                </div>
                                <div className="mt-1 text-xs text-slate-400">
                                  {formatDimensionLabel(t, answer.dimensionCode)}
                                </div>
                              </div>
                            ),
                          },
                          {
                            title: tr(
                              t,
                              "survey.reports.employee.answer_table.type",
                              "Loại",
                            ),
                            key: "questionType",
                            width: 130,
                            render: (_, answer) => (
                              <Tag>
                                {getQuestionTypeLabel(t, answer.questionType)}
                              </Tag>
                            ),
                          },
                          {
                            title: tr(
                              t,
                              "survey.reports.employee.answer_table.answer",
                              "Câu trả lời",
                            ),
                            key: "answer",
                            width: 220,
                            render: (_, answer) => (
                              <span className="text-sm text-slate-700">
                                {formatAnswerValue(answer)}
                              </span>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ),
                }}
                columns={[
                  {
                    title: tr(
                      t,
                      "survey.reports.employee.response_table.template",
                      "Mẫu khảo sát",
                    ),
                    key: "templateName",
                    render: (_, row) => (
                      <div>
                        <div className="font-medium text-slate-800">
                          {row.templateName || "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {normalizeStage(row.stage)}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: tr(
                      t,
                      "survey.reports.employee.response_table.score",
                      "Điểm",
                    ),
                    key: "overallScore",
                    width: 100,
                    render: (_, row) => `${formatScore(row.overallScore)}/5`,
                  },
                  {
                    title: tr(
                      t,
                      "survey.reports.employee.response_table.weak_dimensions",
                      "Nhóm điểm",
                    ),
                    key: "dimensionScores",
                    width: 260,
                    render: (_, row) =>
                      renderDimensionList(t, row.dimensionScores, 2),
                  },
                  {
                    title: tr(
                      t,
                      "survey.reports.employee.response_table.submitted_at",
                      "Ngày phản hồi",
                    ),
                    key: "submittedAt",
                    width: 170,
                    render: (_, row) => formatDateTime(row.submittedAt),
                  },
                ]}
              />
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SurveyEmployeeInsightCard;
import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Progress,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Search,
  Star,
  Target,
  UserRoundCheck,
  XCircle,
} from "lucide-react";

import { useLocale } from "@/i18n";
import { apiGetManagerEvaluationReport } from "@/api/survey/survey.api";

type Filters = {
  startDate?: string;
  endDate?: string;
  keyword?: string;
  status?: string;
  fitLevel?: string;
};

type DimensionScore = {
  dimensionCode?: string | null;
  dimensionName?: string | null;
  score?: number | null;
  answerCount?: number | null;
  level?: "GOOD" | "NORMAL" | "LOW" | "RISK" | "NO_SCORE" | string;
};

type TextFeedback = {
  questionId?: string | null;
  question?: string | null;
  answer?: string | null;
  dimensionCode?: string | null;
  dimensionName?: string | null;
  category?:
    | "STRENGTH"
    | "IMPROVEMENT"
    | "OVERALL_COMMENT"
    | "RECOMMENDATION"
    | "OTHER"
    | string;
};

type AnswerDetail = {
  questionId?: string | null;
  question?: string | null;
  questionType?:
    | "RATING"
    | "TEXT"
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | string;
  dimensionCode?: string | null;
  dimensionName?: string | null;
  valueRating?: number | null;
  valueText?: string | null;
  valueChoice?: string | null;
  valueChoices?: string[];
};

type EmployeeEvaluationRow = {
  surveyInstanceId?: string | null;
  surveyResponseId?: string | null;
  onboardingId?: string | null;

  employeeUserId?: string | null;
  employeeName?: string | null;
  employeeEmail?: string | null;
  jobTitle?: string | null;
  departmentName?: string | null;

  managerUserId?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;

  status?: "PENDING" | "SUBMITTED" | "EXPIRED" | string | null;
  averageScore?: number | null;

  recommendation?: string | null;
  recommendationDecision?:
    | "CONTINUE_OFFICIAL"
    | "EXTEND_PROBATION"
    | "NEED_TRAINING"
    | "NOT_CONTINUE"
    | "UNKNOWN"
    | string
    | null;
  recommendationLabel?: string | null;

  fitLevel?: "FIT" | "FOLLOW_UP" | "NOT_FIT" | "NOT_EVALUATED" | string | null;
  fitLabel?: string | null;

  sentAt?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;

  dimensionScores?: DimensionScore[];
  weakDimensions?: DimensionScore[];
  strongDimensions?: DimensionScore[];

  textFeedbacks?: TextFeedback[];
  answerDetails?: AnswerDetail[];

  summary?: string | null;
  actionRecommendation?: string | null;

  strengths?: string[];
  improvementAreas?: string[];
  overallComments?: string[];
};

type Summary = {
  totalEmployees: number;
  sentCount: number;
  submittedCount: number;
  pendingCount: number;
  responseRate: number;
  averageScore: number | null;

  fitCount: number;
  needFollowUpCount: number;
  notFitCount: number;
  notEvaluatedCount: number;

  officialRecommendedCount: number;
  trainingRecommendedCount: number;
  extendProbationCount: number;
  notContinueCount: number;
};

type ReportResponse = {
  summary?: Partial<Summary>;
  employees?: EmployeeEvaluationRow[];
  managerEvaluationInsights?: EmployeeEvaluationRow[];
};

type NormalizedReport = {
  summary: Summary;
  employees: EmployeeEvaluationRow[];
};

const DEFAULT_SUMMARY: Summary = {
  totalEmployees: 0,
  sentCount: 0,
  submittedCount: 0,
  pendingCount: 0,
  responseRate: 0,
  averageScore: null,

  fitCount: 0,
  needFollowUpCount: 0,
  notFitCount: 0,
  notEvaluatedCount: 0,

  officialRecommendedCount: 0,
  trainingRecommendedCount: 0,
  extendProbationCount: 0,
  notContinueCount: 0,
};

const DIMENSION_LABELS: Record<string, string> = {
  ROLE_FIT: "Mức độ phù hợp với vị trí",
  WORK_QUALITY: "Chất lượng thực hiện công việc",
  LEARNING_ABILITY: "Khả năng tiếp thu và thích nghi",
  PROACTIVENESS: "Mức độ chủ động",
  TEAM_INTEGRATION: "Khả năng hòa nhập đội nhóm",
  ATTITUDE_CULTURE: "Thái độ và phù hợp văn hóa",
  RECOMMENDATION: "Đề xuất tiếp tục chính thức",
  OVERALL_COMMENT: "Nhận xét tổng quan",
};

const DIMENSION_KEYS: Record<string, string> = {
  ROLE_FIT: "survey.dimension.manager.roleFit",
  WORK_QUALITY: "survey.dimension.manager.workQuality",
  LEARNING_ABILITY: "survey.dimension.manager.learningAbility",
  PROACTIVENESS: "survey.dimension.manager.proactiveness",
  TEAM_INTEGRATION: "survey.dimension.manager.teamIntegration",
  ATTITUDE_CULTURE: "survey.dimension.manager.attitudeCulture",
  RECOMMENDATION: "survey.dimension.manager.recommendation",
  OVERALL_COMMENT: "survey.dimension.manager.overallComment",
};

const tr = (t: (key: string) => string, key: string, fallback: string) => {
  const value = t(key);
  return value === key ? fallback : value;
};

const extractData = <T,>(res: unknown): T => {
  const raw = res as Record<string, unknown>;

  return (
    (raw?.data as T) ?? (raw?.result as T) ?? (raw?.payload as T) ?? (res as T)
  );
};

const toNumber = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const formatScore = (value?: number | null) => {
  if (value == null) return "—";

  const n = toNumber(value);
  return n > 0 ? n.toFixed(2) : "—";
};

const formatPercent = (value?: number | null) =>
  `${toNumber(value).toFixed(1)}%`;

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";

  const d = dayjs(value);
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : value;
};

const getScorePercent = (score?: number | null) =>
  Math.min((toNumber(score) / 5) * 100, 100);

const normalizeText = (value?: string | null) => String(value ?? "").trim();

const upper = (value?: string | null) => normalizeText(value).toUpperCase();

const getDimensionLabel = (
  t: (key: string) => string,
  dimensionCode?: string | null,
  dimensionName?: string | null,
) => {
  if (dimensionName) return dimensionName;

  const code = upper(dimensionCode);
  const key = DIMENSION_KEYS[code];

  if (!key) return code || "—";

  return tr(t, key, DIMENSION_LABELS[code] ?? code);
};

const getFitMeta = (t: (key: string) => string, fitLevel?: string | null) => {
  const level = upper(fitLevel);

  if (level === "FIT") {
    return {
      color: "success",
      text: tr(t, "survey.managerEvaluation.fit.fit", "Phù hợp"),
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    };
  }

  if (level === "FOLLOW_UP") {
    return {
      color: "warning",
      text: tr(t, "survey.managerEvaluation.fit.followUp", "Cần theo dõi thêm"),
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    };
  }

  if (level === "NOT_FIT") {
    return {
      color: "error",
      text: tr(t, "survey.managerEvaluation.fit.notFit", "Chưa phù hợp"),
      icon: <XCircle className="h-3.5 w-3.5" />,
    };
  }

  return {
    color: "default",
    text: tr(
      t,
      "survey.managerEvaluation.fit.notEvaluated",
      "Chưa được đánh giá",
    ),
    icon: <Clock3 className="h-3.5 w-3.5" />,
  };
};

const getRecommendationMeta = (
  t: (key: string) => string,
  decision?: string | null,
  fallback?: string | null,
) => {
  const value = upper(decision);

  if (value === "CONTINUE_OFFICIAL") {
    return {
      color: "success",
      label: tr(
        t,
        "survey.managerEvaluation.recommendation.continueOfficial",
        "Đề xuất tiếp tục chính thức",
      ),
    };
  }

  if (value === "EXTEND_PROBATION") {
    return {
      color: "warning",
      label: tr(
        t,
        "survey.managerEvaluation.recommendation.extendProbation",
        "Đề xuất theo dõi thêm",
      ),
    };
  }

  if (value === "NEED_TRAINING") {
    return {
      color: "processing",
      label: tr(
        t,
        "survey.managerEvaluation.recommendation.needTraining",
        "Đề xuất đào tạo/kèm thêm",
      ),
    };
  }

  if (value === "NOT_CONTINUE") {
    return {
      color: "error",
      label: tr(
        t,
        "survey.managerEvaluation.recommendation.notContinue",
        "Đề xuất không tiếp tục",
      ),
    };
  }

  return {
    color: "default",
    label:
      fallback ||
      tr(
        t,
        "survey.managerEvaluation.recommendation.unknown",
        "Chưa có đề xuất",
      ),
  };
};

const getStatusTag = (t: (key: string) => string, status?: string | null) => {
  const raw = upper(status);

  if (raw === "SUBMITTED" || raw === "DONE" || raw === "COMPLETED") {
    return (
      <Tag color="success">
        {tr(t, "survey.managerEvaluation.status.submitted", "Đã đánh giá")}
      </Tag>
    );
  }

  if (raw === "EXPIRED") {
    return (
      <Tag color="error">
        {tr(t, "survey.managerEvaluation.status.expired", "Quá hạn")}
      </Tag>
    );
  }

  if (raw === "SENT") {
    return (
      <Tag color="processing">
        {tr(t, "survey.managerEvaluation.status.sent", "Đã gửi")}
      </Tag>
    );
  }

  return (
    <Tag color="warning">
      {tr(t, "survey.managerEvaluation.status.pending", "Chờ quản lý")}
    </Tag>
  );
};

const getDimensionLevelColor = (level?: string | null) => {
  const value = upper(level);

  if (value === "GOOD") return "green";
  if (value === "NORMAL") return "blue";
  if (value === "LOW") return "gold";
  if (value === "RISK") return "red";

  return "default";
};

const getAttentionTag = (
  t: (key: string) => string,
  row: EmployeeEvaluationRow,
) => {
  const fitLevel = upper(row.fitLevel);
  const decision = upper(row.recommendationDecision);

  if (fitLevel === "NOT_FIT" || decision === "NOT_CONTINUE") {
    return (
      <Tag color="red">
        {tr(
          t,
          "survey.managerEvaluation.attention.notFit",
          "Cần quyết định nhân sự",
        )}
      </Tag>
    );
  }

  if (decision === "NEED_TRAINING") {
    return (
      <Tag color="blue">
        {tr(
          t,
          "survey.managerEvaluation.attention.training",
          "Cần đào tạo thêm",
        )}
      </Tag>
    );
  }

  if (fitLevel === "FOLLOW_UP" || decision === "EXTEND_PROBATION") {
    return (
      <Tag color="gold">
        {tr(t, "survey.managerEvaluation.attention.followUp", "Theo dõi thêm")}
      </Tag>
    );
  }

  if (fitLevel === "NOT_EVALUATED") {
    return (
      <Tag color="default">
        {tr(t, "survey.managerEvaluation.attention.waiting", "Chờ đánh giá")}
      </Tag>
    );
  }

  return (
    <Tag color="green">
      {tr(t, "survey.managerEvaluation.attention.official", "Có thể tiếp tục")}
    </Tag>
  );
};

const formatAnswerValue = (answer: AnswerDetail) => {
  const type = upper(answer.questionType);

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
    const choices = Array.isArray(answer.valueChoices)
      ? answer.valueChoices
      : [];
    if (choices.length > 0) return choices.join(", ");

    return answer.valueText || "—";
  }

  return answer.valueText || answer.valueChoice || "—";
};

const getQuestionTypeLabel = (
  t: (key: string) => string,
  type?: string | null,
) => {
  const value = upper(type);

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

const normalizeReport = (input?: ReportResponse | null): NormalizedReport => {
  const rawSummary = input?.summary ?? {};
  const sourceEmployees = Array.isArray(input?.managerEvaluationInsights)
    ? input.managerEvaluationInsights
    : Array.isArray(input?.employees)
      ? input.employees
      : [];

  return {
    summary: {
      ...DEFAULT_SUMMARY,
      ...rawSummary,
      totalEmployees: toNumber(rawSummary.totalEmployees),
      sentCount: toNumber(rawSummary.sentCount),
      submittedCount: toNumber(rawSummary.submittedCount),
      pendingCount: toNumber(rawSummary.pendingCount),
      responseRate: toNumber(rawSummary.responseRate),
      averageScore:
        rawSummary.averageScore == null
          ? null
          : toNumber(rawSummary.averageScore),

      fitCount: toNumber(rawSummary.fitCount),
      needFollowUpCount: toNumber(rawSummary.needFollowUpCount),
      notFitCount: toNumber(rawSummary.notFitCount),
      notEvaluatedCount: toNumber(rawSummary.notEvaluatedCount),

      officialRecommendedCount: toNumber(rawSummary.officialRecommendedCount),
      trainingRecommendedCount: toNumber(rawSummary.trainingRecommendedCount),
      extendProbationCount: toNumber(rawSummary.extendProbationCount),
      notContinueCount: toNumber(rawSummary.notContinueCount),
    },
    employees: sourceEmployees,
  };
};

const getFitOrder = (fitLevel?: string | null) => {
  const value = upper(fitLevel);

  if (value === "NOT_FIT") return 1;
  if (value === "FOLLOW_UP") return 2;
  if (value === "NOT_EVALUATED") return 3;
  if (value === "FIT") return 4;

  return 99;
};

const sortEmployees = (employees: EmployeeEvaluationRow[]) =>
  [...employees].sort((a, b) => {
    const fitCompare = getFitOrder(a.fitLevel) - getFitOrder(b.fitLevel);
    if (fitCompare !== 0) return fitCompare;

    const aScore = a.averageScore == null ? 999 : toNumber(a.averageScore);
    const bScore = b.averageScore == null ? 999 : toNumber(b.averageScore);

    if (aScore !== bScore) return aScore - bScore;

    return dayjs(b.submittedAt).valueOf() - dayjs(a.submittedAt).valueOf();
  });

const KpiCard = ({
  title,
  value,
  subtext,
  tone = "default",
  icon,
  loading,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  tone?: "default" | "success" | "warning" | "danger";
  icon: ReactNode;
  loading?: boolean;
}) => {
  const toneClass = {
    default: "border-slate-200 bg-white text-slate-500",
    success: "border-emerald-200 bg-emerald-50 text-emerald-600",
    warning: "border-amber-200 bg-amber-50 text-amber-600",
    danger: "border-red-200 bg-red-50 text-red-600",
  }[tone];

  if (loading) {
    return <div className="h-28 animate-pulse rounded-xl bg-slate-100" />;
  }

  return (
    <Card className={`border shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#223A59]">{value}</p>
          {subtext ? (
            <p className="mt-1 text-xs text-slate-500">{subtext}</p>
          ) : null}
        </div>
        <div className="shrink-0">{icon}</div>
      </div>
    </Card>
  );
};
type DistributionItem = {
  key: string;
  label: string;
  count: number;
  color: string;
};

const DistributionStatCard = ({
  item,
  total,
}: {
  item: DistributionItem;
  total: number;
}) => {
  const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`}
          />
          <p className="text-sm font-medium leading-5 text-slate-700">
            {item.label}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
          {percent}%
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="text-3xl font-bold leading-none text-[#223A59]">
          {item.count}
        </div>
        <div className="text-xs text-slate-400">/ {total}</div>
      </div>

      <Progress
        className="mt-4"
        percent={percent}
        showInfo={false}
        size="small"
      />
    </div>
  );
};
const ManagerEvaluationReportTab = () => {
  const { t } = useLocale();

  const [filters, setFilters] = useState<Filters>({});
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeEvaluationRow | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["manager-evaluation-employee-report", filters],
    queryFn: () =>
      apiGetManagerEvaluationReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        keyword: filters.keyword,
        status: filters.status,
        fitLevel: filters.fitLevel,
      }),
    select: (res: unknown) => normalizeReport(extractData<ReportResponse>(res)),
  });

  const report = data ?? normalizeReport();
  const summary = report.summary;

  const employees = useMemo(
    () => sortEmployees(report.employees),
    [report.employees],
  );

  const fitDistribution = useMemo(
    () => [
      {
        key: "FIT",
        label: tr(t, "survey.managerEvaluation.fit.fit", "Phù hợp"),
        count: summary.fitCount,
        color: "bg-emerald-500",
      },
      {
        key: "FOLLOW_UP",
        label: tr(
          t,
          "survey.managerEvaluation.fit.followUp",
          "Cần theo dõi thêm",
        ),
        count: summary.needFollowUpCount,
        color: "bg-amber-500",
      },
      {
        key: "NOT_FIT",
        label: tr(t, "survey.managerEvaluation.fit.notFit", "Chưa phù hợp"),
        count: summary.notFitCount,
        color: "bg-red-500",
      },
      {
        key: "NOT_EVALUATED",
        label: tr(
          t,
          "survey.managerEvaluation.fit.notEvaluated",
          "Chưa được đánh giá",
        ),
        count: summary.notEvaluatedCount,
        color: "bg-slate-300",
      },
    ],
    [summary, t],
  );

  const recommendationDistribution = useMemo(
    () => [
      {
        key: "CONTINUE_OFFICIAL",
        label: tr(
          t,
          "survey.managerEvaluation.recommendation.continueOfficial",
          "Tiếp tục chính thức",
        ),
        count: summary.officialRecommendedCount,
        color: "bg-emerald-500",
      },
      {
        key: "NEED_TRAINING",
        label: tr(
          t,
          "survey.managerEvaluation.recommendation.needTrainingShort",
          "Đào tạo thêm",
        ),
        count: summary.trainingRecommendedCount,
        color: "bg-blue-500",
      },
      {
        key: "EXTEND_PROBATION",
        label: tr(
          t,
          "survey.managerEvaluation.recommendation.extendProbationShort",
          "Theo dõi thêm",
        ),
        count: summary.extendProbationCount,
        color: "bg-amber-500",
      },
      {
        key: "NOT_CONTINUE",
        label: tr(
          t,
          "survey.managerEvaluation.recommendation.notContinueShort",
          "Không tiếp tục",
        ),
        count: summary.notContinueCount,
        color: "bg-red-500",
      },
    ],
    [summary, t],
  );

  const columns: ColumnsType<EmployeeEvaluationRow> = [
    {
      title: tr(t, "survey.managerEvaluation.table.employee", "Nhân viên"),
      key: "employee",
      fixed: "left",
      width: 260,
      render: (_, row) => (
        <button
          type="button"
          className="text-left"
          onClick={() => setSelectedEmployee(row)}
        >
          <div className="font-semibold text-slate-900 hover:text-blue-600">
            {row.employeeName || "—"}
          </div>
          <div className="text-xs text-slate-500">
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
      title: tr(
        t,
        "survey.managerEvaluation.table.manager",
        "Quản lý đánh giá",
      ),
      key: "manager",
      width: 200,
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-800">
            {row.managerName || "—"}
          </div>
          <div className="text-xs text-slate-500">
            {row.managerEmail || "—"}
          </div>
        </div>
      ),
    },
    {
      title: tr(t, "survey.managerEvaluation.table.averageScore", "Điểm tổng"),
      dataIndex: "averageScore",
      key: "averageScore",
      width: 130,
      sorter: (a, b) => toNumber(a.averageScore) - toNumber(b.averageScore),
      render: (value) => (
        <div className="min-w-[90px]">
          <div className="font-semibold text-slate-900">
            {formatScore(value)}/5
          </div>
          <Progress
            percent={getScorePercent(value)}
            showInfo={false}
            size="small"
          />
        </div>
      ),
    },
    {
      title: tr(
        t,
        "survey.managerEvaluation.table.fitConclusion",
        "Mức phù hợp",
      ),
      key: "fitLevel",
      width: 160,
      filters: [
        {
          text: tr(t, "survey.managerEvaluation.fit.fit", "Phù hợp"),
          value: "FIT",
        },
        {
          text: tr(
            t,
            "survey.managerEvaluation.fit.followUp",
            "Cần theo dõi thêm",
          ),
          value: "FOLLOW_UP",
        },
        {
          text: tr(t, "survey.managerEvaluation.fit.notFit", "Chưa phù hợp"),
          value: "NOT_FIT",
        },
        {
          text: tr(
            t,
            "survey.managerEvaluation.fit.notEvaluated",
            "Chưa được đánh giá",
          ),
          value: "NOT_EVALUATED",
        },
      ],
      onFilter: (value, row) => String(row.fitLevel) === String(value),
      render: (_, row) => {
        const meta = getFitMeta(t, row.fitLevel);

        return (
          <Tag color={meta.color} className="inline-flex items-center gap-1">
            {meta.icon}
            {row.fitLabel || meta.text}
          </Tag>
        );
      },
    },
    {
      title: tr(t, "survey.managerEvaluation.table.recommendation", "Đề xuất"),
      key: "recommendation",
      width: 220,
      render: (_, row) => {
        const meta = getRecommendationMeta(
          t,
          row.recommendationDecision,
          row.recommendationLabel || row.recommendation,
        );

        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: tr(
        t,
        "survey.managerEvaluation.table.attention",
        "Điểm cần xử lý",
      ),
      key: "attention",
      width: 170,
      render: (_, row) => getAttentionTag(t, row),
    },
    {
      title: tr(
        t,
        "survey.managerEvaluation.table.weakDimensions",
        "Nhóm cần cải thiện",
      ),
      key: "weakDimensions",
      width: 260,
      render: (_, row) => {
        const weak = (row.weakDimensions ?? []).filter(
          (item) => upper(item.level) !== "GOOD",
        );

        if (weak.length === 0) return "—";

        return (
          <Space size={4} wrap>
            {weak.slice(0, 3).map((item) => (
              <Tag
                key={`${item.dimensionCode}-${item.score}`}
                color={getDimensionLevelColor(item.level)}
              >
                {getDimensionLabel(t, item.dimensionCode, item.dimensionName)}:{" "}
                {formatScore(item.score)}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: tr(t, "survey.managerEvaluation.table.status", "Trạng thái"),
      key: "status",
      width: 130,
      render: (_, row) => getStatusTag(t, row.status),
    },
    {
      title: tr(
        t,
        "survey.managerEvaluation.table.submittedAt",
        "Ngày đánh giá",
      ),
      key: "submittedAt",
      width: 160,
      render: (_, row) => (
        <span className="text-sm text-slate-600">
          {formatDateTime(row.submittedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title={tr(
            t,
            "survey.managerEvaluation.kpi.totalEmployees",
            "Tổng nhân viên",
          )}
          value={summary.totalEmployees}
          subtext={tr(
            t,
            "survey.managerEvaluation.kpi.totalEmployeesSub",
            "Nhân viên đã hoàn tất onboarding cần manager đánh giá",
          )}
          icon={<UserRoundCheck className="h-6 w-6" />}
          loading={isLoading}
        />

        <KpiCard
          title={tr(
            t,
            "survey.managerEvaluation.kpi.submitted",
            "Đã được đánh giá",
          )}
          value={`${summary.submittedCount}/${summary.sentCount}`}
          subtext={`${tr(t, "survey.managerEvaluation.kpi.responseRate", "Tỷ lệ")} ${formatPercent(
            summary.responseRate,
          )}`}
          icon={<CheckCircle2 className="h-6 w-6" />}
          tone="success"
          loading={isLoading}
        />

        <KpiCard
          title={tr(
            t,
            "survey.managerEvaluation.kpi.averageScore",
            "Điểm đánh giá TB",
          )}
          value={`${formatScore(summary.averageScore)}/5`}
          subtext={tr(
            t,
            "survey.managerEvaluation.kpi.averageScoreSub",
            "Trung bình các đánh giá đã gửi",
          )}
          icon={<Star className="h-6 w-6" />}
          loading={isLoading}
        />

        <KpiCard
          title={tr(t, "survey.managerEvaluation.kpi.needAction", "Cần xử lý")}
          value={
            summary.needFollowUpCount +
            summary.notFitCount +
            summary.notEvaluatedCount
          }
          subtext={tr(
            t,
            "survey.managerEvaluation.kpi.needActionSub",
            "Chưa đánh giá, cần theo dõi hoặc chưa phù hợp",
          )}
          icon={<AlertTriangle className="h-6 w-6" />}
          tone="warning"
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border border-slate-200 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {tr(
                  t,
                  "survey.managerEvaluation.fitDistribution.title",
                  "Phân loại mức độ phù hợp",
                )}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {tr(
                  t,
                  "survey.managerEvaluation.fitDistribution.subtitle",
                  "Dựa trên điểm manager đánh giá và đề xuất sau onboarding.",
                )}
              </p>
            </div>

            <Tag
              color="blue"
              className="rounded-full px-3 py-1 text-xs font-medium"
            >
              {summary.totalEmployees}{" "}
              {tr(t, "survey.managerEvaluation.totalLabel", "nhân viên")}
            </Tag>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fitDistribution.map((item) => (
              <DistributionStatCard
                key={item.key}
                item={item}
                total={summary.totalEmployees}
              />
            ))}
          </div>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {tr(
                  t,
                  "survey.managerEvaluation.recommendationDistribution.title",
                  "Phân loại đề xuất sau onboarding",
                )}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {tr(
                  t,
                  "survey.managerEvaluation.recommendationDistribution.subtitle",
                  "Tổng hợp hướng xử lý nhân sự từ đánh giá của manager.",
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tag
                color="purple"
                className="rounded-full px-3 py-1 text-xs font-medium"
              >
                {summary.submittedCount}{" "}
                {tr(
                  t,
                  "survey.managerEvaluation.evaluatedLabel",
                  "đã đánh giá",
                )}
              </Tag>

              <Button onClick={() => refetch()} loading={isFetching}>
                {tr(t, "global.refresh", "Làm mới")}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recommendationDistribution.map((item) => (
              <DistributionStatCard
                key={item.key}
                item={item}
                total={summary.submittedCount || summary.totalEmployees}
              />
            ))}
          </div>
        </Card>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_180px_220px]">
          <Input
            allowClear
            prefix={<Search className="h-4 w-4 text-slate-400" />}
            placeholder={tr(
              t,
              "survey.managerEvaluation.filter.keyword",
              "Tìm theo tên nhân viên hoặc quản lý",
            )}
            value={filters.keyword}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                keyword: event.target.value || undefined,
              }))
            }
          />

          <Select
            allowClear
            placeholder={tr(
              t,
              "survey.managerEvaluation.filter.status",
              "Trạng thái",
            )}
            value={filters.status}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value || undefined,
              }))
            }
            options={[
              {
                value: "PENDING",
                label: tr(
                  t,
                  "survey.managerEvaluation.status.pending",
                  "Chờ quản lý",
                ),
              },
              {
                value: "SENT",
                label: tr(t, "survey.managerEvaluation.status.sent", "Đã gửi"),
              },
              {
                value: "SUBMITTED",
                label: tr(
                  t,
                  "survey.managerEvaluation.status.submitted",
                  "Đã đánh giá",
                ),
              },
              {
                value: "EXPIRED",
                label: tr(
                  t,
                  "survey.managerEvaluation.status.expired",
                  "Quá hạn",
                ),
              },
            ]}
          />

          <Select
            allowClear
            placeholder={tr(
              t,
              "survey.managerEvaluation.filter.fitLevel",
              "Mức phù hợp",
            )}
            value={filters.fitLevel}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                fitLevel: value || undefined,
              }))
            }
            options={[
              {
                value: "FIT",
                label: tr(t, "survey.managerEvaluation.fit.fit", "Phù hợp"),
              },
              {
                value: "FOLLOW_UP",
                label: tr(
                  t,
                  "survey.managerEvaluation.fit.followUp",
                  "Cần theo dõi thêm",
                ),
              },
              {
                value: "NOT_FIT",
                label: tr(
                  t,
                  "survey.managerEvaluation.fit.notFit",
                  "Chưa phù hợp",
                ),
              },
              {
                value: "NOT_EVALUATED",
                label: tr(
                  t,
                  "survey.managerEvaluation.fit.notEvaluated",
                  "Chưa được đánh giá",
                ),
              },
            ]}
          />

          <DatePicker.RangePicker
            value={[
              filters.startDate ? dayjs(filters.startDate) : null,
              filters.endDate ? dayjs(filters.endDate) : null,
            ]}
            onChange={(dates: null | [Dayjs | null, Dayjs | null]) =>
              setFilters((prev) => ({
                ...prev,
                startDate: dates?.[0]?.format("YYYY-MM-DD"),
                endDate: dates?.[1]?.format("YYYY-MM-DD"),
              }))
            }
          />
        </div>

        <Table<EmployeeEvaluationRow>
          rowKey={(row) =>
            row.surveyInstanceId ||
            row.surveyResponseId ||
            row.employeeUserId ||
            row.employeeEmail ||
            "UNKNOWN"
          }
          columns={columns}
          dataSource={employees}
          loading={isLoading || isFetching}
          scroll={{ x: 1630 }}
          locale={{
            emptyText: (
              <Empty
                description={tr(
                  t,
                  "survey.managerEvaluation.empty",
                  "Chưa có dữ liệu đánh giá sau onboarding",
                )}
              />
            ),
          }}
          onRow={(record) => ({
            onClick: () => setSelectedEmployee(record),
            className: "cursor-pointer",
          })}
        />
      </Card>

      <Drawer
        open={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployee(null)}
        width={860}
        title={tr(
          t,
          "survey.managerEvaluation.drawer.title",
          "Chi tiết đánh giá sau onboarding",
        )}
      >
        {selectedEmployee && (
          <div className="space-y-5">
            <Card className="border border-slate-200">
              <Descriptions column={1} size="small">
                <Descriptions.Item
                  label={tr(
                    t,
                    "survey.managerEvaluation.drawer.employee",
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
                    "survey.managerEvaluation.drawer.position",
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
                    "survey.managerEvaluation.drawer.manager",
                    "Quản lý đánh giá",
                  )}
                >
                  <div>
                    <div>{selectedEmployee.managerName || "—"}</div>
                    <div className="text-xs text-slate-500">
                      {selectedEmployee.managerEmail || "—"}
                    </div>
                  </div>
                </Descriptions.Item>

                <Descriptions.Item
                  label={tr(
                    t,
                    "survey.managerEvaluation.drawer.completedAt",
                    "Ngày hoàn thành onboarding",
                  )}
                >
                  {formatDateTime(selectedEmployee.completedAt)}
                </Descriptions.Item>

                <Descriptions.Item
                  label={tr(
                    t,
                    "survey.managerEvaluation.drawer.sentAt",
                    "Ngày gửi đánh giá",
                  )}
                >
                  {formatDateTime(selectedEmployee.sentAt)}
                </Descriptions.Item>

                <Descriptions.Item
                  label={tr(
                    t,
                    "survey.managerEvaluation.drawer.submittedAt",
                    "Ngày manager đánh giá",
                  )}
                >
                  {formatDateTime(selectedEmployee.submittedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="border border-slate-200">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">
                    {tr(
                      t,
                      "survey.managerEvaluation.drawer.fitConclusion",
                      "Kết luận sau onboarding",
                    )}
                  </p>
                  <div className="mt-1">
                    {(() => {
                      const meta = getFitMeta(t, selectedEmployee.fitLevel);
                      return (
                        <Tag
                          color={meta.color}
                          className="inline-flex items-center gap-1"
                        >
                          {meta.icon}
                          {selectedEmployee.fitLabel || meta.text}
                        </Tag>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-500">
                    {tr(
                      t,
                      "survey.managerEvaluation.drawer.averageScore",
                      "Điểm tổng",
                    )}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatScore(selectedEmployee.averageScore)}/5
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <Target className="h-4 w-4 text-blue-600" />
                  {tr(
                    t,
                    "survey.managerEvaluation.drawer.managerSummary",
                    "Nhận định",
                  )}
                </div>
                <p className="text-sm leading-6 text-slate-700">
                  {selectedEmployee.summary ||
                    tr(
                      t,
                      "survey.managerEvaluation.drawer.noSummary",
                      "Chưa có nhận định chi tiết.",
                    )}
                </p>
              </div>

              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <AlertTriangle className="h-4 w-4" />
                  {tr(
                    t,
                    "survey.managerEvaluation.drawer.hrAction",
                    "Đề xuất hành động cho HR",
                  )}
                </div>
                <p className="text-sm leading-6 text-blue-700">
                  {selectedEmployee.actionRecommendation ||
                    tr(
                      t,
                      "survey.managerEvaluation.drawer.noActionRecommendation",
                      "Chưa có đề xuất hành động.",
                    )}
                </p>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border border-slate-200">
                <h3 className="mb-3 font-semibold text-slate-900">
                  {tr(
                    t,
                    "survey.managerEvaluation.drawer.strengths",
                    "Điểm mạnh",
                  )}
                </h3>

                {(selectedEmployee.strengths ?? []).length === 0 ? (
                  <Empty
                    description={tr(
                      t,
                      "survey.managerEvaluation.drawer.noStrengths",
                      "Chưa có điểm mạnh nổi bật",
                    )}
                  />
                ) : (
                  <Space direction="vertical" className="w-full">
                    {(selectedEmployee.strengths ?? []).map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700"
                      >
                        {item}
                      </div>
                    ))}
                  </Space>
                )}
              </Card>

              <Card className="border border-slate-200">
                <h3 className="mb-3 font-semibold text-slate-900">
                  {tr(
                    t,
                    "survey.managerEvaluation.drawer.improvementAreas",
                    "Điểm cần cải thiện",
                  )}
                </h3>

                {(selectedEmployee.improvementAreas ?? []).length === 0 ? (
                  <Empty
                    description={tr(
                      t,
                      "survey.managerEvaluation.drawer.noImprovementAreas",
                      "Chưa có điểm cần cải thiện",
                    )}
                  />
                ) : (
                  <Space direction="vertical" className="w-full">
                    {(selectedEmployee.improvementAreas ?? []).map(
                      (item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700"
                        >
                          {item}
                        </div>
                      ),
                    )}
                  </Space>
                )}
              </Card>
            </div>

            <Card className="border border-slate-200">
              <h3 className="mb-4 font-semibold text-slate-900">
                {tr(
                  t,
                  "survey.managerEvaluation.drawer.dimensionScores",
                  "Điểm theo tiêu chí đánh giá",
                )}
              </h3>

              {(selectedEmployee.dimensionScores ?? []).length === 0 ? (
                <Empty
                  description={tr(
                    t,
                    "survey.managerEvaluation.drawer.noDimensionScores",
                    "Chưa có điểm theo tiêu chí",
                  )}
                />
              ) : (
                <div className="space-y-3">
                  {(selectedEmployee.dimensionScores ?? []).map((dimension) => (
                    <div key={`${dimension.dimensionCode}-${dimension.score}`}>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-700">
                          {getDimensionLabel(
                            t,
                            dimension.dimensionCode,
                            dimension.dimensionName,
                          )}
                        </span>
                        <Tag color={getDimensionLevelColor(dimension.level)}>
                          {formatScore(dimension.score)}/5
                        </Tag>
                      </div>
                      <Progress
                        percent={getScorePercent(dimension.score)}
                        showInfo={false}
                        size="small"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border border-slate-200">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900">
                  {tr(
                    t,
                    "survey.managerEvaluation.drawer.textFeedbacks",
                    "Nhận xét của quản lý",
                  )}
                </h3>
              </div>

              {(selectedEmployee.textFeedbacks ?? []).length === 0 ? (
                <Empty
                  description={tr(
                    t,
                    "survey.managerEvaluation.drawer.noTextFeedbacks",
                    "Chưa có nhận xét dạng văn bản",
                  )}
                />
              ) : (
                <Space direction="vertical" className="w-full" size={12}>
                  {(selectedEmployee.textFeedbacks ?? []).map(
                    (feedback, index) => (
                      <div
                        key={`${feedback.questionId}-${index}`}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            {feedback.dimensionName ||
                              getDimensionLabel(t, feedback.dimensionCode)}
                          </p>
                          {feedback.category ? (
                            <Tag>{feedback.category}</Tag>
                          ) : null}
                        </div>

                        <p className="text-sm font-medium text-slate-800">
                          {feedback.question || "—"}
                        </p>

                        <p className="mt-2 rounded-lg bg-white p-2 text-sm leading-6 text-slate-700">
                          {feedback.answer || "—"}
                        </p>
                      </div>
                    ),
                  )}
                </Space>
              )}
            </Card>

            <Card className="border border-slate-200">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900">
                  {tr(
                    t,
                    "survey.managerEvaluation.drawer.answerDetails",
                    "Chi tiết câu trả lời",
                  )}
                </h3>
              </div>

              <Table<AnswerDetail>
                rowKey={(row) =>
                  row.questionId || row.question || Math.random().toString()
                }
                dataSource={selectedEmployee.answerDetails ?? []}
                pagination={false}
                size="small"
                locale={{
                  emptyText: (
                    <Empty
                      description={tr(
                        t,
                        "survey.managerEvaluation.drawer.noAnswerDetails",
                        "Chưa có chi tiết câu trả lời",
                      )}
                    />
                  ),
                }}
                columns={[
                  {
                    title: tr(
                      t,
                      "survey.managerEvaluation.answerTable.question",
                      "Câu hỏi",
                    ),
                    key: "question",
                    render: (_, row) => (
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          {row.question || "—"}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {row.dimensionName ||
                            getDimensionLabel(t, row.dimensionCode)}
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: tr(
                      t,
                      "survey.managerEvaluation.answerTable.type",
                      "Loại",
                    ),
                    key: "questionType",
                    width: 130,
                    render: (_, row) => (
                      <Tag>{getQuestionTypeLabel(t, row.questionType)}</Tag>
                    ),
                  },
                  {
                    title: tr(
                      t,
                      "survey.managerEvaluation.answerTable.answer",
                      "Câu trả lời",
                    ),
                    key: "answer",
                    width: 220,
                    render: (_, row) => (
                      <span className="text-sm text-slate-700">
                        {formatAnswerValue(row)}
                      </span>
                    ),
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

export default ManagerEvaluationReportTab;

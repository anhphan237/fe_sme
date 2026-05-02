import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
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
  Search,
  Star,
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
  dimensionCode: string;
  dimensionName?: string | null;
  score?: number | null;
};

type TextFeedback = {
  question?: string | null;
  answer?: string | null;
};

type EmployeeEvaluationRow = {
  surveyInstanceId: string;
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
  status?: string | null;
  averageScore?: number | null;
  fitLevel?: "FIT" | "FOLLOW_UP" | "NOT_FIT" | "NOT_EVALUATED" | string;
  fitLabel?: string | null;
  recommendation?: string | null;
  recommendationLabel?: string | null;
  sentAt?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  dimensionScores?: DimensionScore[];
  textFeedbacks?: TextFeedback[];
};

type Summary = {
  totalEmployees: number;
  sentCount: number;
  submittedCount: number;
  pendingCount: number;
  responseRate: number;
  averageScore: number;
  fitCount: number;
  needFollowUpCount: number;
  notFitCount: number;
  notEvaluatedCount: number;
};

type ReportResponse = {
  summary: Summary;
  employees: EmployeeEvaluationRow[];
};

const DEFAULT_SUMMARY: Summary = {
  totalEmployees: 0,
  sentCount: 0,
  submittedCount: 0,
  pendingCount: 0,
  responseRate: 0,
  averageScore: 0,
  fitCount: 0,
  needFollowUpCount: 0,
  notFitCount: 0,
  notEvaluatedCount: 0,
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
    (raw?.data as T) ??
    (raw?.result as T) ??
    (raw?.payload as T) ??
    (res as T)
  );
};

const toNumber = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const formatScore = (value?: number | null) => {
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

const getDimensionLabel = (
  t: (key: string) => string,
  dimensionCode?: string | null,
) => {
  const code = String(dimensionCode ?? "").toUpperCase();
  const key = DIMENSION_KEYS[code];

  if (!key) return code || "—";

  return tr(t, key, DIMENSION_LABELS[code] ?? code);
};

const getFitMeta = (fitLevel?: string | null) => {
  const level = String(fitLevel ?? "").toUpperCase();

  if (level === "FIT") {
    return {
      color: "success",
      text: "Phù hợp",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    };
  }

  if (level === "FOLLOW_UP") {
    return {
      color: "warning",
      text: "Cần theo dõi",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    };
  }

  if (level === "NOT_FIT") {
    return {
      color: "error",
      text: "Không phù hợp",
      icon: <XCircle className="h-3.5 w-3.5" />,
    };
  }

  return {
    color: "default",
    text: "Chưa đánh giá",
    icon: <Clock3 className="h-3.5 w-3.5" />,
  };
};

const getStatusTag = (status?: string | null) => {
  const raw = String(status ?? "").toUpperCase();

  if (raw === "SUBMITTED" || raw === "DONE" || raw === "COMPLETED") {
    return <Tag color="success">Đã phản hồi</Tag>;
  }

  if (raw === "EXPIRED") {
    return <Tag color="error">Quá hạn</Tag>;
  }

  if (raw === "SENT") {
    return <Tag color="processing">Đã gửi</Tag>;
  }

  return <Tag color="warning">Đang chờ</Tag>;
};

const normalizeReport = (input?: Partial<ReportResponse> | null): ReportResponse => ({
  summary: {
    ...DEFAULT_SUMMARY,
    ...(input?.summary ?? {}),
    totalEmployees: toNumber(input?.summary?.totalEmployees),
    sentCount: toNumber(input?.summary?.sentCount),
    submittedCount: toNumber(input?.summary?.submittedCount),
    pendingCount: toNumber(input?.summary?.pendingCount),
    responseRate: toNumber(input?.summary?.responseRate),
    averageScore: toNumber(input?.summary?.averageScore),
    fitCount: toNumber(input?.summary?.fitCount),
    needFollowUpCount: toNumber(input?.summary?.needFollowUpCount),
    notFitCount: toNumber(input?.summary?.notFitCount),
    notEvaluatedCount: toNumber(input?.summary?.notEvaluatedCount),
  },
  employees: Array.isArray(input?.employees) ? input.employees : [],
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
  icon: React.ReactNode;
  loading?: boolean;
}) => {
  const toneClass = {
    default: "border-slate-200 bg-white text-slate-500",
    success: "border-emerald-200 bg-emerald-50 text-emerald-600",
    warning: "border-amber-200 bg-amber-50 text-amber-600",
    danger: "border-red-200 bg-red-50 text-red-600",
  }[tone];

  if (loading) return <div className="h-28 animate-pulse rounded-xl bg-slate-100" />;

  return (
    <Card className={`border shadow-sm ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-[#223A59]">{value}</p>
          {subtext ? <p className="mt-1 text-xs text-slate-500">{subtext}</p> : null}
        </div>
        <div className="shrink-0">{icon}</div>
      </div>
    </Card>
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

  const fitDistribution = useMemo(
    () => [
      {
        label: "Phù hợp",
        count: summary.fitCount,
        color: "bg-emerald-500",
      },
      {
        label: "Cần theo dõi",
        count: summary.needFollowUpCount,
        color: "bg-amber-500",
      },
      {
        label: "Không phù hợp",
        count: summary.notFitCount,
        color: "bg-red-500",
      },
      {
        label: "Chưa đánh giá",
        count: summary.notEvaluatedCount,
        color: "bg-slate-300",
      },
    ],
    [summary],
  );

  const columns: ColumnsType<EmployeeEvaluationRow> = [
    {
      title: "Nhân viên",
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
          <div className="text-xs text-slate-500">{row.employeeEmail || "—"}</div>
          <div className="mt-1 text-xs text-slate-400">
            {[row.jobTitle, row.departmentName].filter(Boolean).join(" • ") || "—"}
          </div>
        </button>
      ),
    },
    {
      title: "Quản lý đánh giá",
      key: "manager",
      width: 200,
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-800">{row.managerName || "—"}</div>
          <div className="text-xs text-slate-500">{row.managerEmail || "—"}</div>
        </div>
      ),
    },
    {
      title: "Điểm tổng",
      dataIndex: "averageScore",
      key: "averageScore",
      width: 130,
      sorter: (a, b) => toNumber(a.averageScore) - toNumber(b.averageScore),
      render: (value) => (
        <div className="min-w-[90px]">
          <div className="font-semibold text-slate-900">{formatScore(value)}/5</div>
          <Progress
            percent={Math.min((toNumber(value) / 5) * 100, 100)}
            showInfo={false}
            size="small"
          />
        </div>
      ),
    },
    {
      title: "Kết luận",
      key: "fitLevel",
      width: 150,
      filters: [
        { text: "Phù hợp", value: "FIT" },
        { text: "Cần theo dõi", value: "FOLLOW_UP" },
        { text: "Không phù hợp", value: "NOT_FIT" },
        { text: "Chưa đánh giá", value: "NOT_EVALUATED" },
      ],
      onFilter: (value, row) => String(row.fitLevel) === String(value),
      render: (_, row) => {
        const meta = getFitMeta(row.fitLevel);

        return (
          <Tag color={meta.color} className="inline-flex items-center gap-1">
            {meta.icon}
            {row.fitLabel || meta.text}
          </Tag>
        );
      },
    },
    {
      title: "Đề xuất",
      key: "recommendation",
      width: 220,
      render: (_, row) => (
        <span className="text-sm text-slate-700">
          {row.recommendationLabel || row.recommendation || "—"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 130,
      render: (_, row) => getStatusTag(row.status),
    },
    {
      title: "Ngày phản hồi",
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
      <Alert
        type="info"
        showIcon
        message="Báo cáo theo từng nhân viên"
        description="Tab này giúp HR và quản lý xem rõ nhân viên nào phù hợp sau onboarding, ai cần theo dõi thêm và lý do đánh giá cụ thể."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tổng nhân viên"
          value={summary.totalEmployees}
          subtext="Đã có khảo sát đánh giá"
          icon={<UserRoundCheck className="h-6 w-6" />}
          loading={isLoading}
        />
        <KpiCard
          title="Đã phản hồi"
          value={`${summary.submittedCount}/${summary.sentCount}`}
          subtext={`Tỷ lệ ${formatPercent(summary.responseRate)}`}
          icon={<CheckCircle2 className="h-6 w-6" />}
          tone="success"
          loading={isLoading}
        />
        <KpiCard
          title="Điểm trung bình"
          value={`${formatScore(summary.averageScore)}/5`}
          subtext="Trung bình các đánh giá đã phản hồi"
          icon={<Star className="h-6 w-6" />}
          loading={isLoading}
        />
        <KpiCard
          title="Cần chú ý"
          value={summary.needFollowUpCount + summary.notFitCount}
          subtext="Cần theo dõi hoặc không phù hợp"
          icon={<AlertTriangle className="h-6 w-6" />}
          tone="warning"
          loading={isLoading}
        />
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">
              Phân loại mức độ phù hợp
            </h3>
            <p className="text-sm text-slate-500">
              Dựa trên điểm trung bình và câu hỏi đề xuất của quản lý.
            </p>
          </div>

          <Button onClick={() => refetch()} loading={isFetching}>
            Làm mới
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {fitDistribution.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-100 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{item.count}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border border-slate-200 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_180px_220px]">
          <Input
            allowClear
            prefix={<Search className="h-4 w-4 text-slate-400" />}
            placeholder="Tìm theo tên nhân viên hoặc quản lý"
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
            placeholder="Trạng thái"
            value={filters.status}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value || undefined,
              }))
            }
            options={[
              { value: "PENDING", label: "Đang chờ" },
              { value: "SENT", label: "Đã gửi" },
              { value: "SUBMITTED", label: "Đã phản hồi" },
              { value: "EXPIRED", label: "Quá hạn" },
            ]}
          />

          <Select
            allowClear
            placeholder="Kết luận"
            value={filters.fitLevel}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                fitLevel: value || undefined,
              }))
            }
            options={[
              { value: "FIT", label: "Phù hợp" },
              { value: "FOLLOW_UP", label: "Cần theo dõi" },
              { value: "NOT_FIT", label: "Không phù hợp" },
              { value: "NOT_EVALUATED", label: "Chưa đánh giá" },
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
          rowKey={(row) => row.surveyInstanceId}
          columns={columns}
          dataSource={report.employees}
          loading={isLoading || isFetching}
          scroll={{ x: 1250 }}
          locale={{
            emptyText: (
              <Empty description="Chưa có dữ liệu đánh giá sau onboarding" />
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
        width={680}
        title="Chi tiết đánh giá nhân viên"
      >
        {selectedEmployee && (
          <div className="space-y-5">
            <Card className="border border-slate-200">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Nhân viên">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {selectedEmployee.employeeName || "—"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedEmployee.employeeEmail || "—"}
                    </div>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Vị trí">
                  {[selectedEmployee.jobTitle, selectedEmployee.departmentName]
                    .filter(Boolean)
                    .join(" • ") || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Quản lý đánh giá">
                  {selectedEmployee.managerName || "—"}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày hoàn thành onboarding">
                  {formatDateTime(selectedEmployee.completedAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày gửi khảo sát">
                  {formatDateTime(selectedEmployee.sentAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày phản hồi">
                  {formatDateTime(selectedEmployee.submittedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="border border-slate-200">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Kết luận</p>
                  <div className="mt-1">
                    {(() => {
                      const meta = getFitMeta(selectedEmployee.fitLevel);
                      return (
                        <Tag color={meta.color} className="inline-flex items-center gap-1">
                          {meta.icon}
                          {selectedEmployee.fitLabel || meta.text}
                        </Tag>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-500">Điểm tổng</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatScore(selectedEmployee.averageScore)}/5
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                <span className="font-medium">Đề xuất:</span>{" "}
                {selectedEmployee.recommendationLabel ||
                  selectedEmployee.recommendation ||
                  "—"}
              </p>
            </Card>

            <Card className="border border-slate-200">
              <h3 className="mb-4 font-semibold text-slate-900">
                Điểm theo nhóm đánh giá
              </h3>

              <div className="space-y-3">
                {(selectedEmployee.dimensionScores ?? []).length === 0 ? (
                  <Empty description="Chưa có điểm theo nhóm đánh giá" />
                ) : (
                  selectedEmployee.dimensionScores?.map((dimension) => (
                    <div key={dimension.dimensionCode}>
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-700">
                          {dimension.dimensionName ||
                            getDimensionLabel(t, dimension.dimensionCode)}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatScore(dimension.score)}/5
                        </span>
                      </div>
                      <Progress
                        percent={Math.min((toNumber(dimension.score) / 5) * 100, 100)}
                        showInfo={false}
                        size="small"
                      />
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="border border-slate-200">
              <h3 className="mb-4 font-semibold text-slate-900">
                Nhận xét của quản lý
              </h3>

              {(selectedEmployee.textFeedbacks ?? []).length === 0 ? (
                <Empty description="Chưa có nhận xét dạng văn bản" />
              ) : (
                <Space direction="vertical" className="w-full" size={12}>
                  {selectedEmployee.textFeedbacks?.map((feedback, index) => (
                    <div
                      key={`${feedback.question}-${index}`}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <p className="text-xs font-semibold uppercase text-slate-400">
                        {feedback.question || "Câu hỏi"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {feedback.answer || "—"}
                      </p>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ManagerEvaluationReportTab;

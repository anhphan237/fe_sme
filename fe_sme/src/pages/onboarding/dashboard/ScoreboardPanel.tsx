import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Select,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { extractList } from "@/api/core/types";
import { apiListTemplates } from "@/api/onboarding/onboarding.api";
import {
  apiGetOnboardingScoreboard,
  type CandidateScoreItem,
} from "@/api/analytics/analytics.api";
import { useUserNameMap } from "@/utils/resolvers/userResolver";
import { useLocale } from "@/i18n";
import type { OnboardingTemplate } from "@/shared/types";

const { Text, Title } = Typography;

// ── Helpers ─────────────────────────────────────────────────

const qualityColor = (score: number): string => {
  if (score >= 80) return "#52c41a";
  if (score >= 60) return "#1677ff";
  if (score >= 40) return "#faad14";
  return "#ff4d4f";
};

const qualityLabel = (score: number, t: (k: string) => string): string => {
  if (score >= 80) return t("onboarding.scoreboard.quality.excellent");
  if (score >= 60) return t("onboarding.scoreboard.quality.good");
  if (score >= 40) return t("onboarding.scoreboard.quality.average");
  return t("onboarding.scoreboard.quality.needs_improvement");
};

const toSafeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

type FitAssessment = "FIT" | "NOT_FIT";

const getFitAssessment = (
  item: CandidateScoreItem,
): { assessment: FitAssessment; color: string } => {
  const isFit =
    item.qualityScore >= 70 &&
    item.completionRate >= 80 &&
    item.overdueTasks === 0 &&
    item.lateCompletedTasks <= 1;
  if (isFit) {
    return { assessment: "FIT", color: "success" };
  }
  return { assessment: "NOT_FIT", color: "error" };
};

// ── Sub-component: Stat Card ─────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  valueClassName?: string;
}

const StatCard = ({ label, value, valueClassName }: StatCardProps) => (
  <Card size="small" className="h-full">
    <div>
      <div>
        <Text type="secondary" className="block text-xs">
          {label}
        </Text>
        <p className={`text-xl font-bold ${valueClassName ?? "text-gray-900"}`}>
          {value}
        </p>
      </div>
    </div>
  </Card>
);

// ── Main Component ───────────────────────────────────────────

const ScoreboardPanel = () => {
  const { t } = useLocale();
  const { resolveName } = useUserNameMap();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<string>("COMPLETED");
  const [limitFilter, setLimitFilter] = useState<number>(20);
  const [minimumQuality, setMinimumQuality] = useState<number>(0);

  // Load template list for selector
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["templates-for-scoreboard"],
    queryFn: () => apiListTemplates({ status: "ACTIVE" }),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "templates",
        "items",
        "list",
      ).map(
        (t: unknown) =>
          ({
            id:
              (t as Record<string, unknown>).templateId ??
              (t as Record<string, unknown>).id ??
              "",
            name: (t as Record<string, unknown>).name ?? "",
          }) as Pick<OnboardingTemplate, "id" | "name">,
      ),
  });

  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [selectedTemplateId, templates]);

  // Fetch scoreboard when template is selected
  const {
    data: scoreboardData,
    isLoading: scoreboardLoading,
    isFetching,
  } = useQuery({
    queryKey: [
      "onboarding-scoreboard",
      selectedTemplateId,
      statusFilter,
      limitFilter,
    ],
    queryFn: () =>
      apiGetOnboardingScoreboard({
        templateId: selectedTemplateId!,
        status: statusFilter,
        limit: limitFilter,
      }),
    enabled: !!selectedTemplateId,
    select: (res: unknown) => {
      const data = (res as Record<string, unknown>).data ?? res;
      const normalized = data as {
        totalCandidates: number;
        candidates: CandidateScoreItem[];
        templateId: string;
      };
      return {
        ...normalized,
        totalCandidates: toSafeNumber(normalized.totalCandidates),
        candidates: (normalized.candidates ?? []).map((c) => ({
          ...c,
          rank: toSafeNumber(c.rank),
          progressPercent: toSafeNumber(c.progressPercent),
          totalTasks: toSafeNumber(c.totalTasks),
          completedTasks: toSafeNumber(c.completedTasks),
          overdueTasks: toSafeNumber(c.overdueTasks),
          lateCompletedTasks: toSafeNumber(c.lateCompletedTasks),
          completionRate: toSafeNumber(c.completionRate),
          qualityScore: toSafeNumber(c.qualityScore),
        })),
      };
    },
  });

  const candidates = scoreboardData?.candidates ?? [];
  const filteredCandidates = useMemo(
    () =>
      candidates.filter((c) => toSafeNumber(c.qualityScore) >= minimumQuality),
    [candidates, minimumQuality],
  );
  const totalCandidates = scoreboardData?.totalCandidates ?? 0;

  // Aggregate stats from candidates
  const stats = useMemo(() => {
    if (!filteredCandidates.length)
      return { avgQuality: 0, avgProgress: 0, withOverdue: 0 };
    const avgQuality =
      Math.round(
        (filteredCandidates.reduce((s, c) => s + c.qualityScore, 0) /
          filteredCandidates.length) *
          10,
      ) / 10;
    const avgProgress = Math.round(
      filteredCandidates.reduce((s, c) => s + c.progressPercent, 0) /
        filteredCandidates.length,
    );
    const withOverdue = filteredCandidates.filter(
      (c) => c.overdueTasks > 0,
    ).length;
    return { avgQuality, avgProgress, withOverdue };
  }, [filteredCandidates]);

  const assessmentStats = useMemo(() => {
    return filteredCandidates.reduce(
      (acc, c) => {
        const value = getFitAssessment(c).assessment;
        if (value === "FIT") acc.fit += 1;
        else acc.notFit += 1;
        return acc;
      },
      { fit: 0, notFit: 0 },
    );
  }, [filteredCandidates]);

  // Table columns
  const columns = useMemo(
    () => [
      {
        title: t("onboarding.scoreboard.col.rank"),
        dataIndex: "rank",
        key: "rank",
        width: 60,
        render: (rank: number) => <Text className="font-mono">#{rank}</Text>,
      },
      {
        title: t("onboarding.scoreboard.col.employee"),
        dataIndex: "employeeId",
        key: "employee",
        render: (_: string, record: CandidateScoreItem) => (
          <Link to={`/onboarding/employees/${record.instanceId}`}>
            <Text className="text-blue-500 hover:underline">
              {resolveName(record.employeeId, record.employeeId)}
            </Text>
          </Link>
        ),
      },
      {
        title: t("onboarding.scoreboard.col.fit_status"),
        key: "fit_status",
        width: 130,
        render: (_: unknown, record: CandidateScoreItem) => {
          const decision = getFitAssessment(record);
          return (
            <Tag color={decision.color}>
              {t(
                `onboarding.scoreboard.recommendation.${decision.assessment.toLowerCase()}`,
              )}
            </Tag>
          );
        },
      },
      {
        title: t("onboarding.scoreboard.col.fit_reason"),
        key: "fit_reason",
        width: 240,
        render: (_: unknown, record: CandidateScoreItem) => {
          const decision = getFitAssessment(record);
          return (
            <Text className="text-xs text-gray-600">
              {t(
                `onboarding.scoreboard.recommendation.reason.${decision.assessment.toLowerCase()}`,
              )}
            </Text>
          );
        },
      },
      {
        title: t("onboarding.scoreboard.col.progress"),
        dataIndex: "progressPercent",
        key: "progress",
        width: 160,
        render: (pct: number) => (
          <Progress
            percent={pct}
            size="small"
            strokeColor={
              pct >= 80 ? "#52c41a" : pct >= 50 ? "#1677ff" : "#faad14"
            }
          />
        ),
      },
      {
        title: t("onboarding.scoreboard.col.quality_score"),
        dataIndex: "qualityScore",
        key: "qualityScore",
        width: 140,
        sorter: (a: CandidateScoreItem, b: CandidateScoreItem) =>
          b.qualityScore - a.qualityScore,
        render: (score: number) => (
          <Tooltip title={qualityLabel(score, t)}>
            <Tag
              color={qualityColor(score)}
              style={{ minWidth: 60, textAlign: "center" }}>
              {score.toFixed(1)}
            </Tag>
          </Tooltip>
        ),
      },
      {
        title: t("onboarding.scoreboard.col.completion_rate"),
        dataIndex: "completionRate",
        key: "completionRate",
        width: 120,
        sorter: (a: CandidateScoreItem, b: CandidateScoreItem) =>
          b.completionRate - a.completionRate,
        render: (rate: number, record: CandidateScoreItem) => (
          <Text>
            {rate.toFixed(1)}%{" "}
            <Text type="secondary" className="text-xs">
              ({record.completedTasks}/{record.totalTasks})
            </Text>
          </Text>
        ),
      },
      {
        title: t("onboarding.scoreboard.col.total_tasks"),
        dataIndex: "totalTasks",
        key: "totalTasks",
        width: 100,
        sorter: (a: CandidateScoreItem, b: CandidateScoreItem) =>
          b.totalTasks - a.totalTasks,
      },
      {
        title: t("onboarding.scoreboard.col.completed_tasks"),
        dataIndex: "completedTasks",
        key: "completedTasks",
        width: 120,
        sorter: (a: CandidateScoreItem, b: CandidateScoreItem) =>
          b.completedTasks - a.completedTasks,
      },
      {
        title: t("onboarding.scoreboard.col.pending_tasks"),
        key: "pendingTasks",
        width: 110,
        render: (_: unknown, record: CandidateScoreItem) =>
          Math.max(record.totalTasks - record.completedTasks, 0),
      },
      {
        title: t("onboarding.scoreboard.col.overdue"),
        dataIndex: "overdueTasks",
        key: "overdueTasks",
        width: 100,
        sorter: (a: CandidateScoreItem, b: CandidateScoreItem) =>
          a.overdueTasks - b.overdueTasks,
        render: (count: number) => (
          <Text className={count > 0 ? "font-semibold text-red-500" : ""}>
            {count}
          </Text>
        ),
      },
      {
        title: t("onboarding.scoreboard.col.late_completed"),
        dataIndex: "lateCompletedTasks",
        key: "lateCompletedTasks",
        width: 110,
      },
      {
        title: t("onboarding.scoreboard.col.on_time_rate"),
        key: "onTimeRate",
        width: 120,
        render: (_: unknown, record: CandidateScoreItem) => {
          const completed = Math.max(record.completedTasks, 0);
          if (completed === 0) return "0%";
          const onTime = Math.max(completed - record.lateCompletedTasks, 0);
          return `${((onTime * 100) / completed).toFixed(1)}%`;
        },
      },
    ],
    [resolveName, t],
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card size="small">
        <Text strong className="mb-2 block">
          {t("onboarding.scoreboard.purpose_title")}
        </Text>
        <Text type="secondary" className="mb-3 block text-sm">
          {t("onboarding.scoreboard.purpose_desc")}
        </Text>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Text strong className="text-sm">
              {t("onboarding.scoreboard.select_template")}:
            </Text>
            <Select
              style={{ minWidth: 280 }}
              placeholder={t("onboarding.scoreboard.template_placeholder")}
              loading={templatesLoading}
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              showSearch
              optionFilterProp="label"
              options={templates.map((tpl) => ({
                value: tpl.id,
                label: tpl.name,
              }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Text className="text-sm">
              {t("onboarding.scoreboard.status")}:
            </Text>
            <Select
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                {
                  value: "ACTIVE",
                  label: t("onboarding.instance.status.ACTIVE"),
                },
                {
                  value: "COMPLETED",
                  label: t("onboarding.instance.status.COMPLETED"),
                },
                {
                  value: "CANCELLED",
                  label: t("onboarding.instance.status.CANCELLED"),
                },
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <Text className="text-sm">
              {t("onboarding.scoreboard.show_top")}:
            </Text>
            <Select
              style={{ width: 80 }}
              value={limitFilter}
              onChange={setLimitFilter}
              options={[
                { value: 10, label: "10" },
                { value: 20, label: "20" },
                { value: 50, label: "50" },
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <Text className="text-sm">
              {t("onboarding.scoreboard.min_quality")}:
            </Text>
            <Select
              style={{ width: 140 }}
              value={minimumQuality}
              onChange={setMinimumQuality}
              options={[
                { value: 0, label: t("onboarding.scoreboard.min_quality_all") },
                { value: 40, label: "≥ 40" },
                { value: 60, label: "≥ 60" },
                { value: 80, label: "≥ 80" },
              ]}
            />
          </div>
        </div>
      </Card>

      {!selectedTemplateId && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-gray-400">
              {t("onboarding.scoreboard.select_template_hint")}
            </span>
          }
        />
      )}

      {selectedTemplateId && (
        <>
          {/* Summary stats */}
          {filteredCandidates.length > 0 && (
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={6}>
                <StatCard
                  label={t("onboarding.scoreboard.stat.total_candidates")}
                  value={totalCandidates}
                />
              </Col>
              <Col xs={12} sm={6}>
                <StatCard
                  label={t("onboarding.scoreboard.stat.avg_quality")}
                  value={stats.avgQuality}
                />
              </Col>
              <Col xs={12} sm={6}>
                <StatCard
                  label={t("onboarding.scoreboard.stat.avg_progress")}
                  value={`${stats.avgProgress}%`}
                />
              </Col>
              <Col xs={12} sm={6}>
                <StatCard
                  label={t("onboarding.scoreboard.stat.with_overdue")}
                  value={stats.withOverdue}
                  valueClassName={
                    stats.withOverdue > 0 ? "text-red-500" : undefined
                  }
                />
              </Col>
            </Row>
          )}

          {/* Overdue alert */}
          {stats.withOverdue > 0 && (
            <Alert
              type="warning"
              showIcon
              message={t("onboarding.scoreboard.overdue_alert", {
                count: stats.withOverdue,
              })}
            />
          )}

          {filteredCandidates.length > 0 && (
            <Card
              size="small"
              title={t("onboarding.scoreboard.fit_summary_title")}>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
                  <StatCard
                    label={t("onboarding.scoreboard.stat.fit")}
                    value={assessmentStats.fit}
                    valueClassName="text-emerald-600"
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <StatCard
                    label={t("onboarding.scoreboard.stat.not_fit")}
                    value={assessmentStats.notFit}
                    valueClassName="text-red-600"
                  />
                </Col>
              </Row>
            </Card>
          )}

          {/* Full ranking table */}
          <Card
            size="small"
            title={
              <div className="flex items-center justify-between">
                <Title level={5} className="!mb-0">
                  {t("onboarding.scoreboard.table_title")}
                </Title>
                <Text type="secondary" className="text-xs">
                  {t("onboarding.scoreboard.showing", {
                    showing: filteredCandidates.length,
                    total: totalCandidates,
                  })}
                </Text>
              </div>
            }>
            {scoreboardLoading || isFetching ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : filteredCandidates.length === 0 ? (
              <Empty description={t("onboarding.scoreboard.no_candidates")} />
            ) : (
              <Table
                dataSource={filteredCandidates}
                rowKey="instanceId"
                columns={columns}
                size="small"
                pagination={{ pageSize: 10, hideOnSinglePage: true }}
                rowClassName={(record) =>
                  record.rank <= 3 ? "bg-yellow-50 hover:bg-yellow-100" : ""
                }
              />
            )}
          </Card>

          {/* Quality score legend */}
          <Card size="small" className="bg-gray-50">
            <Text strong className="mb-2 block text-xs text-gray-500">
              {t("onboarding.scoreboard.quality_formula")}
            </Text>
            <Text className="block text-xs text-gray-500">
              {t("onboarding.scoreboard.quality_formula_desc")}
            </Text>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                {
                  label: t("onboarding.scoreboard.quality.excellent"),
                  color: "#52c41a",
                  range: "≥ 80",
                },
                {
                  label: t("onboarding.scoreboard.quality.good"),
                  color: "#1677ff",
                  range: "60–79",
                },
                {
                  label: t("onboarding.scoreboard.quality.average"),
                  color: "#faad14",
                  range: "40–59",
                },
                {
                  label: t("onboarding.scoreboard.quality.needs_improvement"),
                  color: "#ff4d4f",
                  range: "< 40",
                },
              ].map((item) => (
                <Tag key={item.range} color={item.color}>
                  {item.label} ({item.range})
                </Tag>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ScoreboardPanel;

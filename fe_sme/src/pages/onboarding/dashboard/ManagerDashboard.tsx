import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Col,
  Progress,
  Row,
  Skeleton,
  Table,
  Tag,
  Typography,
} from "antd";
import { CheckCircle, ClipboardList, Clock, Users } from "lucide-react";
import { extractList } from "@/api/core/types";
import { apiListInstances } from "@/api/onboarding/onboarding.api";
import { mapInstance } from "@/utils/mappers/onboarding";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import type { OnboardingInstance } from "@/shared/types";

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  ACTIVE: "processing",
  COMPLETED: "success",
  DRAFT: "gold",
  PENDING: "gold",
  CANCELLED: "default",
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("vi-VN");
};

const ManagerDashboard = () => {
  const { t } = useLocale();
  const currentUser = useUserStore((state) => state.currentUser);

  // Load all instances, then filter client-side by managerUserId matching current user
  const { data: allInstances = [], isLoading } = useQuery({
    queryKey: ["manager-onboarding-instances", currentUser?.id ?? ""],
    queryFn: () => apiListInstances({}),
    enabled: Boolean(currentUser?.id),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });

  const teamInstances = useMemo(
    () =>
      allInstances.filter(
        (i) => i.managerUserId === currentUser?.id || !i.managerUserId,
      ),
    [allInstances, currentUser?.id],
  );

  const stats = useMemo(() => {
    const active = teamInstances.filter((i) => i.status === "ACTIVE").length;
    const completed = teamInstances.filter(
      (i) => i.status === "COMPLETED",
    ).length;
    const pending = teamInstances.filter(
      (i) => i.status === "DRAFT" || i.status === "PENDING",
    ).length;
    const total = teamInstances.length;
    const avgProgress =
      total > 0
        ? Math.round(
            teamInstances.reduce((sum, i) => sum + (i.progress ?? 0), 0) /
              total,
          )
        : 0;
    return { active, completed, pending, total, avgProgress };
  }, [teamInstances]);

  const recentInstances = useMemo(
    () =>
      [...teamInstances]
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        )
        .slice(0, 8),
    [teamInstances],
  );

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div className="space-y-6 p-6">
      <div>
        <Title level={3} className="!mb-1">
          {t("onboarding.manager.dashboard.title")}
        </Title>
        <Text type="secondary">
          {t("onboarding.manager.dashboard.subtitle")}
        </Text>
      </div>

      {/* Stats row */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <Text type="secondary" className="text-xs">
                  {t("onboarding.manager.dashboard.stat.total")}
                </Text>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <Text type="secondary" className="text-xs">
                  {t("onboarding.manager.dashboard.stat.active")}
                </Text>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <Text type="secondary" className="text-xs">
                  {t("onboarding.manager.dashboard.stat.pending")}
                </Text>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-2">
                <CheckCircle className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <Text type="secondary" className="text-xs">
                  {t("onboarding.manager.dashboard.stat.completed")}
                </Text>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completed}
                </p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Team average progress */}
        <Col xs={24} md={8}>
          <Card className="h-full">
            <Title level={5} className="!mb-3">
              {t("onboarding.manager.dashboard.avg_progress")}
            </Title>
            <Progress type="dashboard" percent={stats.avgProgress} size={140} />
            <Text type="secondary" className="mt-2 block text-center text-xs">
              {t("onboarding.manager.dashboard.avg_progress_desc", {
                active: stats.active,
              })}
            </Text>
          </Card>
        </Col>

        {/* Quick actions */}
        <Col xs={24} md={16}>
          <Card className="h-full">
            <Title level={5} className="!mb-3">
              {t("onboarding.manager.dashboard.quick_actions")}
            </Title>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Link to="/onboarding/employees">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 transition-colors hover:bg-blue-100">
                  <Users className="mb-2 h-5 w-5 text-blue-600" />
                  <Text strong className="block text-sm">
                    {t("onboarding.manager.dashboard.action.view_employees")}
                  </Text>
                </div>
              </Link>
              <Link to="/onboarding/tasks">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100">
                  <Clock className="mb-2 h-5 w-5 text-amber-600" />
                  <Text strong className="block text-sm">
                    {t("onboarding.manager.dashboard.action.view_tasks")}
                  </Text>
                </div>
              </Link>
              <Link to="/documents">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100">
                  <ClipboardList className="mb-2 h-5 w-5 text-gray-600" />
                  <Text strong className="block text-sm">
                    {t("onboarding.manager.dashboard.action.knowledge_base")}
                  </Text>
                </div>
              </Link>
              <Link to="/surveys/inbox">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 transition-colors hover:bg-emerald-100">
                  <CheckCircle className="mb-2 h-5 w-5 text-emerald-600" />
                  <Text strong className="block text-sm">
                    {t("onboarding.manager.dashboard.action.surveys")}
                  </Text>
                </div>
              </Link>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Team onboarding table */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <Title level={5} className="!mb-0">
            {t("onboarding.manager.dashboard.team_instances")}
          </Title>
          <Link to="/onboarding/employees">
            <Text className="text-sm text-blue-500 hover:underline">
              {t("onboarding.manager.dashboard.view_all")}
            </Text>
          </Link>
        </div>
        <Table
          dataSource={recentInstances}
          rowKey="id"
          size="small"
          pagination={false}
          columns={[
            {
              title: t("onboarding.manager.dashboard.col.employee_id"),
              dataIndex: "employeeId",
              key: "employeeId",
              render: (id: string, record: OnboardingInstance) => (
                <Link to={`/onboarding/employees/${record.id}`}>
                  <Text className="text-blue-500 hover:underline">{id}</Text>
                </Link>
              ),
            },
            {
              title: t("onboarding.manager.dashboard.col.status"),
              dataIndex: "status",
              key: "status",
              render: (status: string) => (
                <Tag color={statusColor[status] ?? "default"}>{status}</Tag>
              ),
            },
            {
              title: t("onboarding.manager.dashboard.col.progress"),
              dataIndex: "progress",
              key: "progress",
              render: (progress: number) => (
                <Progress percent={progress ?? 0} size="small" />
              ),
            },
            {
              title: t("onboarding.manager.dashboard.col.start_date"),
              dataIndex: "startDate",
              key: "startDate",
              render: formatDate,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ManagerDashboard;

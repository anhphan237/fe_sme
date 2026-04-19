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
import { useUserNameMap } from "@/utils/resolvers/userResolver";
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

const HrDashboard = () => {
  const { t } = useLocale();
  const { resolveName } = useUserNameMap();

  const { data: allInstances = [], isLoading } = useQuery({
    queryKey: ["hr-onboarding-all-instances"],
    queryFn: () => apiListInstances({}),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });

  const stats = useMemo(() => {
    const active = allInstances.filter((i) => i.status === "ACTIVE").length;
    const completed = allInstances.filter(
      (i) => i.status === "COMPLETED",
    ).length;
    const pending = allInstances.filter((i) => i.status === "DRAFT").length;
    const total = allInstances.length;
    const avgProgress =
      total > 0
        ? Math.round(
            allInstances.reduce((sum, i) => sum + (i.progress ?? 0), 0) / total,
          )
        : 0;
    return { active, completed, pending, total, avgProgress };
  }, [allInstances]);

  const recentInstances = useMemo(
    () =>
      [...allInstances]
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        )
        .slice(0, 10),
    [allInstances],
  );

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div className="space-y-6 p-6">
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
                  {t("onboarding.hr.dashboard.stat.total")}
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
                  {t("onboarding.hr.dashboard.stat.active")}
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
                  {t("onboarding.hr.dashboard.stat.pending")}
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
                  {t("onboarding.hr.dashboard.stat.completed")}
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
        {/* Average progress */}
        <Col xs={24} md={8}>
          <Card className="h-full">
            <Title level={5} className="!mb-3">
              {t("onboarding.hr.dashboard.avg_progress")}
            </Title>
            <Progress type="dashboard" percent={stats.avgProgress} size={140} />
            <Text type="secondary" className="mt-2 block text-center text-xs">
              {t("onboarding.hr.dashboard.avg_progress_desc", {
                active: stats.active,
              })}
            </Text>
          </Card>
        </Col>

        {/* Quick actions */}
        <Col xs={24} md={16}>
          <Card className="h-full">
            <Title level={5} className="!mb-3">
              {t("onboarding.hr.dashboard.quick_actions")}
            </Title>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Link to="/onboarding/employees/new">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 transition-colors hover:bg-blue-100">
                  <Users className="mb-2 h-5 w-5 text-blue-600" />
                  <Text strong className="block text-sm">
                    {t("onboarding.hr.dashboard.action.new_employee")}
                  </Text>
                </div>
              </Link>
              <Link to="/onboarding/templates">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 transition-colors hover:bg-emerald-100">
                  <ClipboardList className="mb-2 h-5 w-5 text-emerald-600" />
                  <Text strong className="block text-sm">
                    {t("onboarding.hr.dashboard.action.templates")}
                  </Text>
                </div>
              </Link>
              <Link to="/onboarding/tasks">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100">
                  <Clock className="mb-2 h-5 w-5 text-amber-600" />
                  <Text strong className="block text-sm">
                    {t("onboarding.hr.dashboard.action.tasks")}
                  </Text>
                </div>
              </Link>
              <Link to="/onboarding/employees">
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 transition-colors hover:bg-sky-100">
                  <Users className="mb-2 h-5 w-5 text-sky-600" />
                  <Text strong className="block text-sm">
                    {t("onboarding.hr.dashboard.action.employees")}
                  </Text>
                </div>
              </Link>
              <Link to="/documents">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100">
                  <ClipboardList className="mb-2 h-5 w-5 text-gray-600" />
                  <Text strong className="block text-sm">
                    {t("onboarding.hr.dashboard.action.knowledge_base")}
                  </Text>
                </div>
              </Link>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <Title level={5} className="!mb-0">
            {t("onboarding.hr.dashboard.recent_instances")}
          </Title>
          <Link to="/onboarding/employees">
            <Text className="text-sm text-blue-500 hover:underline">
              {t("onboarding.hr.dashboard.view_all")}
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
              title: t("onboarding.hr.dashboard.col.employee_id"),
              dataIndex: "employeeId",
              key: "employeeId",
              render: (_id: string, record: OnboardingInstance) => (
                <Link to={`/onboarding/employees/${record.id}`}>
                  <Text className="text-blue-500 hover:underline">
                    {record.employeeName ||
                      resolveName(
                        record.employeeUserId,
                        record.employeeId || "—",
                      )}
                  </Text>
                </Link>
              ),
            },
            {
              title: t("onboarding.hr.dashboard.col.status"),
              dataIndex: "status",
              key: "status",
              render: (status: string) => (
                <Tag color={statusColor[status] ?? "default"}>
                  {t(`onboarding.instance.status.${status}`, {
                    defaultValue: status,
                  })}
                </Tag>
              ),
            },
            {
              title: t("onboarding.hr.dashboard.col.progress"),
              dataIndex: "progress",
              key: "progress",
              render: (progress: number) => (
                <Progress percent={progress ?? 0} size="small" />
              ),
            },
            {
              title: t("onboarding.hr.dashboard.col.start_date"),
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

export default HrDashboard;

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CircleDashed,
  ClipboardCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Progress,
  Row,
  Skeleton,
  Tag,
  Typography,
} from "antd";
import { Link } from "react-router-dom";
import BaseButton from "@/components/button";
import { extractList } from "@/api/core/types";
import {
  apiGetTaskDetailFull,
  apiListInstances,
  apiListTasks,
  apiUpdateTaskStatus,
  apiAcknowledgeTask,
} from "@/api/onboarding/onboarding.api";
import { mapInstance, mapTask } from "@/utils/mappers/onboarding";
import { notify } from "@/utils/notify";
import { useUserStore } from "@/stores/user.store";
import { useLocale } from "@/i18n";
import type { OnboardingInstance, OnboardingTask } from "@/shared/types";
import type { TaskDetailResponse } from "@/interface/onboarding";

const STATUS_DONE = "Done";
const STATUS_DONE_API = "DONE";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN");
};

const getDaysDiff = (fromDate?: string) => {
  if (!fromDate) return null;
  const date = new Date(fromDate);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const MyJourney = () => {
  const queryClient = useQueryClient();
  const { t } = useLocale();
  const currentUser = useUserStore((state) => state.currentUser);
  const userId = currentUser?.id;

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { data: instances = [], isLoading: loadingInstances } = useQuery({
    queryKey: ["employee-onboarding-instances", userId ?? ""],
    queryFn: () => apiListInstances({ employeeId: userId }),
    enabled: Boolean(userId),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "instances",
        "items",
        "list",
      ).map(mapInstance) as OnboardingInstance[],
  });

  const latestInstance = useMemo(() => {
    if (!instances.length) return null;
    const rank: Record<string, number> = {
      ACTIVE: 0,
      DRAFT: 1,
      PENDING: 1,
      COMPLETED: 2,
      CANCELLED: 3,
    };
    return [...instances].sort((a, b) => {
      const rankDiff = (rank[a.status] ?? 99) - (rank[b.status] ?? 99);
      if (rankDiff !== 0) return rankDiff;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    })[0];
  }, [instances]);

  const onboardingId = latestInstance?.id;

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["employee-onboarding-tasks", onboardingId ?? ""],
    queryFn: () => apiListTasks(onboardingId!),
    enabled: Boolean(onboardingId),
    select: (res: unknown) =>
      extractList(
        res as Record<string, unknown>,
        "tasks",
        "content",
        "items",
        "list",
      ).map(mapTask) as OnboardingTask[],
  });

  const { data: selectedTaskDetail, isLoading: loadingTaskDetail } = useQuery({
    queryKey: ["employee-onboarding-task-detail", selectedTaskId ?? ""],
    queryFn: () => apiGetTaskDetailFull(selectedTaskId!),
    enabled: Boolean(selectedTaskId),
    select: (res: unknown) => {
      const record = res as Record<string, unknown>;
      const raw =
        record?.task ??
        record?.data ??
        record?.result ??
        record?.payload ??
        res;
      if (!raw || typeof raw !== "object") return null;
      return raw as TaskDetailResponse;
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      apiUpdateTaskStatus(taskId, status),
  });

  const acknowledgeTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiAcknowledgeTask({ taskId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-onboarding-tasks", onboardingId ?? ""],
      });
      queryClient.invalidateQueries({
        queryKey: ["employee-onboarding-task-detail", selectedTaskId],
      });
      notify.success(t("onboarding.task.toast.acknowledged"));
    },
    onError: () => notify.error(t("onboarding.task.toast.failed")),
  });

  const completedCount = tasks.filter(
    (task) => task.status === STATUS_DONE,
  ).length;
  const totalCount = tasks.length;
  const progressPercent =
    totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : (latestInstance?.progress ?? 0);

  const pendingTasks = tasks.filter((task) => task.status !== STATUS_DONE);
  const overdueTasks = pendingTasks.filter((task) => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate).getTime() < Date.now();
  });
  const dueSoonTasks = pendingTasks.filter((task) => {
    if (!task.dueDate) return false;
    const ms = new Date(task.dueDate).getTime() - Date.now();
    const day = 1000 * 60 * 60 * 24;
    return ms >= 0 && ms <= day * 3;
  });
  const unassignedTasks = tasks.filter((task) => !task.assignedUserId);
  const autoAssignmentRate =
    totalCount > 0
      ? Math.round(((totalCount - unassignedTasks.length) / totalCount) * 100)
      : 0;

  const urgentTasks = useMemo(() => {
    const scoreTask = (task: OnboardingTask) => {
      if (!task.dueDate) return 999999999;
      const due = new Date(task.dueDate).getTime();
      const overduePenalty = due < Date.now() ? -1000000000 : 0;
      return overduePenalty + due;
    };
    return [...pendingTasks]
      .sort((a, b) => scoreTask(a) - scoreTask(b))
      .slice(0, 5);
  }, [pendingTasks]);

  const milestoneTimeline = useMemo(() => {
    const daysFromStart = getDaysDiff(latestInstance?.startDate);
    return [7, 30, 60].map((milestone) => {
      if (daysFromStart == null) {
        return {
          milestone,
          state: "UNKNOWN" as const,
          label: t("onboarding.employee.home.milestone.unknown"),
        };
      }
      if (daysFromStart < milestone) {
        return {
          milestone,
          state: "FUTURE" as const,
          label: t("onboarding.employee.home.milestone.days_left", {
            days: milestone - daysFromStart,
          }),
        };
      }
      return {
        milestone,
        state: "DUE" as const,
        label: t("onboarding.employee.home.milestone.due"),
      };
    });
  }, [latestInstance?.startDate, t]);

  const getStatusTag = (status?: string) => {
    const normalized = (status ?? "").toUpperCase();
    if (normalized === "ACTIVE")
      return <Tag color="processing">{t("onboarding.status.active")}</Tag>;
    if (normalized === "COMPLETED")
      return <Tag color="success">{t("onboarding.status.completed")}</Tag>;
    if (normalized === "DRAFT")
      return (
        <Tag color="gold">{t("onboarding.employee.home.status.draft")}</Tag>
      );
    if (normalized === "PENDING")
      return <Tag color="gold">{t("onboarding.status.pending")}</Tag>;
    if (normalized === "CANCELLED")
      return <Tag color="default">{t("onboarding.status.cancelled")}</Tag>;
    return <Tag>{t("global.status")}</Tag>;
  };

  const handleToggleTask = async (task: OnboardingTask) => {
    const isDone = task.status === STATUS_DONE;
    if (isDone) {
      try {
        await updateTaskStatus.mutateAsync({ taskId: task.id, status: "TODO" });
        queryClient.invalidateQueries({
          queryKey: ["employee-onboarding-tasks", onboardingId ?? ""],
        });
        notify.success(t("onboarding.employee.home.toast.task_todo"));
      } catch {
        notify.error(t("onboarding.employee.home.toast.task_failed"));
      }
      return;
    }

    // requireAck: employee must acknowledge first (→ WAIT_ACK) before completing
    if (
      task.requireAck &&
      task.rawStatus !== "WAIT_ACK" &&
      task.rawStatus !== "DONE"
    ) {
      try {
        await acknowledgeTaskMutation.mutateAsync(task.id);
      } catch {
        // error handled by mutation's onError
      }
      return;
    }

    // requiresManagerApproval: submit for approval instead of direct DONE
    if (task.requiresManagerApproval) {
      try {
        await updateTaskStatus.mutateAsync({
          taskId: task.id,
          status: "PENDING_APPROVAL",
        });
        queryClient.invalidateQueries({
          queryKey: ["employee-onboarding-tasks", onboardingId ?? ""],
        });
        notify.success(t("onboarding.task.toast.submitted_approval"));
      } catch {
        notify.error(t("onboarding.employee.home.toast.task_failed"));
      }
      return;
    }

    try {
      await updateTaskStatus.mutateAsync({
        taskId: task.id,
        status: STATUS_DONE_API,
      });
      queryClient.invalidateQueries({
        queryKey: ["employee-onboarding-tasks", onboardingId ?? ""],
      });
      queryClient.invalidateQueries({
        queryKey: ["employee-onboarding-instances", userId ?? ""],
      });
      notify.success(t("onboarding.employee.home.toast.task_done"));
    } catch {
      notify.error(t("onboarding.employee.home.toast.task_failed"));
    }
  };

  if (loadingInstances) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (!latestInstance) {
    return (
      <div className="space-y-4 p-6">
        <div>
          <Typography.Title level={3} className="!mb-1">
            {t("onboarding.employee.home.title")}
          </Typography.Title>
          <Typography.Text type="secondary">
            {t("onboarding.employee.home.empty_description")}
          </Typography.Text>
        </div>
        <Card>
          <Empty description={t("onboarding.employee.home.empty_description")}>
            <Link to="/onboarding/tasks">
              <BaseButton type="primary">
                {t("onboarding.employee.home.empty_action")}
              </BaseButton>
            </Link>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Typography.Title level={3} className="!mb-1">
          {t("onboarding.employee.home.title")}
        </Typography.Title>
        <Typography.Text type="secondary">
          {t("onboarding.employee.home.subtitle")}
        </Typography.Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="h-full">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <Typography.Title level={5} className="!mb-1">
                  {t("onboarding.employee.home.overview.title")}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {t("onboarding.employee.home.overview.instance_id", {
                    id: latestInstance.id,
                  })}
                </Typography.Text>
              </div>
              {getStatusTag(latestInstance.status)}
            </div>

            <div className="mb-2 flex items-center justify-between">
              <Typography.Text>
                {t("onboarding.employee.home.overview.progress")}
              </Typography.Text>
              <Typography.Text strong>{progressPercent}%</Typography.Text>
            </div>
            <Progress percent={progressPercent} showInfo={false} />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-blue-700">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {t("onboarding.employee.home.overview.completed_tasks")}
                  </span>
                </div>
                <p className="text-xl font-semibold text-blue-900">
                  {completedCount}/{totalCount}
                </p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                <div className="mb-1 flex items-center gap-2 text-amber-700">
                  <BellRing className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {t("onboarding.employee.home.overview.urgent_count")}
                  </span>
                </div>
                <p className="text-xl font-semibold text-amber-900">
                  {overdueTasks.length + dueSoonTasks.length}
                </p>
              </div>
            </div>

            <Typography.Paragraph className="!mb-0 !mt-4 text-xs text-gray-500">
              {t("onboarding.employee.home.overview.start_date", {
                date: formatDate(latestInstance.startDate),
              })}
            </Typography.Paragraph>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card className="h-full">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <Typography.Title level={5} className="!mb-1">
                  {t("onboarding.employee.home.automation.title")}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {t("onboarding.employee.home.automation.subtitle")}
                </Typography.Text>
              </div>
              <Sparkles className="h-5 w-5 text-sky-500" />
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <Typography.Text strong>Auto-generate task</Typography.Text>
                  <Tag color={totalCount > 0 ? "success" : "default"}>
                    {totalCount > 0
                      ? t("onboarding.employee.home.automation.generated")
                      : t("onboarding.employee.home.automation.waiting")}
                  </Tag>
                </div>
                <Typography.Text type="secondary">
                  {t("onboarding.employee.home.automation.generated_desc", {
                    total: totalCount,
                  })}
                </Typography.Text>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <Typography.Text strong>
                    {t("onboarding.employee.home.automation.auto_assignment")}
                  </Typography.Text>
                  <Typography.Text>{autoAssignmentRate}%</Typography.Text>
                </div>
                <Progress
                  percent={autoAssignmentRate}
                  showInfo={false}
                  size="small"
                />
                <Typography.Text type="secondary">
                  {unassignedTasks.length === 0
                    ? t("onboarding.employee.home.automation.assignment_ok")
                    : t(
                        "onboarding.employee.home.automation.assignment_missing",
                        { total: unassignedTasks.length },
                      )}
                </Typography.Text>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-violet-500" />
                  <Typography.Text strong>
                    {t("onboarding.employee.home.automation.reminder")}
                  </Typography.Text>
                </div>
                <Typography.Text type="secondary">
                  {t("onboarding.employee.home.automation.reminder_desc", {
                    overdue: overdueTasks.length,
                    dueSoon: dueSoonTasks.length,
                  })}
                </Typography.Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card className="h-full">
            <div className="mb-3 flex items-center justify-between">
              <Typography.Title level={5} className="!mb-0">
                {t("onboarding.employee.home.today_actions.title")}
              </Typography.Title>
              <Link to="/onboarding/tasks">
                <BaseButton type="link">
                  {t("onboarding.employee.home.today_actions.view_all")}
                </BaseButton>
              </Link>
            </div>

            {loadingTasks ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : urgentTasks.length > 0 ? (
              <div className="space-y-2">
                {urgentTasks.map((task) => {
                  const isDone = task.status === STATUS_DONE;
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate).getTime() < Date.now();

                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border border-gray-200 p-3 transition-colors hover:border-sky-300">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <Typography.Text strong>{task.title}</Typography.Text>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Tag color={isOverdue ? "error" : "default"}>
                              {task.dueDate
                                ? t("onboarding.task.due", {
                                    date: formatDate(task.dueDate),
                                  })
                                : t(
                                    "onboarding.employee.home.today_actions.no_due_date",
                                  )}
                            </Tag>
                            {task.checklistName && (
                              <Tag>{task.checklistName}</Tag>
                            )}
                          </div>
                        </div>
                        <Tag color={isDone ? "success" : "processing"}>
                          {task.status ??
                            t("onboarding.detail.task.status.pending")}
                        </Tag>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <BaseButton
                          size="small"
                          type={isDone ? "default" : "primary"}
                          loading={updateTaskStatus.isPending}
                          onClick={() => handleToggleTask(task)}>
                          {isDone
                            ? t(
                                "onboarding.employee.home.today_actions.mark_undone",
                              )
                            : t(
                                "onboarding.employee.home.today_actions.mark_done",
                              )}
                        </BaseButton>
                        <BaseButton
                          size="small"
                          onClick={() => setSelectedTaskId(task.id)}>
                          {t(
                            "onboarding.employee.home.today_actions.view_detail",
                          )}
                        </BaseButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty
                description={t("onboarding.employee.home.today_actions.empty")}
              />
            )}

            <Alert
              className="!mt-4"
              type="info"
              showIcon
              icon={<UserCheck className="h-4 w-4" />}
              message={t("onboarding.employee.home.today_actions.tip_title")}
              description={t("onboarding.employee.home.today_actions.tip_desc")}
            />
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card className="h-full">
            <Typography.Title level={5} className="!mb-3">
              {t("onboarding.employee.home.milestone.title")}
            </Typography.Title>

            <div className="space-y-3">
              {milestoneTimeline.map((item) => {
                const isDue = item.state === "DUE";
                const isFuture = item.state === "FUTURE";
                return (
                  <div
                    key={item.milestone}
                    className="rounded-lg border border-gray-200 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <Typography.Text strong>
                        {t("onboarding.employee.home.milestone.day", {
                          day: item.milestone,
                        })}
                      </Typography.Text>
                      {isDue ? (
                        <Tag color="warning">
                          {t("onboarding.employee.home.milestone.due")}
                        </Tag>
                      ) : isFuture ? (
                        <Tag color="default">
                          {t("onboarding.employee.home.milestone.future")}
                        </Tag>
                      ) : (
                        <Tag color="default">
                          {t("onboarding.employee.home.milestone.unknown")}
                        </Tag>
                      )}
                    </div>
                    <Typography.Text type="secondary">
                      {item.label}
                    </Typography.Text>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <Link to="/surveys/inbox">
                <BaseButton type="primary" block>
                  {t("onboarding.employee.home.milestone.open_survey")}
                </BaseButton>
              </Link>
            </div>

            <Typography.Paragraph className="!mb-0 !mt-3 text-xs text-gray-500">
              {t("onboarding.employee.home.milestone.note")}
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <BellRing className="h-4 w-4 text-amber-500" />
              <Typography.Title level={5} className="!mb-0">
                {t("onboarding.employee.home.reminder.title")}
              </Typography.Title>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                {t("onboarding.employee.home.reminder.all_done")}
              </div>
            ) : (
              <div className="space-y-2">
                {overdueTasks.slice(0, 3).map((task) => (
                  <div
                    key={`overdue-${task.id}`}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <Typography.Text>{task.title}</Typography.Text>
                    </div>
                    <Tag color="error">
                      {t("onboarding.employee.home.reminder.overdue")}
                    </Tag>
                  </div>
                ))}

                {dueSoonTasks.slice(0, 3).map((task) => (
                  <div
                    key={`due-soon-${task.id}`}
                    className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center gap-2">
                      <CircleDashed className="h-4 w-4 text-amber-500" />
                      <Typography.Text>{task.title}</Typography.Text>
                    </div>
                    <Tag color="warning">
                      {t("onboarding.employee.home.reminder.due_soon")}
                    </Tag>
                  </div>
                ))}

                {unassignedTasks.slice(0, 2).map((task) => (
                  <div
                    key={`unassigned-${task.id}`}
                    className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 p-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-sky-500" />
                      <Typography.Text>{task.title}</Typography.Text>
                    </div>
                    <Tag color="processing">
                      {t("onboarding.employee.home.reminder.need_assign")}
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Drawer
        title={t("onboarding.employee.home.task_detail.title")}
        width={560}
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}>
        {loadingTaskDetail ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : selectedTaskDetail ? (
          <div className="space-y-3">
            <div>
              <Typography.Text type="secondary">
                {t("onboarding.employee.home.task_detail.field_title")}
              </Typography.Text>
              <Typography.Paragraph className="!mb-0 !mt-1" strong>
                {selectedTaskDetail.title ?? "-"}
              </Typography.Paragraph>
            </div>

            <div>
              <Typography.Text type="secondary">
                {t("onboarding.employee.home.task_detail.field_description")}
              </Typography.Text>
              <Typography.Paragraph className="!mb-0 !mt-1">
                {selectedTaskDetail.description ?? "-"}
              </Typography.Paragraph>
            </div>

            {selectedTaskDetail.rejectionReason && (
              <Alert
                type="error"
                showIcon
                message={t("onboarding.task.rejection_reason")}
                description={selectedTaskDetail.rejectionReason}
              />
            )}

            <Row gutter={[12, 12]}>
              <Col span={12}>
                <div className="rounded-lg border border-gray-200 p-3">
                  <Typography.Text type="secondary">
                    {t("onboarding.employee.home.task_detail.field_status")}
                  </Typography.Text>
                  <div className="mt-1">
                    {selectedTaskDetail.status === "DONE" ? (
                      <Tag color="success">
                        {t("onboarding.task.status.done")}
                      </Tag>
                    ) : selectedTaskDetail.status === "PENDING_APPROVAL" ? (
                      <Tag color="warning">
                        {t("onboarding.task.status.pending_approval")}
                      </Tag>
                    ) : selectedTaskDetail.status === "WAIT_ACK" ? (
                      <Tag color="orange">
                        {t("onboarding.task.status.wait_ack")}
                      </Tag>
                    ) : selectedTaskDetail.status === "IN_PROGRESS" ? (
                      <Tag color="processing">
                        {t("onboarding.task.status.in_progress")}
                      </Tag>
                    ) : (
                      <Tag>{t("onboarding.task.status.todo")}</Tag>
                    )}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="rounded-lg border border-gray-200 p-3">
                  <Typography.Text type="secondary">
                    {t("onboarding.employee.home.task_detail.field_due_date")}
                  </Typography.Text>
                  <div className="mt-1">
                    {formatDate(selectedTaskDetail.dueDate ?? "")}
                  </div>
                </div>
              </Col>
            </Row>

            <Row gutter={[12, 12]}>
              <Col span={8}>
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <Typography.Text type="secondary">
                    {t("onboarding.employee.home.task_detail.field_comments")}
                  </Typography.Text>
                  <p className="!mb-0 mt-1 text-lg font-semibold">
                    {Array.isArray(selectedTaskDetail.comments)
                      ? selectedTaskDetail.comments.length
                      : 0}
                  </p>
                </div>
              </Col>
              <Col span={8}>
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <Typography.Text type="secondary">
                    {t(
                      "onboarding.employee.home.task_detail.field_attachments",
                    )}
                  </Typography.Text>
                  <p className="!mb-0 mt-1 text-lg font-semibold">
                    {Array.isArray(selectedTaskDetail.attachments)
                      ? selectedTaskDetail.attachments.length
                      : 0}
                  </p>
                </div>
              </Col>
              <Col span={8}>
                <div className="rounded-lg border border-gray-200 p-3 text-center">
                  <Typography.Text type="secondary">
                    {t(
                      "onboarding.employee.home.task_detail.field_activity_logs",
                    )}
                  </Typography.Text>
                  <p className="!mb-0 mt-1 text-lg font-semibold">
                    {Array.isArray(selectedTaskDetail.activityLogs)
                      ? selectedTaskDetail.activityLogs.length
                      : 0}
                  </p>
                </div>
              </Col>
            </Row>

            {/* Employee action buttons */}
            {selectedTaskDetail.status !== "DONE" && (
              <div className="space-y-2 pt-2">
                {/* requireAck: employee must acknowledge before completing */}
                {selectedTaskDetail.requireAck &&
                  ["TODO", "IN_PROGRESS", "ASSIGNED"].includes(
                    selectedTaskDetail.status ?? "",
                  ) && (
                    <Button
                      type="primary"
                      block
                      loading={acknowledgeTaskMutation.isPending}
                      onClick={() =>
                        acknowledgeTaskMutation.mutate(
                          selectedTaskDetail.taskId!,
                        )
                      }>
                      {t("onboarding.task.action.acknowledge")}
                    </Button>
                  )}

                {/* WAIT_ACK: confirm completion after manager ack */}
                {selectedTaskDetail.status === "WAIT_ACK" && (
                  <Button
                    type="primary"
                    block
                    loading={updateTaskStatus.isPending}
                    onClick={() =>
                      updateTaskStatus.mutate(
                        { taskId: selectedTaskDetail.taskId!, status: "DONE" },
                        {
                          onSuccess: () => {
                            queryClient.invalidateQueries({
                              queryKey: [
                                "employee-onboarding-tasks",
                                onboardingId ?? "",
                              ],
                            });
                            queryClient.invalidateQueries({
                              queryKey: [
                                "employee-onboarding-task-detail",
                                selectedTaskId,
                              ],
                            });
                            notify.success(
                              t("onboarding.task.toast.confirmed_complete"),
                            );
                          },
                          onError: () =>
                            notify.error(t("onboarding.task.toast.failed")),
                        },
                      )
                    }>
                    {t("onboarding.task.action.confirm_complete")}
                  </Button>
                )}

                {/* requiresManagerApproval: submit for approval */}
                {!selectedTaskDetail.requireAck &&
                  selectedTaskDetail.requiresManagerApproval &&
                  ["TODO", "IN_PROGRESS", "ASSIGNED"].includes(
                    selectedTaskDetail.status ?? "",
                  ) && (
                    <Button
                      type="default"
                      block
                      loading={updateTaskStatus.isPending}
                      onClick={() =>
                        updateTaskStatus.mutate(
                          {
                            taskId: selectedTaskDetail.taskId!,
                            status: "PENDING_APPROVAL",
                          },
                          {
                            onSuccess: () => {
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "employee-onboarding-tasks",
                                  onboardingId ?? "",
                                ],
                              });
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "employee-onboarding-task-detail",
                                  selectedTaskId,
                                ],
                              });
                              notify.success(
                                t("onboarding.task.toast.submitted_approval"),
                              );
                            },
                            onError: () =>
                              notify.error(t("onboarding.task.toast.failed")),
                          },
                        )
                      }>
                      {t("onboarding.task.action.submit_approval")}
                    </Button>
                  )}

                {/* Normal task: mark done directly */}
                {!selectedTaskDetail.requireAck &&
                  !selectedTaskDetail.requiresManagerApproval &&
                  selectedTaskDetail.status !== "WAIT_ACK" &&
                  selectedTaskDetail.status !== "PENDING_APPROVAL" && (
                    <Button
                      type="primary"
                      block
                      loading={updateTaskStatus.isPending}
                      onClick={() =>
                        updateTaskStatus.mutate(
                          {
                            taskId: selectedTaskDetail.taskId!,
                            status: "DONE",
                          },
                          {
                            onSuccess: () => {
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "employee-onboarding-tasks",
                                  onboardingId ?? "",
                                ],
                              });
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "employee-onboarding-instances",
                                  userId ?? "",
                                ],
                              });
                              queryClient.invalidateQueries({
                                queryKey: [
                                  "employee-onboarding-task-detail",
                                  selectedTaskId,
                                ],
                              });
                              notify.success(
                                t("onboarding.employee.home.toast.task_done"),
                              );
                            },
                            onError: () =>
                              notify.error(
                                t("onboarding.employee.home.toast.task_failed"),
                              ),
                          },
                        )
                      }>
                      {t("onboarding.task.action.confirm_complete")}
                    </Button>
                  )}
              </div>
            )}

            <Link to="/onboarding/tasks">
              <BaseButton type="default" block>
                {t("onboarding.employee.home.task_detail.open_board")}
              </BaseButton>
            </Link>
          </div>
        ) : (
          <Empty
            description={t("onboarding.employee.home.error_task_detail")}
          />
        )}
      </Drawer>
    </div>
  );
};

export default MyJourney;

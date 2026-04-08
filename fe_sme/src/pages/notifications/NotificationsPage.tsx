import { useMemo, useState } from "react";
import { Badge, Button, Empty, Skeleton } from "antd";
import {
  BellOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { useNotifications } from "@/hooks/useNotifications";
import type { NotificationItem } from "@/interface/notification";

dayjs.extend(relativeTime);

// ── Type → icon & color ──────────────────────────────────────────────
type TypeStyle = { icon: React.ReactNode; bg: string; color: string };

const getTypeStyle = (type?: string | null): TypeStyle => {
  if (!type) return { icon: <BellOutlined />, bg: "#f1f5f9", color: "#64748b" };

  if (
    [
      "TASK_APPROVED",
      "TASK_SCHEDULE_CONFIRMED",
      "SURVEY_SUBMITTED",
      "COMPANY_WELCOME",
      "ONBOARDING_STARTED",
    ].includes(type)
  )
    return { icon: <CheckCircleOutlined />, bg: "#f0fdf4", color: "#16a34a" };

  if (
    [
      "TASK_REJECTED",
      "TASK_OVERDUE",
      "TASK_OVERDUE_ESCALATION",
      "ACCOUNT_SUSPENDED",
      "TASK_SCHEDULE_CANCELLED",
    ].includes(type)
  )
    return { icon: <CloseCircleOutlined />, bg: "#fef2f2", color: "#dc2626" };

  if (
    [
      "TASK_REMINDER",
      "TASK_SCHEDULE_REMINDER",
      "TASK_SCHEDULE_RESCHEDULED",
      "TASK_SCHEDULE_NO_SHOW_CANDIDATE",
      "PAYMENT_REMINDER",
      "QUOTA_WARNING", "USAGE_ALERT", "PRE_FIRST_DAY",
    ].includes(type)
  )
    return {
      icon: <ExclamationCircleOutlined />,
      bg: "#fffbeb",
      color: "#d97706",
    };

  if (
    [
      "TASK_ASSIGNED",
      "TASK_PENDING_APPROVAL",
      "TASK_SCHEDULE_PROPOSED",
      "SURVEY_READY",
    ].includes(type)
  )
    return { icon: <ClockCircleOutlined />, bg: "#eff6ff", color: "#2563eb" };

  return { icon: <InfoCircleOutlined />, bg: "#f8fafc", color: "#64748b" };
};

// ── Single notification card ─────────────────────────────────────────
type ItemProps = {
  item: NotificationItem;
  typeLabelKey: string;
  locale: string;
  onMarkRead: (id: string) => void;
};

const NotificationCard = ({
  item,
  typeLabelKey,
  locale,
  onMarkRead,
}: ItemProps) => {
  const dayjsLocale = locale === "vi_VN" ? "vi" : "en";
  const { icon, bg, color } = getTypeStyle(item.type);

  return (
    <div
      onClick={() => !item.read && onMarkRead(item.notificationId)}
      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
      style={{ cursor: item.read ? "default" : "pointer" }}>
      {/* Type icon */}
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
        style={{ background: bg, color }}>
        {icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Row 1: title + time + dot */}
        <div className="flex items-baseline justify-between gap-2">
          <p
            className="min-w-0 flex-1 truncate text-sm leading-snug"
            style={{
              fontWeight: item.read ? 400 : 600,
              color: item.read ? "#475569" : "#0f172a",
            }}>
            {typeLabelKey && (
              <span className="mr-1 text-[11px] font-medium" style={{ color }}>
                {typeLabelKey} ·{" "}
              </span>
            )}
            {item.title}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="whitespace-nowrap text-[11px] text-slate-400">
              {dayjs(item.createdAt).locale(dayjsLocale).fromNow()}
            </span>
            {!item.read && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
          </div>
        </div>

        {/* Row 2: body */}
        {item.body && (
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{item.body}</p>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────
type Tab = "all" | "unread";

const NotificationsPage = () => {
  const { t } = useLocale();
  const locale = useUserStore((s) => s.locale);
  const { notifications, unreadCount, loading, markAsRead } =
    useNotifications();

  const [tab, setTab] = useState<Tab>("all");

  const displayed = useMemo<NotificationItem[]>(() => {
    if (tab === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, tab]);

  const emptyLabel =
    tab === "unread"
      ? t("notification.no_unread")
      : t("notification.no_notifications");

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        {/* Tabs */}
        <div className="flex gap-0.5">
          {(["all", "unread"] as Tab[]).map((key) => {
            const label =
              key === "all"
                ? t("notification.tab.all")
                : t("notification.tab.unread");
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  background: active ? "#f1f5f9" : "transparent",
                  color: active ? "#0f172a" : "#64748b",
                }}>
                {label}
                {key === "unread" && unreadCount > 0 && (
                  <Badge
                    count={unreadCount}
                    size="small"
                    style={{
                      background: active ? "#2563eb" : "#cbd5e1",
                      fontSize: 10,
                      height: 16,
                      lineHeight: "16px",
                      minWidth: 16,
                      padding: "0 4px",
                      boxShadow: "none",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Mark all read */}
        {unreadCount > 0 && (
          <Button
            size="small"
            type="text"
            icon={<CheckOutlined />}
            className="text-xs text-slate-500 hover:text-blue-600"
            onClick={() => markAsRead("ALL")}>
            {t("notification.mark_all_read")}
          </Button>
        )}
      </div>

      {/* ── List ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <Skeleton.Avatar active size={32} />
              <div className="flex-1">
                <Skeleton active paragraph={{ rows: 1 }} title={{ width: "55%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-sm text-slate-400">{emptyLabel}</span>
          }
          className="py-12"
        />
      ) : (
        <div className="divide-y divide-slate-100">
          {displayed.map((n) => (
            <NotificationCard
              key={n.notificationId}
              item={n}
              typeLabelKey={
                n.type
                  ? t(`notification.type.${n.type}`, undefined) || n.type
                  : ""
              }
              locale={locale}
              onMarkRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

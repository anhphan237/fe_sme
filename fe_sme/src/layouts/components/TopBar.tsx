import { Link, matchPath } from "react-router-dom";
import { Menu } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Dropdown,
  List,
  Typography,
  type MenuProps,
} from "antd";
import {
  BellOutlined,
  DownOutlined,
  HomeOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { apiLogout } from "@/api/identity/identity.api";
import { RoleTenantSwitcher } from "./RoleTenantSwitcher";
import { useGlobalStore } from "@/stores/global.store";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NAV_SECTIONS } from "../nav.config";
import { useNotifications } from "@/hooks/useNotifications";
import { queryClient } from "@/lib/queryClient";
import { AppRouters } from "@/constants";
import "./TopBarBreadcrumb.css";

dayjs.extend(relativeTime);

// Static route map — computed once at module level
const breadcrumbRouteMap = NAV_SECTIONS.flatMap((section) => {
  const routes: Array<{ to: string; titleKey: string }> = [];
  if (section.to) routes.push({ to: section.to, titleKey: section.titleKey });
  for (const child of section.children ?? []) {
    routes.push({ to: child.to, titleKey: child.titleKey });
  }
  return routes;
});

// Module context — returns the section that owns the current pathname
function getModuleContext(pathname: string) {
  if (pathname === "/dashboard" || pathname === "/") return null;
  return (
    NAV_SECTIONS.find((section) => {
      if (section.to && pathname.startsWith(section.to)) return true;
      return section.children?.some((c) => pathname.startsWith(c.to));
    }) ?? null
  );
}

// Dynamic route patterns for detail pages not in nav config
const DYNAMIC_ROUTE_PATTERNS: Array<{ pattern: string; titleKey: string }> = [
  {
    pattern: "/onboarding/templates/:id",
    titleKey: "nav.onboarding.templates",
  },
  {
    pattern: "/onboarding/employees/:id",
    titleKey: "nav.onboarding.employees",
  },
  { pattern: "/documents/:id", titleKey: "nav.documents.library" },
  { pattern: "/surveys/templates/:id", titleKey: "nav.surveys.templates" },
  { pattern: "/surveys/inbox/:id", titleKey: "nav.surveys.inbox" },
  { pattern: "/billing/checkout/:id", titleKey: "nav.billing.invoices" },
];

function resolveBreadcrumbTitleKey(to: string): string | undefined {
  const exact = breadcrumbRouteMap.find((item) => item.to === to);
  if (exact) return exact.titleKey;
  for (const { pattern, titleKey } of DYNAMIC_ROUTE_PATTERNS) {
    if (matchPath({ path: pattern, end: true }, to)) return titleKey;
  }
  return undefined;
}

type Props = {
  pathname: string;
  onMenuClick: () => void;
};

export const TopBar = ({ pathname, onMenuClick }: Props) => {
  const { t } = useLocale();
  const logoutStore = useUserStore((s) => s.logout);
  const resetGlobal = useGlobalStore((s) => s.resetGlobal);
  const currentUser = useUserStore((s) => s.currentUser);
  const locale = useUserStore((s) => s.locale);
  const breadcrumbs = useGlobalStore((s) => s.breadcrumbs);
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const dayjsLocale = locale === "vi_VN" ? "vi" : "en";

  const handleLogout = async () => {
    try {
      await apiLogout();
    } finally {
      logoutStore();
      resetGlobal();
      queryClient.clear();
      window.location.href = AppRouters.LOGIN;
    }
  };

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const moduleContext = getModuleContext(pathname);

  // ── Breadcrumb items ──────────────────────────────────────────────
  const breadcrumbItems = pathname
    .split("/")
    .filter(Boolean)
    .reduce<Array<{ key: string; to: string; label: string }>>(
      (acc, part, index, parts) => {
        const to = "/" + parts.slice(0, index + 1).join("/");
        if (to === "/dashboard") return acc;
        const routeKey = resolveBreadcrumbTitleKey(to);
        const label = routeKey ? t(routeKey) : (breadcrumbs[part] ?? null);
        if (!label) return acc;
        acc.push({ key: to, to, label });
        return acc;
      },
      [],
    );

  const antdBreadcrumbItems = [
    {
      key: "/dashboard",
      title: (
        <Link to="/dashboard" className="antd-breadcrumb-home-link">
          <HomeOutlined style={{ fontSize: 13 }} />
          <span>{t("layout.topbar.home")}</span>
        </Link>
      ),
    },
    ...breadcrumbItems.map((item, index) => ({
      key: item.key,
      title:
        index < breadcrumbItems.length - 1 ? (
          <Link to={item.to}>{item.label}</Link>
        ) : (
          <span>{item.label}</span>
        ),
    })),
  ];

  // ── Notification dropdown content ────────────────────────────────
  const notifDropdown = (
    <div
      style={{
        width: 320,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        border: "1px solid #f1f5f9",
        background: "#fff",
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #f1f5f9",
        }}>
        <Typography.Text strong style={{ fontSize: 13 }}>
          {t("layout.topbar.notifications")}
          {unreadCount > 0 && (
            <Badge
              count={unreadCount}
              style={{
                marginLeft: 8,
                background: "#eff6ff",
                color: "#0078ff",
                boxShadow: "none",
                fontSize: 11,
              }}
            />
          )}
        </Typography.Text>
        {unreadCount > 0 && (
          <Typography.Link
            onClick={() => markAsRead("ALL")}
            style={{ fontSize: 11 }}>
            {t("layout.topbar.mark_all_read")}
          </Typography.Link>
        )}
      </div>

      <List
        style={{ maxHeight: 320, overflowY: "auto" }}
        dataSource={notifications}
        locale={{
          emptyText: (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 13,
              }}>
              {t("layout.topbar.no_notifications")}
            </div>
          ),
        }}
        renderItem={(n) => (
          <List.Item
            key={n.notificationId}
            onClick={() => !n.read && markAsRead(n.notificationId)}
            style={{
              padding: "10px 16px",
              cursor: n.read ? "default" : "pointer",
              background: n.read ? "#fff" : "#f0f7ff",
              borderBottom: "1px solid #f8fafc",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = "#f8fafc")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.background = n.read
                ? "#fff"
                : "#f0f7ff")
            }>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              {!n.read && (
                <span
                  style={{
                    marginTop: 6,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#0078ff",
                    flexShrink: 0,
                    display: "block",
                  }}
                />
              )}
              <div style={{ marginLeft: n.read ? 14 : 0 }}>
                <Typography.Text
                  strong
                  style={{ fontSize: 13, display: "block" }}>
                  {n.title}
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                  {n.body}
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 11, marginTop: 2, display: "block" }}>
                  {dayjs(n.createdAt).locale(dayjsLocale).fromNow()}
                </Typography.Text>
              </div>
            </div>
          </List.Item>
        )}
      />

      <div
        style={{
          borderTop: "1px solid #f1f5f9",
          padding: "8px 16px",
          textAlign: "center",
        }}>
        <Link to="/notifications" style={{ fontSize: 12, color: "#0078ff" }}>
          {t("layout.topbar.view_all_notifications")}
        </Link>
      </div>
    </div>
  );

  // ── User dropdown menu ────────────────────────────────────────────
  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div style={{ padding: "4px 0", pointerEvents: "none" }}>
          <Typography.Text strong style={{ fontSize: 13, display: "block" }}>
            {currentUser?.name ?? t("layout.user.guest")}
          </Typography.Text>
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 11,
              maxWidth: 180,
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
            {currentUser?.email ?? ""}
          </Typography.Text>
        </div>
      ),
      disabled: true,
      style: { cursor: "default" },
    },
    { type: "divider" },
    {
      key: "profile",
      icon: <UserOutlined />,
      label: (
        <Link to="/profile" style={{ fontSize: 13 }}>
          {t("nav.profile")}
        </Link>
      ),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: (
        <Link to="/settings/notifications" style={{ fontSize: 13 }}>
          {t("nav.settings")}
        </Link>
      ),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined style={{ color: "#ef4444" }} />,
      label: (
        <span style={{ fontSize: 13, color: "#ef4444" }}>
          {t("auth.logout")}
        </span>
      ),
      onClick: handleLogout,
    },
  ];

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-slate-800 bg-slate-900 px-4 md:px-6">
      <div className="flex h-full items-center justify-between gap-4">
        {/* Left — menu button · module pill · divider · breadcrumb */}
        <div className="flex min-w-0 items-center gap-2.5">
          {/* Mobile sidebar toggle */}
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onMenuClick}
            aria-label={t("layout.topbar.open_sidebar")}>
            <Menu className="h-5 w-5" />
          </button>

          {/* Module context pill — hidden on mobile */}
          {moduleContext && (
            <>
              <span className="hidden items-center gap-1.5 rounded-md border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 sm:flex">
                <moduleContext.icon
                  className="h-3 w-3 shrink-0 text-blue-400"
                  strokeWidth={2.5}
                />
                <span className="text-[11px] font-semibold tracking-wide text-blue-400">
                  {t(moduleContext.titleKey)}
                </span>
              </span>
              <span className="hidden h-4 w-px shrink-0 bg-slate-700 sm:block" />
            </>
          )}

          {/* Animated antd Breadcrumb — key=pathname re-triggers animation on route change */}
          <div
            key={pathname}
            className="antd-breadcrumb-animated min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Breadcrumb
              items={antdBreadcrumbItems}
              style={{ fontSize: 13, whiteSpace: "nowrap" }}
            />
          </div>
        </div>

        {/* Right — role/tenant · language · notifications · user */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <RoleTenantSwitcher />
          </div>

          <LanguageSwitcher />

          {/* Notifications */}
          <Dropdown
            dropdownRender={() => notifDropdown}
            trigger={["click"]}
            placement="bottomRight">
            <Badge
              count={unreadCount > 9 ? "9+" : unreadCount}
              size="small"
              style={{ background: "#1d4ed8" }}>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                aria-label={t("layout.topbar.notifications")}>
                <BellOutlined style={{ fontSize: 17 }} />
              </button>
            </Badge>
          </Dropdown>

          {/* User menu */}
          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={["click"]}
            placement="bottomRight"
            overlayStyle={{ borderRadius: 12, minWidth: 200 }}>
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/10"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <Avatar
                size={28}
                style={{
                  background: "#1d4ed8",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                {initials}
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-slate-200 md:block">
                {currentUser?.name ?? t("layout.user.guest")}
              </span>
              <DownOutlined
                className="hidden md:block"
                style={{ fontSize: 9, color: "#64748b" }}
              />
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

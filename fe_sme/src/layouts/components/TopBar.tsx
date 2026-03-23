import { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate, Link, matchPath } from "react-router-dom";
import { Bell, House, LogOut, Menu, Settings, User } from "lucide-react";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { apiLogout } from "@/api/identity/identity.api";
import { RoleTenantSwitcher } from "./RoleTenantSwitcher";
import { useGlobalStore } from "@/stores/global.store";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NAV_SECTIONS } from "../nav.config";
import "./TopBarBreadcrumb.css";

// Static route map — computed once at module level
const breadcrumbRouteMap = NAV_SECTIONS.flatMap((section) => {
  const routes: Array<{ to: string; titleKey: string }> = [];
  if (section.to) routes.push({ to: section.to, titleKey: section.titleKey });
  for (const child of section.children ?? []) {
    routes.push({ to: child.to, titleKey: child.titleKey });
  }
  return routes;
});

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
  const navigate = useNavigate();
  const logoutStore = useUserStore((s) => s.logout);
  const currentUser = useUserStore((s) => s.currentUser);
  const breadcrumbs = useGlobalStore((s) => s.breadcrumbs);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    try {
      await apiLogout();
    } finally {
      logoutStore();
      navigate("/login", { replace: true });
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

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
      {/* Left */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 lg:hidden"
            onClick={onMenuClick}
            aria-label={t("layout.topbar.open_sidebar")}>
            <Menu className="h-5 w-5" />
          </button>

          <div className="topbar-crumb-wrap min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="custom-breadcrumbs">
              <ul>
                <li className="breadcrumbs__item breadcrumbs__home">
                  <Link
                    to="/dashboard"
                    className="breadcrumbs__home-link"
                    title={t("layout.topbar.home")}>
                    <House className="h-3.5 w-3.5" />
                    <span className="ml-1">{t("layout.topbar.home")}</span>
                  </Link>
                </li>

                {breadcrumbItems.map((item, index) => {
                  const isLast = index === breadcrumbItems.length - 1;
                  return (
                    <li
                      key={item.key}
                      className="breadcrumbs__item"
                      title={item.label}>
                      {isLast ? (
                        <span
                          className="breadcrumbs__link breadcrumbs__link--current"
                          aria-current="page">
                          {item.label}
                        </span>
                      ) : (
                        <Link to={item.to} className="breadcrumbs__link">
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <RoleTenantSwitcher />
          </div>
          <LanguageSwitcher />

          <Link
            to="/settings/notifications"
            aria-label={t("layout.topbar.notifications")}
            className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />
          </Link>

          {/* User avatar dropdown */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2 py-1.5 transition hover:bg-slate-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[12px] font-semibold text-white">
                {initials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-[13px] font-medium leading-tight text-slate-800">
                  {currentUser?.name ?? t("layout.user.guest")}
                </p>
                <p className="text-[11px] leading-tight text-slate-500">
                  {currentUser?.email ?? ""}
                </p>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-[13px] font-medium text-slate-800">
                    {currentUser?.name ?? t("layout.user.guest")}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {currentUser?.email ?? ""}
                  </p>
                </div>
                <div className="py-1">
                  <NavLink
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                    <User className="h-4 w-4" />
                    {t("nav.profile")}
                  </NavLink>
                  <NavLink
                    to="/settings/notifications"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                    <Settings className="h-4 w-4" />
                    {t("nav.settings")}
                  </NavLink>
                </div>
                <div className="border-t border-slate-100 py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 transition hover:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    {t("auth.logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

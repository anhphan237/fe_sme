import { useMemo, useState } from "react";
import { LifeBuoy, X, Layers } from "lucide-react";
import { clsx } from "clsx";
import { Link, useLocation } from "react-router-dom";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { hasRequiredRole } from "@/shared/rbac";
import { NAV_SECTIONS } from "../nav.config";
import type { NavSection } from "../nav.config";
import { SidebarNavSection } from "./SidebarNavSection";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const { t } = useLocale();
  const location = useLocation();
  const currentUser = useUserStore((s) => s.currentUser);
  const userRoles = currentUser?.roles ?? [];
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({});

  const visibleSections = useMemo<NavSection[]>(() => {
    return NAV_SECTIONS.map((section) => {
      const allowed = hasRequiredRole(userRoles, section.requiredRoles);
      const children = section.children?.filter((c) =>
        hasRequiredRole(userRoles, c.requiredRoles),
      );
      if (section.to) return allowed ? section : null;
      if (children && children.length > 0) return { ...section, children };
      return null;
    }).filter(Boolean) as NavSection[];
  }, [userRoles]);

  const isSectionOpen = (section: NavSection): boolean => {
    if (sectionOpen[section.titleKey] !== undefined)
      return sectionOpen[section.titleKey];
    const paths = section.to
      ? [section.to]
      : (section.children?.map((c) => c.to) ?? []);
    return paths.some(
      (p) => location.pathname === p || location.pathname.startsWith(p + "/"),
    );
  };

  const toggleSection = (key: string) =>
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SM";

  return (
    <>
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 flex h-screen w-72 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950 transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}>
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800/90 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-semibold tracking-tight text-white">
                {t("app.name")}
              </p>
              <p className="text-[11px] text-slate-400">
                {t("nav.onboarding")}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label={t("layout.sidebar.close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/30 text-xs font-semibold text-white">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-100">
                  {currentUser?.name ?? t("layout.user.guest")}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {currentUser?.email ?? t("layout.sidebar.role_hint")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {t("layout.sidebar.navigation")}
          </p>
          {visibleSections.map((section) => (
            <SidebarNavSection
              key={section.titleKey}
              section={section}
              open={isSectionOpen(section)}
              onToggle={() => toggleSection(section.titleKey)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-800 px-3 py-4">
          <Link
            to="/settings/notifications"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-slate-400 transition-colors hover:bg-slate-900 hover:text-white">
            <LifeBuoy className="h-4 w-4" />
            {t("layout.sidebar.support")}
          </Link>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}

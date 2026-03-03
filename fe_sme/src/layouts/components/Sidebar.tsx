import { useMemo, useState } from "react";
import { LifeBuoy, X, Layers } from "lucide-react";
import { clsx } from "clsx";
import { useLocation } from "react-router-dom";
import { useLocale } from "@/i18n";
import { useAppStore } from "@/store/useAppStore";
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
  const currentUser = useAppStore((s) => s.currentUser);
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

  return (
    <>
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#0f172a] transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}>
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-white">
              SME Workspace
            </span>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
        <div className="shrink-0 border-t border-white/10 px-3 py-4">
          <a
            href="/support"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-white/50 transition-colors hover:bg-white/10 hover:text-white/90">
            <LifeBuoy className="h-4 w-4" />
            {t("nav.support")}
          </a>
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

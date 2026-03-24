import { NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { Tooltip } from "antd";
import { useLocale } from "@/i18n";
import type { NavSection } from "../nav.config";

type Props = {
  section: NavSection;
  open: boolean;
  onToggle: () => void;
  collapsed: boolean;
};

export function SidebarNavSection({
  section,
  open,
  onToggle,
  collapsed,
}: Props) {
  const { t } = useLocale();
  const hasChildren = section.children && section.children.length > 0;

  if (section.to && !hasChildren) {
    if (collapsed) {
      return (
        <Tooltip title={t(section.titleKey)} placement="right">
          <NavLink
            to={section.to}
            className={({ isActive }) =>
              clsx(
                "mb-1 flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                isActive
                  ? "bg-brand/25 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white",
              )
            }>
            <section.icon className="h-[18px] w-[18px] shrink-0" />
          </NavLink>
        </Tooltip>
      );
    }

    return (
      <NavLink
        to={section.to}
        className={({ isActive }) =>
          clsx(
            "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
            isActive
              ? "bg-brand/25 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
              : "text-slate-300 hover:bg-slate-900 hover:text-white",
          )
        }>
        <section.icon className="h-[18px] w-[18px] shrink-0 transition-colors" />
        {t(section.titleKey)}
      </NavLink>
    );
  }

  if (!hasChildren) return null;

  if (collapsed) {
    return (
      <Tooltip title={t(section.titleKey)} placement="right">
        <button
          type="button"
          onClick={onToggle}
          className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-900 hover:text-white">
          <section.icon className="h-[18px] w-[18px] shrink-0" />
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="mb-1.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-slate-900">
        <section.icon className="h-[18px] w-[18px] shrink-0 text-slate-500" />
        <span className="flex-1 text-[13px] font-medium text-slate-300">
          {t(section.titleKey)}
        </span>
        <ChevronDown
          className={clsx(
            "h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={clsx(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}>
        <div className="ml-3 mt-1 space-y-1 border-l border-slate-800 pl-4 pb-1">
          {section.children!.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center rounded-lg py-2 pr-3 text-[13px] transition-all",
                  isActive
                    ? "font-medium text-white"
                    : "text-slate-400 hover:text-slate-100",
                )
              }>
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      "mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                      isActive ? "bg-brand" : "bg-slate-700",
                    )}
                  />
                  {t(child.titleKey)}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

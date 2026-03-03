import { NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useLocale } from "@/i18n";
import type { NavSection } from "../nav.config";

type Props = {
  section: NavSection;
  open: boolean;
  onToggle: () => void;
};

export function SidebarNavSection({ section, open, onToggle }: Props) {
  const { t } = useLocale();
  const hasChildren = section.children && section.children.length > 0;

  if (section.to && !hasChildren) {
    return (
      <NavLink
        to={section.to}
        className={({ isActive }) =>
          clsx(
            "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
            isActive
              ? "bg-indigo-500/20 text-indigo-300"
              : "text-white/60 hover:bg-white/8 hover:text-white/90",
          )
        }>
        <section.icon
          className={clsx("h-[18px] w-[18px] shrink-0 transition-colors")}
        />
        {t(section.titleKey)}
      </NavLink>
    );
  }

  if (!hasChildren) return null;

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-white/8">
        <section.icon className="h-[18px] w-[18px] shrink-0 text-white/40" />
        <span className="flex-1 text-[13px] font-medium text-white/60">
          {t(section.titleKey)}
        </span>
        <ChevronDown
          className={clsx(
            "h-3.5 w-3.5 shrink-0 text-white/30 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={clsx(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}>
        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-4 pb-1">
          {section.children!.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center rounded-md py-2 pr-3 text-[13px] transition-all",
                  isActive
                    ? "font-medium text-indigo-300"
                    : "text-white/50 hover:text-white/80",
                )
              }>
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      "mr-2.5 h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                      isActive ? "bg-indigo-400" : "bg-white/20",
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

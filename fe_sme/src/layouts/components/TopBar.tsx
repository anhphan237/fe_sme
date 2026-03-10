import { useRef, useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Settings, User } from "lucide-react";
import { useLocale } from "@/i18n";
import { useUserStore } from "@/stores/user.store";
import { apiLogout } from "@/api/identity/identity.api";
import { RoleTenantSwitcher } from "@/components/common/RoleTenantSwitcher";
import { Breadcrumbs } from "@/components/ui/Breadcrumb";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Props = {
  pathname: string;
  onMenuClick: () => void;
};

export function TopBar({ pathname, onMenuClick }: Props) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const logoutStore = useUserStore((s) => s.logout);
  const currentUser = useUserStore((s) => s.currentUser);
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

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 shadow-sm">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open sidebar">
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumbs pathname={pathname} />
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <RoleTenantSwitcher />
        <LanguageSwitcher />

        {/* Notification */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-gray-200" />

        {/* User avatar dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-[12px] font-semibold text-white">
              {initials}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-[13px] font-medium leading-tight text-gray-800">
                {currentUser?.name ?? "User"}
              </p>
              <p className="text-[11px] leading-tight text-gray-400">
                {currentUser?.email ?? ""}
              </p>
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-[13px] font-medium text-gray-800">
                  {currentUser?.name ?? "User"}
                </p>
                <p className="truncate text-[11px] text-gray-400">
                  {currentUser?.email ?? ""}
                </p>
              </div>
              <div className="py-1">
                <NavLink
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-600 transition hover:bg-gray-50 hover:text-gray-900">
                  <User className="h-4 w-4" />
                  {t("nav.profile")}
                </NavLink>
                <NavLink
                  to="/settings/notifications"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-gray-600 transition hover:bg-gray-50 hover:text-gray-900">
                  <Settings className="h-4 w-4" />
                  {t("nav.settings")}
                </NavLink>
              </div>
              <div className="border-t border-gray-100 py-1">
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
    </header>
  );
}

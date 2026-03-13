import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";

export { LangSwitcher };

export const RegisterTopBar = () => {
  const { t } = useLocale();

  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand to-brandDark flex items-center justify-center">
          <svg viewBox="0 0 20 20" fill="none" className="w-3 h-3">
            <rect
              x="3"
              y="2"
              width="14"
              height="16"
              rx="2.5"
              stroke="white"
              strokeWidth="1.8"
            />
            <path
              d="M7 7h6M7 10.5h6M7 14h4"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="text-[14px] font-bold text-gray-900">
          Onboard<span className="text-brand">IQ</span>
        </span>
      </div>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <LangSwitcher />
        <div className="flex items-center gap-2 text-[13px] text-gray-500">
          <span>{t("register.topbar.have_account")}</span>
          <Link
            to="/login"
            className="font-semibold text-brand hover:text-brandDark transition-colors">
            {t("register.topbar.sign_in")}
          </Link>
        </div>
      </div>
    </div>
  );
};

import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";
import { LangSwitcher } from "@/components/LangSwitcher";
import BrandLogo from "@/components/BrandLogo";

export { LangSwitcher };

export const RegisterTopBar = () => {
  const { t } = useLocale();

  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="lg:hidden">
        <BrandLogo variant="compact" asLink={false} />
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

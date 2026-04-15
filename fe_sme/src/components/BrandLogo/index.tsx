import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";

interface BrandLogoProps {
  variant?: "compact" | "full";
  asLink?: boolean;
  to?: string;
}

/** Compact variant — small logo for top bar (mobile) */
const CompactLogo = () => (
  <div className="flex items-center gap-2">
    <img src="/Logo.png" className="w-9 h-9 object-contain" alt="logo" />
    <span className="text-[14px] font-bold text-gray-900">
      Onboard<span className="text-brand">IQ</span>
    </span>
  </div>
);

/** Full variant — large logo with subtitle for sidebar */
const FullLogo = () => {
  const { t } = useLocale();
  return (
    <div className="flex items-center gap-2.5">
      <img src="/Logo.png" className="w-12 h-12 object-contain" alt="logo" />
      <div className="flex flex-col leading-none">
        <span className="text-[17px] font-bold text-white tracking-tight">
          Onboard<span className="text-brand">IQ</span>
        </span>
        <span className="text-[9px] font-semibold text-white/40 uppercase tracking-[0.2em]">
          {t("app.platform_subtitle", { defaultValue: "SME Platform" })}
        </span>
      </div>
    </div>
  );
};

const BrandLogo = ({
  variant = "compact",
  asLink = true,
  to = "/",
}: BrandLogoProps) => {
  const inner = variant === "full" ? <FullLogo /> : <CompactLogo />;

  if (!asLink) return <>{inner}</>;

  return (
    <Link to={to} className="group w-fit">
      {inner}
    </Link>
  );
};

export default BrandLogo;
